import { apiClient } from "./client";
import type { ReplyResult, EmailResponse } from "../types";
export const actionsApi = {
    async generateReply(emailId: string, options?: {
    tone?: 'professional' | 'casual' | 'friendly' | 'brief';
    custom_instructions?: string;
  }): Promise<ReplyResult> {
        const response = await apiClient.post("/api/actions/generate-reply",
            {
                email_id: emailId,
                tone: options?.tone || 'professional',
                custom_instructions: options?.custom_instructions || ''
            }
        );
        return response.data;
    },
    async generateEmailWithResearch(params: {
        to: string;
        subject: string;
        tone: string;
        instructions: string;
        attachedFiles?: Array<{content: string, filename: string}>;
        enableResearch?: boolean
    }): Promise<EmailResponse>{
        const response = await apiClient.post("/api/ai/generate-email", params);
        return response.data
    }
}