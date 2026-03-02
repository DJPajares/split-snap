import type { ScanResult } from '../lib/types.js';
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

// ─── Sanitize parsed result ──────────────────────────────────

function sanitizeResult(parsed: ScanResult): ScanResult {
  return {
    items: (parsed.items || []).map((item) => ({
      name: String(item.name || 'Unknown item'),
      price: Math.max(0, Number(item.price) || 0),
      quantity: Math.max(1, Math.round(Number(item.quantity) || 1))
    })),
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

    return sanitizeResult(parseReceiptText(text));
  }
};

// ─── Receipt text parser (for Tesseract) ─────────────────────

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

  // Patterns for summary lines
  const subtotalPattern =
    /^(?:sub\s*total|subtotal)\s*[:\s]*\$?\s*([\d]+[.,]\d{2})/i;
  const taxPattern =
    /^(?:tax|sales\s*tax|hst|gst|vat)\s*[:\s]*\$?\s*([\d]+[.,]\d{2})/i;
  const tipPattern =
    /^(?:tip|gratuity|service\s*charge)\s*[:\s]*\$?\s*([\d]+[.,]\d{2})/i;
  const totalPattern =
    /^(?:total|amount\s*due|balance\s*due|grand\s*total)\s*[:\s]*\$?\s*([\d]+[.,]\d{2})/i;

  // Pattern for item lines: "Item name    $12.99" or "2x Item name    $25.98"
  const itemPattern =
    /^(?:(\d+)\s*[xX×]\s*)?(.+?)\s+\$?\s*([\d]+[.,]\d{2})\s*$/;

  for (const line of lines) {
    // Try summary lines first
    let match = line.match(subtotalPattern);
    if (match) {
      subtotal = parseFloat(match[1].replace(',', '.'));
      continue;
    }

    match = line.match(taxPattern);
    if (match) {
      tax = parseFloat(match[1].replace(',', '.'));
      continue;
    }

    match = line.match(tipPattern);
    if (match) {
      tip = parseFloat(match[1].replace(',', '.'));
      continue;
    }

    match = line.match(totalPattern);
    if (match) {
      total = parseFloat(match[1].replace(',', '.'));
      continue;
    }

    // Try item line
    match = line.match(itemPattern);
    if (match) {
      const quantity = match[1] ? parseInt(match[1], 10) : 1;
      const name = match[2].replace(/[.\s]+$/, '').trim();
      const price = parseFloat(match[3].replace(',', '.'));

      // Filter out obvious non-items
      if (
        name.length >= 2 &&
        price > 0 &&
        !/^(cash|card|change|visa|mastercard|amex|debit|credit|payment)/i.test(
          name
        )
      ) {
        items.push({ name, price, quantity });
      }
    }
  }

  // Calculate subtotal from items if not found
  if (subtotal === 0 && items.length > 0) {
    subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    subtotal = Math.round(subtotal * 100) / 100;
  }

  // Calculate total if not found
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
