import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");

const MIME: Record<string, string> = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".pdf": "application/pdf",
    ".mp3": "audio/mpeg",
};

export async function GET(req: NextRequest, { params }: { params: { filename: string } }) {
    const filename = params.filename;
    if (!filename || filename.includes("..") || filename.includes("/")) {
          return NextResponse.json({ error: "Nama file tidak valid" }, { status: 400 });
    }

  try {
        const filePath = path.join(uploadsDir, filename);
        const data = await readFile(filePath);
        const ext = path.extname(filename).toLowerCase();
        const contentType = MIME[ext] || "application/octet-stream";
        return new NextResponse(data as any, {
                headers: {
                          "Content-Type": contentType,
                          "Cache-Control": "public, max-age=31536000, immutable",
                },
        });
  } catch {
        return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
  }
}
