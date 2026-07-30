export interface VerifiedFirebaseIdentity {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}

interface IdentityToolkitUser {
  localId?: string;
  email?: string;
  emailVerified?: boolean;
}

interface IdentityToolkitResponse {
  users?: IdentityToolkitUser[];
}

export function firebaseBearerToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new Error("AUTH_REQUIRED");
  }

  return token;
}

export async function verifyFirebaseRequest(
  request: Request,
): Promise<VerifiedFirebaseIdentity> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    throw new Error("FIREBASE_API_KEY_MISSING");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        idToken: firebaseBearerToken(request),
      }),
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as IdentityToolkitResponse;
  const user = payload.users?.[0];

  if (!response.ok || !user?.localId) {
    throw new Error("INVALID_FIREBASE_SESSION");
  }

  return {
    uid: user.localId,
    email: user.email ?? null,
    emailVerified: user.emailVerified === true,
  };
}
