import type { ScanResult } from '@split-snap/shared';
import { config } from '../lib/config.js';
import { createWorker } from 'tesseract.js';

// ─── Shared prompt for AI providers ─────────────────────────

const SCAN_PROMPT = `You are a receipt parser. Analyze this receipt image and extract all line items with their details.

Return a JSON object with this exact structure:
{
  "items": [
    { "name": "Item name", "price": 12.99, "quantity": 1 }
  ],
  "subtotal": 45.97,
  "tax": 3.68,
  "tip": 0,
  "total": 49.65
}

Rules:
- Price should be the unit price (not total for multiple quantities)
- All numbers should be plain numbers (no currency symbols)
- If you can't determine the quantity, default to 1
- If tip is not on the receipt, set it to 0
- If tax is not visible, set it to 0
- If subtotal is not visible, calculate it from items
- If total is not visible, calculate it as subtotal + tax + tip
- Return ONLY the JSON object, no markdown or explanation`;

// ─── Provider interface ──────────────────────────────────────

interface ScanProvider {
  name: string;
  isAvailable(): boolean;
  scan(imageBase64: string, mimeType: string): Promise<ScanResult>;
}

// ─── Proper case conversion (for Tesseract OCR output) ───────

function toProperCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s|[-/])\S/g, (char) => char.toUpperCase());
}

// ─── Sanitize parsed result ──────────────────────────────────

function sanitizeResult(
  parsed: ScanResult,
  opts?: { properCaseNames?: boolean }
): ScanResult {
  return {
    items: (parsed.items || []).map((item) => {
      const name = String(item.name || 'Unknown item');
      return {
        name: opts?.properCaseNames ? toProperCase(name) : name,
        price: Math.max(0, Number(item.price) || 0),
        quantity: Math.max(1, Math.round(Number(item.quantity) || 1))
      };
    }),
    subtotal: Math.max(0, Number(parsed.subtotal) || 0),
    tax: Math.max(0, Number(parsed.tax) || 0),
    tip: Math.max(0, Number(parsed.tip) || 0),
    total: Math.max(0, Number(parsed.total) || 0)
  };
}

function extractJSON(text: string): ScanResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse AI response as JSON');
  }
  return JSON.parse(jsonMatch[0]) as ScanResult;
}

// ─── Gemini provider ─────────────────────────────────────────

const geminiProvider: ScanProvider = {
  name: 'gemini',

  isAvailable() {
    return !!config.GOOGLE_AI_API_KEY;
  },

  async scan(imageBase64: string, mimeType: string): Promise<ScanResult> {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: config.GOOGLE_AI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: SCAN_PROMPT },
            { inlineData: { data: imageBase64, mimeType } }
          ]
        }
      ]
    });

    const content = response.text;
    if (!content) {
      throw new Error('No response from Gemini model');
    }

    return sanitizeResult(extractJSON(content));
  }
};

// ─── OpenAI provider ─────────────────────────────────────────

const openaiProvider: ScanProvider = {
  name: 'openai',

  isAvailable() {
    return !!config.OPENAI_API_KEY;
  },

  async scan(imageBase64: string, mimeType: string): Promise<ScanResult> {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: SCAN_PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI model');
    }

    return sanitizeResult(extractJSON(content));
  }
};

// ─── Tesseract OCR provider ──────────────────────────────────

const tesseractProvider: ScanProvider = {
  name: 'tesseract',

  isAvailable() {
    return true; // Always available — no API key needed
  },

  async scan(imageBase64: string, _mimeType: string): Promise<ScanResult> {
    const worker = await createWorker('eng');
    const ret = await worker.recognize(Buffer.from(imageBase64, 'base64'));
    const text = ret.data.text;

    await worker.terminate();

    if (!text.trim()) {
      throw new Error('OCR could not extract any text from the image');
    }

    return sanitizeResult(parseReceiptText(text), { properCaseNames: true });
  }
};

// ─── Receipt text parser (for Tesseract) ─────────────────────

// Multi-character currency symbols (order matters — longest first to avoid partial matches)
const CURRENCY_SYMBOLS = [
  'HK\\$',
  'NT\\$',
  'NZ\\$',
  'Mex\\$',
  'A\\$',
  'C\\$',
  'R\\$',
  'S\\$',
  'RM',
  'Rp',
  '₱',
  '₹',
  '₩',
  '₫',
  '€',
  '£',
  '¥',
  '฿',
  '\\$'
];
const CURRENCY_PATTERN = `(?:${CURRENCY_SYMBOLS.join('|')})`;

