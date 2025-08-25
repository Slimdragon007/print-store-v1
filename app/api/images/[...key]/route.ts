import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
});
const BUCKET = process.env.R2_BUCKET!;

function guessType(k: string) {
  const x = k.toLowerCase();
  if (x.endsWith(".jpg") || x.endsWith(".jpeg")) return "image/jpeg";
  if (x.endsWith(".png")) return "image/png";
  if (x.endsWith(".webp")) return "image/webp";
  if (x.endsWith(".avif")) return "image/avif";
  if (x.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key?: string[] }> }) {
  try {
    const resolvedParams = await params;
    const key = resolvedParams.key?.join("/") || "";
    if (!key) return new NextResponse("Missing key", { status: 400 });

    let contentType: string | undefined;
    try {
      const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
      // @ts-ignore
      contentType = head.ContentType || undefined;
    } catch {}

    const obj: any = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const body = obj.Body as ReadableStream<Uint8Array>;

    const h = new Headers();
    h.set("Content-Type", contentType || guessType(key));
    h.set("Cache-Control", "public, max-age=31536000, immutable");
    h.set("X-Content-Type-Options", "nosniff");
    if (obj.ETag) h.set("ETag", String(obj.ETag).replaceAll('"',''));
    if (obj.LastModified) h.set("Last-Modified", new Date(obj.LastModified).toUTCString());

    return new NextResponse(body, { status: 200, headers: h });
  } catch (e: any) {
    console.error("R2 proxy error:", e?.message || e);
    const code = e?.$metadata?.httpStatusCode || 500;
    return new NextResponse("Image fetch failed", { status: code >= 400 ? code : 500 });
  }
}