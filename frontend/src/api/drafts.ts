import type { Draft } from "../types";
import { apiClient } from "./client";

export const draftsApi = {
    async list(): Promise<Draft[]>{
        const response = await apiClient.get('/api/drafts/');
        return response.data;
    },

    async create(draft: Partial<Draft>): Promise<Draft>{
        const response = await apiClient.post('api/drafts/', draft)
        return response.data;
    },

    async get(draft_id: number): Promise<Draft>{
        const response = await apiClient.get(`/api/drafts/${draft_id}`);
        return response.data;
    },

    async update(draft_id: number, draft: Partial<Draft>): Promise<Draft>{
        const response = await apiClient.put(`/api/drafts/${draft_id}`, draft);
        return response.data;
    },

    async delete(draft_id: number): Promise<void>{
        await apiClient.delete(`/api/drafts/${draft_id}`)
    },

    async uploadAttachment(draft_id: number, file: File){
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post(
            `/api/drafts/${draft_id}/attachments`,
            formData,
            {
                headers: {
                    'Content-Type': "multipart/form-data"
                }
            }
        );

        return response.data;
    },

    async removeAttachment(draft_id: number, filename: string){
        await apiClient.delete(`/api/drafts/${draft_id}/attachments/${filename}`);
    }
}