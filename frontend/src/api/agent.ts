import { apiClient } from "./client";
import type { AgentChatResponse } from "../types";

export const agentApi = {
    async sendAgentMessage(message: string): Promise<AgentChatResponse>{
        const response = await apiClient.post("/api/agent/chat", {message})
        return response.data
    }
}