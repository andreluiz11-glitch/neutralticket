import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Arquivo ausente." }, { status: 400 });
    }

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const f = file as unknown as File;
    if (!allowed.includes(f.type)) {
      return NextResponse.json({ error: "Tipo de arquivo inválido." }, { status: 400 });
    }

    const bytes = await (f as File).arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
    const name = crypto.randomBytes(8).toString("hex") + "." + ext;

    const filepath = path.join(uploadsDir, name);
    await writeFile(filepath, buffer);

    const publicUrl = "/uploads/" + name;
    return NextResponse.json({ url: publicUrl }, { status: 201 });
  } catch (err) {
    console.error("UPLOAD_ERR", err);
    return NextResponse.json({ error: "Falha no upload." }, { status: 500 });
  }
}
