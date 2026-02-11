import { useEffect, useState } from "react";
import { dashboardApi } from "../api/dashboard";
import type { DashboardStats, AgentStats } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Activity, Mail, CheckCircle, AlertCircle, Clock, type LucideIcon } from "lucide-react";

/* -------------------------------- Dashboard -------------------------------- */

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10_000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [statsData, statusData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getAgentStatus(),
      ]);

      setStats(statsData);
      setAgentStatus(statusData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">MoMail</h1>
              <p className="text-muted-foreground mt-1">
                AI-powered email management
              </p>
            </div>

            <Badge
              variant={agentStatus?.running ? "success" : "destructive"}
              className="text-sm px-4 py-2"
            >
              <Activity className="w-4 h-4 mr-2" />
              {agentStatus?.running ? "Running" : "Stopped"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Emails"
            value={stats?.totals.emails ?? 0}
            icon={Mail}
            color="blue"
          />
          <StatCard
            title="Processed"
            value={stats?.totals.processed ?? 0}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Pending Actions"
            value={stats?.totals.pending_actions ?? 0}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Unprocessed"
            value={stats?.totals.unprocessed ?? 0}
            icon={AlertCircle}
            color="red"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Classifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Classifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats?.classification ?? {}).map(
                  ([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="capitalize text-sm font-medium">
                        {type}
                      </span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Senders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Senders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.top_senders.slice(0, 5).map((sender) => (
                  <div
                    key={sender.email}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {sender.email}
                    </span>
                    <Badge variant="secondary">{sender.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- StatCard -------------------------------- */

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: "blue" | "green" | "yellow" | "red";
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    yellow: "text-yellow-600 bg-yellow-50",
    red: "text-red-600 bg-red-50",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>

          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