// Helper to parse an amount string (handles comma as decimal separator)
function parseAmount(str: string): number {
  return parseFloat(str.replace(/,/g, '.'));
}

function parseReceiptText(text: string): ScanResult {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const items: { name: string; price: number; quantity: number }[] = [];
  let subtotal = 0;
  let tax = 0;
  let tip = 0;
  let total = 0;
  let taxPercent: number | null = null;
  let tipPercent: number | null = null;

  // ── Summary patterns ──────────────────────────────────────

  const subtotalPattern = new RegExp(
    `^(?:sub\\s*-?\\s*total|subtotal)\\s*[:\\s]*${CURRENCY_PATTERN}?\\s*([\\d]+[.,]\\d{1,2})`,
    'i'
  );

  // Tax: GST, SST, VAT, HST, PST, QST, sales tax, goods & services tax, consumption tax,
  //       G.S.T., S.S.T., incl. tax, excl. tax, tax incl, tax amt, tax amount
  const taxPattern = new RegExp(
    `^(?:g\\.?s\\.?t\\.?|s\\.?s\\.?t\\.?|v\\.?a\\.?t\\.?|h\\.?s\\.?t\\.?|p\\.?s\\.?t\\.?|q\\.?s\\.?t\\.?` +
      `|sales\\s*tax|goods\\s*(?:&|and)\\s*services?\\s*tax|consumption\\s*tax` +
      `|tax\\s*(?:incl(?:uded)?|excl(?:uded)?|amt|amount)?|incl\\.?\\s*tax|excl\\.?\\s*tax` +
      `)\\s*[:\\s]*(?:\\(?\\s*(\\d+(?:\\.\\d+)?)\\s*%\\s*\\)?\\s*(?:${CURRENCY_PATTERN}?\\s*([\\d]+[.,]\\d{1,2}))?|${CURRENCY_PATTERN}?\\s*([\\d]+[.,]\\d{1,2}))`,
    'i'
  );

  // Tip/service charge: service, svc, svc chg, svc charge, service chg, s/c, sc, serv. charge,
  //                     gratuity, grat, tip, service fee, srv chrg, auto grat, auto gratuity
  const tipPattern = new RegExp(
    `^(?:svc\\s*ch(?:a?r)?g(?:e)?|service\\s*ch(?:a?r)?g(?:e)?|service\\s*fee|serv\\.?\\s*ch(?:a?r)?g(?:e)?` +
      `|srv\\s*ch(?:a?r)?g(?:e)?|s\\/c|sc\\b|auto\\s*grat(?:uity)?|gratuity|grat\\b|tip|service)` +
      `\\s*[:\\s]*(?:\\(?\\s*(\\d+(?:\\.\\d+)?)\\s*%\\s*\\)?\\s*(?:${CURRENCY_PATTERN}?\\s*([\\d]+[.,]\\d{1,2}))?|${CURRENCY_PATTERN}?\\s*([\\d]+[.,]\\d{1,2}))`,
    'i'
  );

  // Total: total, grand total, amount due, balance due, net total, total due, total amount,
  //        bill total, amt due
  const totalPattern = new RegExp(
    `^(?:grand\\s*total|total\\s*(?:due|amount|amt)?|amount\\s*due|balance\\s*due|net\\s*total|bill\\s*total|amt\\s*due)` +
      `\\s*[:\\s]*${CURRENCY_PATTERN}?\\s*([\\d]+[.,]\\d{1,2})`,
    'i'
  );

  // ── Item line detection ───────────────────────────────────

  // A number with a currency symbol or decimal places → treat as amount
  const amountInLine = new RegExp(
    `(?:${CURRENCY_PATTERN})\\s*([\\d]+[.,]\\d{1,2})|([\\d]+[.,]\\d{1,2})\\s*$`,
    'i'
  );

  // A standalone whole number (not attached to currency or decimal) → quantity candidate
  const wholeNumberPattern = /(?:^|\s)(\d{1,3})(?:\s|$)/;

  // Classic pattern: "[Qty x] Name $Price" or "Qty Name Price"
  const classicItemPattern = new RegExp(
    `^(?:(\\d+)\\s*[xX×]\\s*)?(.+?)\\s+${CURRENCY_PATTERN}?\\s*([\\d]+[.,]\\d{1,2})\\s*$`
  );

  // Non-item keywords to filter out
  const nonItemKeywords =
    /^(cash|card|change|visa|mastercard|amex|debit|credit|payment|tendered|received|balance|round|rounding|discount|coupon|promo|subtotal|sub\s*total|total|tax|gst|sst|vat|hst|pst|qst|tip|gratuity|service|svc|grand)/i;

  // Track the last line with a currency-amount for total fallback
  let lastAmountLine: { lineIndex: number; amount: number } | null = null;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];

    // ── Try summary patterns first ──────────────────────

    let match = line.match(subtotalPattern);
    if (match) {
      subtotal = parseAmount(match[1]);
      continue;
    }

    match = line.match(taxPattern);
    if (match) {
      if (match[1]) {
        // Percentage-based tax
        taxPercent = parseFloat(match[1]);
        if (match[2]) {
          tax = parseAmount(match[2]);
        }
        // else: will compute from subtotal later
      } else if (match[3]) {
        tax = parseAmount(match[3]);
      }
      continue;
    }

    match = line.match(tipPattern);
    if (match) {
      if (match[1]) {
        // Percentage-based tip/service charge
        tipPercent = parseFloat(match[1]);
        if (match[2]) {
          tip = parseAmount(match[2]);
        }
        // else: will compute from subtotal later
      } else if (match[3]) {
        tip = parseAmount(match[3]);
      }
      continue;
    }

    match = line.match(totalPattern);
    if (match) {
      total = parseAmount(match[1]);
      continue;
    }

    // ── Try item line ───────────────────────────────────

    // Skip obvious non-item lines
    const trimmedLine = line
      .replace(new RegExp(`${CURRENCY_PATTERN}`, 'gi'), '')
      .trim();
    if (nonItemKeywords.test(trimmedLine)) {
      // Still track for total fallback
      const amountMatch = line.match(amountInLine);
      if (amountMatch) {
        const amt = parseAmount(amountMatch[1] || amountMatch[2]);
        lastAmountLine = { lineIndex, amount: amt };
      }
      continue;
    }

    // Try classic pattern first: "2x Chicken Rice $12.50" or "Chicken Rice $12.50"
    match = line.match(classicItemPattern);
    if (match) {
      const quantity = match[1] ? parseInt(match[1], 10) : 1;
      const name = match[2].replace(/[.\s]+$/, '').trim();
      const price = parseAmount(match[3]);

      if (name.length >= 2 && price > 0) {
        // If no explicit "Nx" prefix, look for a standalone whole number in the name
        // e.g. "Chicken Rice 2 $12.50" → qty=2
        if (!match[1]) {
          const qtyInName = name.match(/^(.+?)\s+(\d{1,3})$/);
          if (qtyInName) {
            const possibleQty = parseInt(qtyInName[2], 10);
            if (possibleQty >= 1 && possibleQty <= 999) {
              items.push({
                name: qtyInName[1].trim(),
                price,
                quantity: possibleQty
              });
              lastAmountLine = { lineIndex, amount: price };
              continue;
            }
          }
        }
        items.push({ name, price, quantity });
        lastAmountLine = { lineIndex, amount: price };
        continue;
      }
    }

    // Fallback: smart detection — find amount (decimal/currency) and optional whole number qty
    const amountMatch = line.match(amountInLine);
    if (amountMatch) {
      const price = parseAmount(amountMatch[1] || amountMatch[2]);
      if (price > 0) {
        // Remove the amount portion to get name + possible quantity
        let remaining = line
          .replace(
            new RegExp(`${CURRENCY_PATTERN}\\s*[\\d]+[.,]\\d{1,2}`, 'i'),
            ''
          )
          .replace(/[\d]+[.,]\d{1,2}\s*$/, '')
          .trim();

        let quantity = 1;
        // Check for leading whole number as quantity: "2 Chicken Rice"
        const leadingQty = remaining.match(/^(\d{1,3})\s+(.+)$/);
        if (leadingQty) {
          quantity = parseInt(leadingQty[1], 10);
          remaining = leadingQty[2].trim();
        } else {
          // Check for trailing whole number as quantity: "Chicken Rice 2"
          const trailingQty = remaining.match(/^(.+?)\s+(\d{1,3})$/);
          if (trailingQty) {
            quantity = parseInt(trailingQty[2], 10);
            remaining = trailingQty[1].trim();
          }
        }

        const name = remaining.replace(/[.\s]+$/, '').trim();

        if (name.length >= 2 && quantity >= 1 && !nonItemKeywords.test(name)) {
          items.push({ name, price, quantity });
          lastAmountLine = { lineIndex, amount: price };
        } else {
          lastAmountLine = { lineIndex, amount: price };
        }
      }
    }
  }

  // Calculate subtotal from items if not found
  if (subtotal === 0 && items.length > 0) {
    subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    subtotal = Math.round(subtotal * 100) / 100;
  }

  // Compute percentage-based tax/tip from subtotal
  if (tax === 0 && taxPercent !== null && subtotal > 0) {
    tax = Math.round(subtotal * (taxPercent / 100) * 100) / 100;
  }
  if (tip === 0 && tipPercent !== null && subtotal > 0) {
    tip = Math.round(subtotal * (tipPercent / 100) * 100) / 100;
  }

  // Total fallback: if no total matched by keyword, use the last decimal/currency number
  // (receipts typically end with the total)
  if (total === 0 && lastAmountLine) {
    const candidateTotal = lastAmountLine.amount;
    const computedTotal = subtotal + tax + tip;
    // Use the last amount if it's >= computed total (likely the receipt grand total)
    if (candidateTotal >= computedTotal && candidateTotal > subtotal) {
      total = candidateTotal;
    }
  }

  // Calculate total if still not found
  if (total === 0) {
    total = Math.round((subtotal + tax + tip) * 100) / 100;
  }

  return { items, subtotal, tax, tip, total };
}

