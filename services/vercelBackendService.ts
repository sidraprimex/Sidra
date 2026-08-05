import { requireFirebaseServices } from "@/services/firebaseClient";

export async function callVercelBackend<Request,Response>(action:string,payload:Request):Promise<Response>{
  const token=await requireFirebaseServices().auth.currentUser?.getIdToken();
  if(!token) throw new Error("Sign in again to continue.");
  const response=await fetch(`/api/backend/${encodeURIComponent(action)}`,{method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},body:JSON.stringify(payload),cache:"no-store"});
  const raw=await response.text();
  let result:{data?:Response;error?:string}={};
  try { result=raw ? JSON.parse(raw) as {data?:Response;error?:string} : {}; }
  catch {
    throw new Error(response.ok
      ? "Sidra server returned an invalid response. Please try again."
      : "Sidra server is temporarily unavailable. Please retry after the latest deployment finishes.");
  }
  if(!response.ok) throw new Error(result.error??"Sidra server request failed.");
  if(result.data===undefined) throw new Error("Sidra server returned an incomplete response.");
  return result.data;
}
