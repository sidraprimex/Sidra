type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { mapValue: { fields?: Record<string, FirestoreValue> } }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { timestampValue: string };

interface FirestoreDocument {
  fields?: Record<string, FirestoreValue>;
}

function decode(value: FirestoreValue): unknown {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("nullValue" in value) return null;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue.values ?? []).map(decode);
  return Object.fromEntries(
    Object.entries(value.mapValue.fields ?? {}).map(([key, item]) => [key, decode(item)]),
  );
}

function baseUrl(): string {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID_MISSING");
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
}

export async function getFirestoreDocumentWithUserToken(
  token: string,
  path: string,
): Promise<Record<string, unknown> | null> {
  const response = await fetch(`${baseUrl()}/${path}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`FIRESTORE_READ_FAILED_${response.status}`);
  const document = await response.json() as FirestoreDocument;
  return Object.fromEntries(
    Object.entries(document.fields ?? {}).map(([key, value]) => [key, decode(value)]),
  );
}
