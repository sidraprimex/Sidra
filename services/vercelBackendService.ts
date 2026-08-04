import { requireFirebaseServices } from "@/services/firebaseClient";

export async function callVercelBackend<Request,Response>(action:string,payload:Request):Promise<Response>{
  const token=await requireFirebaseServices().auth.currentUser?.getIdToken();
  if(!token) throw new Error("Sign in again to continue.");
  const response=await fetch(`/api/backend/${encodeURIComponent(action)}`,{method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},body:JSON.stringify(payload),cache:"no-store"});
  const result=await response.json() as {data?:Response;error?:string};
  if(!response.ok) throw new Error(result.error??"Sidra server request failed.");
  return result.data as Response;
}
