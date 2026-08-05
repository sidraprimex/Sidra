import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { isConfiguredAdminEmail } from "@/config/adminAccess";

function privateKey(): string {
  return (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
}

function adminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const serviceAccount = inline ? JSON.parse(inline) as { project_id:string; client_email:string; private_key:string } : {
    project_id: process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    client_email: process.env.FIREBASE_CLIENT_EMAIL ?? "",
    private_key: privateKey(),
  };
  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("FIREBASE_ADMIN_CREDENTIALS_MISSING");
  }
  return initializeApp({ credential:cert({ projectId:serviceAccount.project_id, clientEmail:serviceAccount.client_email, privateKey:serviceAccount.private_key }) });
}

export function sidraAdminDb() { return getFirestore(adminApp()); }
export function sidraAdminAuth() { return getAuth(adminApp()); }

export interface SidraServerIdentity {
  uid:string; email:string|null; emailVerified:boolean; role:string; studioId:string|null;
}

export async function requireServerIdentity(request:Request): Promise<SidraServerIdentity> {
  const authorization=request.headers.get("authorization")??"";
  const [scheme,token]=authorization.split(" ");
  if(scheme!=="Bearer"||!token) throw new Error("AUTH_REQUIRED");
  const decoded=await sidraAdminAuth().verifyIdToken(token,true);
  const profileSnapshot = await sidraAdminDb().collection("users").doc(decoded.uid).get();
  const profile = profileSnapshot.data() ?? {};
  if (["suspended", "deleted"].includes(String(profile.status ?? "active"))) {
    throw new Error("ACCOUNT_ACCESS_DENIED");
  }
  const email = decoded.email ?? null;
  const configuredAdmin = isConfiguredAdminEmail(email);
  const profileRole = typeof profile.role === "string" ? profile.role : "";
  const tokenRole = typeof decoded.role === "string" ? decoded.role : "";
  const storedRole = profileRole || tokenRole || "customer";
  const role = configuredAdmin || storedRole === "admin" ? "superAdmin" : storedRole;
  const profileStudioId = typeof profile.studioId === "string" ? profile.studioId.trim() : "";
  const tokenStudioId = typeof decoded.studioId === "string" ? decoded.studioId.trim() : "";
  return {
    uid: decoded.uid,
    email,
    emailVerified: decoded.email_verified === true,
    role,
    studioId: profileStudioId || tokenStudioId || null,
  };
}

export function requireRole(identity:SidraServerIdentity, roles:readonly string[]):void {
  if(!roles.includes(identity.role)) throw new Error("PERMISSION_DENIED");
}
