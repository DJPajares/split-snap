// ─── Currency utilities ────────────────────────────────────

export interface CurrencyInfo {
  code: string;
  name: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'TWD', name: 'New Taiwan Dollar' },
  { code: 'VND', name: 'Vietnamese Dong' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'MXN', name: 'Mexican Peso' },
];

export const CURRENCY_LOCALE_MAPPING = {
  AED: 'ar-AE',
  AFN: 'ps-AF',
  ALL: 'sq-AL',
  AMD: 'hy-AM',
  ANG: 'nl-AW',
  AOA: 'pt-AO',
  ARS: 'es-AR',
  AUD: 'en-AU',
  AWG: 'nl-AW',
  AZN: 'az-AZ',
  BAM: 'bs-Latn-BA',
  BBD: 'en-BB',
  BDT: 'bn-BD',
  BGN: 'bg-BG',
  BHD: 'ar-BH',
  BIF: 'fr-BI',
  BMD: 'en-BM',
  BND: 'ms-BN',
  BOB: 'es-BO',
  BRL: 'pt-BR',
  BSD: 'en-BS',
  BTN: 'dz-BT',
  BWP: 'en-BW',
  BYN: 'be-BY',
  BZD: 'en-BZ',
  CAD: 'en-CA',
  CDF: 'fr-CD',
  CHF: 'de-CH',
  CLP: 'es-CL',
  CNY: 'zh-CN',
  COP: 'es-CO',
  CRC: 'es-CR',
  CUP: 'es-CU',
  CVE: 'pt-CV',
  CZK: 'cs-CZ',
  DJF: 'fr-DJ',
  DKK: 'da-DK',
  DOP: 'es-DO',
  DZD: 'ar-DZ',
  EGP: 'ar-EG',
  ERN: 'aa-ER',
  ETB: 'am-ET',
  EUR: 'de-DE',
  FJD: 'en-FJ',
  FKP: 'en-FK',
  GBP: 'en-GB',
  GEL: 'ka-GE',
  GHS: 'ak-GH',
  GIP: 'en-GI',
  GMD: 'en-GM',
  GNF: 'fr-GN',
  GTQ: 'es-GT',
  GYD: 'en-GY',
  HKD: 'zh-HK',
  HNL: 'es-HN',
  HRK: 'hr-HR',
  HTG: 'fr-HT',
  HUF: 'hu-HU',
  IDR: 'id-ID',
  ILS: 'he-IL',
  INR: 'hi-IN',
  IQD: 'ar-IQ',
  IRR: 'fa-IR',
  ISK: 'is-IS',
  JMD: 'en-JM',
  JOD: 'ar-JO',
  JPY: 'ja-JP',
  KES: 'sw-KE',
  KGS: 'ky-KG',
  KHR: 'km-KH',
  KID: 'en-KI',
  KMF: 'fr-KM',
  KRW: 'ko-KR',
  KWD: 'ar-KW',
  KYD: 'en-KY',
  KZT: 'kk-KZ',
  LAK: 'lo-LA',
  LBP: 'ar-LB',
  LKR: 'si-LK',
  LRD: 'en-LR',
  LSL: 'st-LS',
  LYD: 'ar-LY',
  MAD: 'ar-MA',
  MDL: 'ro-MD',
  MGA: 'mg-MG',
  MKD: 'mk-MK',
  MMK: 'my-MM',
  MNT: 'mn-MN',
  MOP: 'zh-MO',
  MRU: 'ar-MR',
  MUR: 'mfe-MU',
  MVR: 'dv-MV',
  MWK: 'ny-MW',
  MXN: 'es-MX',
  MYR: 'ms-MY',
  MZN: 'pt-MZ',
  NAD: 'naq-NA',
  NGN: 'ig-NG',
  NIO: 'es-NI',
  NOK: 'nb-NO',
  NPR: 'ne-NP',
  NZD: 'en-NZ',
  OMR: 'ar-OM',
  PAB: 'es-PA',
  PEN: 'es-PE',
  PGK: 'en-PG',
  PHP: 'fil-PH',
  PKR: 'ur-PK',
  PLN: 'pl-PL',
  PYG: 'gn-PY',
  QAR: 'ar-QA',
  RON: 'ro-RO',
  RSD: 'sr-Latn-RS',
  RUB: 'ru-RU',
  RWF: 'rw-RW',
  SAR: 'ar-SA',
  SBD: 'en-SB',
  SCR: 'crs-SC',
  SDG: 'ar-SD',
  SEK: 'sv-SE',
  SGD: 'en-SG',
  SHP: 'en-SH',
  SLL: 'kri-SL',
  SOS: 'so-SO',
  SRD: 'srn-SR',
  SSP: 'ar-SS',
  STN: 'pt-ST',
  SYP: 'ar-SY',
  SZL: 'ss-SZ',
  THB: 'th-TH',
  TJS: 'tg-TJ',
  TMT: 'tk-TM',
  TND: 'ar-TN',
  TOP: 'to-TO',
  TRY: 'tr-TR',
  TTD: 'en-TT',
  TWD: 'zh-TW',
  TZS: 'sw-TZ',
  UAH: 'uk-UA',
  UGX: 'lg-UG',
  USD: 'en-US',
  UYU: 'es-UY',
  UZS: 'uz-UZ',
  VES: 'es-VE',
  VND: 'vi-VN',
  VUV: 'bi-VU',
  WST: 'sm-WS',
  XAF: 'fr-XA',
  XCD: 'en-XC',
  XOF: 'fr-XO',
  XPF: 'fr-PF',
  YER: 'ar-YE',
  ZAR: 'af-ZA',
  ZMW: 'bem-ZM',
  ZWL: 'sn-ZW',
};

