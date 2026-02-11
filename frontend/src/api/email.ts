import { apiClient } from "./client";
import type { Email, EmailThread } from "../types";

export const emailsApi = {
    // list emails with filters
    async list(
        params? : {
            skip?: number;
            limit?: number;
            classification?: string;
            processed?: boolean;
        }
    ): Promise<Email[]> {
        const response = await apiClient.get("/api/emails", {params});
        return response.data;
    },
    // List threads (grouped emails)
    listThreads: async (params?: {
        classification?: string;
        processed?: boolean;
        limit?: number;
    }): Promise<EmailThread[]> => {
        const response = await apiClient.get('/api/emails/threads', { params });
        return response.data;
    },

    // Get all emails in a thread
    getThread: async (threadId: string): Promise<Email[]> => {
        const response = await apiClient.get(`/api/emails/threads/${threadId}`);
        return response.data;
    },
    // get single email
    async get(
        email_id: string
    ): Promise<Email>{
        const response = await apiClient.get(`/api/emails/${email_id}`);
        return response.data;
    },

    // search emails
    async search(params: {
        query?: string;
        sender?: string;
        classification?: string;
        processed?: boolean;    
        limit?: number;    
    }
    ): Promise<Email[]>{
        const response = await apiClient.get("/api/emails/search", {params});
        return response.data;
    },

    //send email reply
    async sendReply(emailId: string, replyText: string){
        const response = await apiClient.post('/api/emails/send-reply', {
        email_id: emailId,
        reply_text: replyText,
        });
        return response.data;
    },
    //send new email
    async sendNew(
            to: string,
            subject: string,
            body: string,
            attachments: Array<{ filepath: string; original_filename: string}> = [],
            draft_id? : number
    ){
        const response = await apiClient.post('api/emails/send-new',{
            to_address: to,
            subject: subject,
            body: body,
            attachments: attachments,
            draft_id: draft_id
        });
        return response.data;
    },

}