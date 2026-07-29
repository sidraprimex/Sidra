import crypto from "node:crypto";

function env(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name}_MISSING`);
  return value;
}

function encodePath(path: string): string {
  return `/${path.split("/").map((part) => encodeURIComponent(part)).join("/")}`;
}

function hmac(key: Buffer | string, value: string): Buffer {
  return crypto.createHmac("sha256", key).update(value).digest();
}

export async function b2Request(method: "GET" | "PUT", objectPath: string, body?: Buffer, contentType = "application/octet-stream"): Promise<Response> {
  const keyId = env("B2_KEY_ID");
  const applicationKey = env("B2_APPLICATION_KEY");
  const bucket = env("B2_BUCKET_NAME");
  const region = env("B2_REGION");
  const endpoint = env("B2_S3_ENDPOINT").replace(/\/$/, "");
  const url = new URL(`${endpoint}/${bucket}${encodePath(objectPath)}`);
  const payload = body ?? Buffer.alloc(0);
  const payloadHash = crypto.createHash("sha256").update(payload).digest("hex");
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (method === "PUT") headers["content-type"] = contentType;
  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers).sort().map((key) => `${key}:${headers[key]}\n`).join("");
  const canonicalRequest = [method, url.pathname, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${date}/${region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, crypto.createHash("sha256").update(canonicalRequest).digest("hex")].join("\n");
  const dateKey = hmac(`AWS4${applicationKey}`, date);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${keyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return fetch(url, { method, headers, body: method === "PUT" ? new Uint8Array(payload) : undefined, cache: "no-store" });
}

export function safeB2FileName(value: string): string {
  const extension = value.toLowerCase().match(/\.[a-z0-9]{1,8}$/)?.[0] ?? ".jpg";
  return `${crypto.randomUUID()}${extension}`;
}