type ExtendedNumberFormatOptions = Intl.NumberFormatOptions & {
  roundingPriority?: 'auto' | 'morePrecision' | 'lessPrecision' | undefined;
  roundingIncrement?:
    | 1
    | 2
    | 5
    | 10
    | 20
    | 25
    | 50
    | 100
    | 200
    | 250
    | 500
    | 1000
    | 2000
    | 2500
    | 5000
    | undefined;
  roundingMode?:
    | 'ceil'
    | 'floor'
    | 'expand'
    | 'trunc'
    | 'halfCeil'
    | 'halfFloor'
    | 'halfExpand'
    | 'halfTrunc'
    | 'halfEven'
    | undefined;
  trailingZeroDisplay?: 'auto' | 'stripIfInteger' | undefined;
};

type FormatCurrencyProps = {
  value: number;
  currency: string;
  decimal?: number;
};

export const formatCurrency = ({
  value,
  currency,
  decimal = 0,
}: FormatCurrencyProps) => {
  const locale =
    CURRENCY_LOCALE_MAPPING[currency as keyof typeof CURRENCY_LOCALE_MAPPING];

  const options: ExtendedNumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: decimal,
    maximumFractionDigits: decimal,
    trailingZeroDisplay: 'stripIfInteger',
    roundingMode: 'ceil',
  };

  return new Intl.NumberFormat(locale, options).format(value);
};

export const getCurrencySymbol = (currencyCode: string): string | undefined => {
  try {
    // Format a dummy amount (e.g., 0) with the specified currency and style
    const locale =
      CURRENCY_LOCALE_MAPPING[
        currencyCode as keyof typeof CURRENCY_LOCALE_MAPPING
      ];

    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'symbol',
    });

    // Extract the currency symbol from the formatted string using formatToParts
    const parts = formatter.formatToParts(0);
    const currencyPart = parts.find((part) => part.type === 'currency');

    return currencyPart ? currencyPart.value : undefined;
  } catch (error) {
    // Handle cases where the currency code or locale might be invalid
    console.error(`Error getting symbol for ${currencyCode}:`, error);
    return undefined;
  }
};
