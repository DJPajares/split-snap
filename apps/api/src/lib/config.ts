export const config = {
  PORT: parseInt(process.env.API_PORT || "3001", 10),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/split-snap",
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-in-production",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || "",
  RECEIPT_SCANNER_PROVIDER: (process.env.RECEIPT_SCANNER_PROVIDER || "auto") as
    | "auto"
    | "gemini"
    | "openai"
    | "tesseract",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
} as const;
