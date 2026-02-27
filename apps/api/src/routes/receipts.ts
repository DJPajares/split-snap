import { Hono } from "hono";
import { scanReceipt, getActiveProvider } from "../services/receipt-scanner.js";

export const receiptRoutes = new Hono();

// ─── Get active scanner provider ──────────────────────────

receiptRoutes.get("/provider", (c) => {
  return c.json({ provider: getActiveProvider() });
});

// ─── Scan receipt image ────────────────────────────────────

receiptRoutes.post("/scan", async (c) => {
  try {
    const contentType = c.req.header("Content-Type") || "";

    let imageBase64: string;
    let mimeType = "image/jpeg";

    if (contentType.includes("multipart/form-data")) {
      const formData = await c.req.formData();
      const file = formData.get("receipt") as File | null;
      if (!file) {
        return c.json({ error: "No receipt image provided" }, 400);
      }

      mimeType = file.type || "image/jpeg";
      const buffer = await file.arrayBuffer();
      imageBase64 = Buffer.from(buffer).toString("base64");
    } else {
      // Expect JSON with base64 image
      const body = await c.req.json();
      if (!body.image) {
        return c.json({ error: "No image data provided" }, 400);
      }
      imageBase64 = body.image;
      mimeType = body.mimeType || "image/jpeg";
    }

    const result = await scanReceipt(imageBase64, mimeType);
    return c.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to scan receipt";
    console.error("Receipt scan error:", err);
    return c.json({ error: message }, 500);
  }
});
