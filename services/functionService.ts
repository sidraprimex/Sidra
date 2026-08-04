import { callVercelBackend } from "@/services/vercelBackendService";

export async function callSidraFunction<Request, Response>(name: string, payload: Request): Promise<Response> {
  return callVercelBackend<Request,Response>(name,payload);
}
