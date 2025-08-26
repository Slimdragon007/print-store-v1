import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import fs from "node:fs";

const BUCKET = process.env.R2_BUCKET;
const ENDPOINT = process.env.R2_ENDPOINT;
const AK = process.env.R2_ACCESS_KEY_ID;
const SK = process.env.R2_SECRET_ACCESS_KEY;

if (!BUCKET || !ENDPOINT || !AK || !SK) {
  console.error("❌ Missing R2 envs. Need R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env.local");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: ENDPOINT,
  credentials: { accessKeyId: AK, secretAccessKey: SK }
});

function titleFromKey(key) {
  const base = key.split("/").pop() || key;
  const noExt = base.replace(/\.[a-z0-9]+$/i, "");
  return noExt
    .replace(/[_\-]+/g, " ")
    .replace(/,+/g, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function idFromKey(key) {
  const base = key.split("/").pop() || key;
  return base
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const PREFIX = "prints/"; // adjust if your photos live elsewhere
const out = [];
let token = undefined, count = 0;

do {
  const res = await s3.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: PREFIX,
    ContinuationToken: token
  }));

  for (const o of res.Contents || []) {
    if (!o.Key || o.Key.endsWith("/")) continue;  // skip "folders"
    const key = o.Key;
    out.push({
      id: idFromKey(key),
      title: titleFromKey(key),
      r2Key: key,
      variants: [
        { id: "8x10",  label: "8 x 10 in",  stripePriceId: "price_8x10_xxx",  priceCents: 3000 },
        { id: "16x20", label: "16 x 20 in", stripePriceId: "price_16x20_xxx", priceCents: 9000 }
      ]
    });
    count++;
  }

  token = res.IsTruncated ? res.NextContinuationToken : undefined;
} while (token);

if (!count) {
  console.error(`❌ Found 0 objects under ${PREFIX}. Upload files there or change PREFIX.`);
  process.exit(1);
}

fs.writeFileSync("data/prints.json", JSON.stringify(out, null, 2));
console.log(`✅ Wrote data/prints.json with ${count} items`);