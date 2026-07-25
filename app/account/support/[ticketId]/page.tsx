import { SupportTicketDetail } from "@/components/support/SupportTicketDetail";
export default async function SupportTicketPage({params}:{readonly params:Promise<{ticketId:string}>}):Promise<React.JSX.Element>{const {ticketId}=await params;return <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8"><SupportTicketDetail ticketId={ticketId}/></main>}