// ─── Provider registry ───────────────────────────────────────

const providers: Record<string, ScanProvider> = {
  gemini: geminiProvider,
  openai: openaiProvider,
  tesseract: tesseractProvider
};

const autoOrder: ScanProvider[] = [
  geminiProvider,
  openaiProvider,
  tesseractProvider
];

// ─── Public API ──────────────────────────────────────────────

export function getActiveProvider(): string {
  const setting = config.RECEIPT_SCANNER_PROVIDER;

  if (setting !== 'auto') {
    const provider = providers[setting];
    if (provider?.isAvailable()) return provider.name;
    return 'none';
  }

  for (const p of autoOrder) {
    if (p.isAvailable()) return p.name;
  }

  return 'none';
}

export async function scanReceipt(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ScanResult & { provider: string }> {
  const setting = config.RECEIPT_SCANNER_PROVIDER;

  // Explicit provider
  if (setting !== 'auto') {
    const provider = providers[setting];
    if (!provider) {
      throw new Error(`Unknown scanner provider: ${setting}`);
    }
    if (!provider.isAvailable()) {
      throw new Error(
        `Scanner provider "${setting}" is not available. Check your API keys.`
      );
    }

    console.log(`📸 Scanning receipt with ${provider.name}...`);
    const result = await provider.scan(imageBase64, mimeType);
    return { ...result, provider: provider.name };
  }

  // Auto mode: try providers in priority order
  const errors: string[] = [];

  for (const provider of autoOrder) {
    if (!provider.isAvailable()) continue;

    try {
      console.log(`📸 Scanning receipt with ${provider.name}...`);
      const result = await provider.scan(imageBase64, mimeType);
      return { ...result, provider: provider.name };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const cause =
        err instanceof Error && err.cause ? ` (cause: ${err.cause})` : '';
      console.warn(
        `⚠️  ${provider.name} failed: ${msg}${cause}, trying next...`
      );
      errors.push(`${provider.name}: ${msg}${cause}`);
    }
  }

  throw new Error(
    `All scan providers failed.\n${errors.join('\n')}\nPlease enter items manually.`
  );
}

export async function scanReceiptTest(imageBase64: string) {
  const worker = await createWorker('eng');
  const ret = await worker.recognize(Buffer.from(imageBase64, 'base64'));
  const text = ret.data.text;

  await worker.terminate();

  if (!text.trim()) {
    throw new Error('OCR could not extract any text from the image');
  }

  return text;
}
