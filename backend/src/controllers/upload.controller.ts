import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function uploadFile(req: Request, res: Response) {
  const { base64, fileName } = req.body;
  if (!base64 || !fileName) {
    return res.status(400).json({ error: "Missing file data" });
  }

  try {
    const buffer = Buffer.from(base64, "base64");
    const ext = path.extname(fileName);
    const uniqueName = `${crypto.randomBytes(16).toString("hex")}${ext}`;
    
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(filePath, buffer);

    const port = process.env.PORT || 5000;
    const serverUrl = `http://localhost:${port}`;
    return res.json({
      success: true,
      url: `${serverUrl}/uploads/${uniqueName}`,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to upload file" });
  }
}
