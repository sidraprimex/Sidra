import { httpsCallable, type HttpsCallable } from "firebase/functions";
import { requireFirebaseServices } from "@/services/firebaseClient";

export async function callSidraFunction<Request, Response>(name: string, payload: Request): Promise<Response> {
  const callable: HttpsCallable<Request, Response> = httpsCallable(requireFirebaseServices().functions, name);
  const result = await callable(payload);
  return result.data;
}
