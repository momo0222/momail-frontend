import { apiClient } from "./client";
import type { DashboardStats, AgentStats } from "../types";

export const dashboardApi = {
    async getStats(): Promise<DashboardStats> {
        const response = await apiClient.get("/api/dashboard/stats");
        return response.data;
    },
    async getAgentStatus(): Promise<AgentStats>{
        const response = await apiClient.get("/api/agent/stats");
        return response.data;
    }
}