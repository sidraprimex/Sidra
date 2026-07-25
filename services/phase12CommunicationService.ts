import { orderBy, where } from "firebase/firestore";
import { callSidraFunction } from "@/services/functionService";
import { listDocuments } from "@/services/firestoreRepository";
import type { Message } from "@/types/communication";
import type { CreateSupportTicketInput, Phase12SupportStatus, Phase12SupportTicket } from "@/types/phase12-communication";
export function createPhase12SupportTicket(input:CreateSupportTicketInput):Promise<{ticketId:string}>{ return callSidraFunction("createSupportTicket", input); }
export function sendPhase12SupportMessage(ticketId:string, body:string):Promise<{delivered:boolean}>{ return callSidraFunction("sendSupportMessage", {ticketId,body}); }
export function managePhase12SupportTicket(ticketId:string,status:Phase12SupportStatus,assignedAdminUid?:string):Promise<{updated:boolean}>{ return callSidraFunction("manageSupportTicket",{ticketId,status,assignedAdminUid}); }
export function markEveryNotificationRead():Promise<{updatedCount:number}>{ return callSidraFunction("markAllNotificationsRead",{}); }
export function listMySupportTickets(uid:string,maxResults=50):Promise<readonly Phase12SupportTicket[]>{ return listDocuments("supportTickets",[where("openedByUid","==",uid),orderBy("updatedAt","desc")],maxResults); }
export function listSupportQueue(maxResults=100):Promise<readonly Phase12SupportTicket[]>{ return listDocuments("supportTickets",[orderBy("updatedAt","desc")],maxResults); }
export function listSupportConversation(conversationId:string,maxResults=100):Promise<readonly Message[]>{ return listDocuments("messages",[where("conversationId","==",conversationId),orderBy("createdAt","asc")],maxResults); }
