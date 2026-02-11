import { useEffect, useState } from "react";
import type { Email, Action } from "../types";
import { apiClient } from "../api/client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import {
  X,
  Reply,
  Archive,
  Trash2,
  Check,
  Clock,
  AlertCircle,
  Mail,
  User,
  Calendar,
  Send,
} from "lucide-react";

/* ---------------------------------- Types --------------------------------- */

interface EmailDetailModalProps {
  email: Email;
  onClose: () => void;
  onActionComplete?: () => void;
}

/* ------------------------------ Component --------------------------------- */

export function EmailDetailModal({
  email,
  onClose,
  onActionComplete,
}: EmailDetailModalProps) {
  const [action, setAction] = useState<Action | null>(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingAction, setLoadingAction] = useState(true);

  /* ------------------------------ Load Action ------------------------------ */

  useEffect(() => {
    let cancelled = false;

    async function loadPendingAction() {
      try {
        setLoadingAction(true);

        const { data } = await apiClient.get<Action[]>(
          "/api/actions/pending"
        );

        const emailAction = data.find(
          (a) => a.email_id === email.id
        );

        if (!cancelled && emailAction) {
          setAction(emailAction);
          setReplyText(emailAction.suggested_reply ?? "");
        }
      } catch (error) {
        console.error("Failed to load action:", error);
      } finally {
        if (!cancelled) setLoadingAction(false);
      }
    }

    loadPendingAction();

    return () => {
      cancelled = true;
    };
  }, [email.id]);

  /* ------------------------------ Mutations -------------------------------- */

  async function runAction(fn: () => Promise<void>) {
    try {
      setBusy(true);
      await fn();
      onActionComplete?.();
      onClose();
    } catch (error) {
      console.error("Action failed:", error);
      alert("❌ Action failed");
    } finally {
      setBusy(false);
    }
  }

  function approveReply() {
    if (!action) return;

    return runAction(() =>
      apiClient.post(`/api/actions/${action.id}/approve`, {
        approved: true,
        edited_reply:
          replyText !== action.suggested_reply
            ? replyText
            : undefined,
      })
    );
  }

  function rejectReply() {
    if (!action) return;

    return runAction(() =>
      apiClient.post(`/api/actions/${action.id}/approve`, {
        approved: false,
      })
    );
  }

  function archiveSender() {
    return runAction(() =>
      apiClient.post("/api/bulk/emails/bulk-archive-sender", {
        sender: email.from_address,
        execute_immediately: false,
      })
    );
  }

  function deleteEmail() {
    if (!confirm("Are you sure you want to delete this email?")) return;

    return runAction(() =>
      apiClient.post("/api/bulk/emails/bulk-delete", {
        
          email_ids: [email.id],
          delete_from_gmail: true,
        
      })
    );
  }

  function markRead() {
    return runAction(() =>
      apiClient.post("/api/bulk/emails/mark-read", {
        email_ids: [email.id],
        execute_in_gmail: true,
      })
    );
  }

  /* ------------------------------- Helpers -------------------------------- */

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /* -------------------------------- Render -------------------------------- */

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">
                {email.subject || "(No subject)"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {email.from_address}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* Email Content */}
          <section className="flex-1 overflow-y-auto p-6 border-r">
            <Card>
              <CardHeader>
                <div className="space-y-3">
                  <Meta icon={User} label="From" value={email.from_address} />
                  <Meta icon={Mail} label="To" value={email.to_address} />
                  <Meta
                    icon={Calendar}
                    label="Date"
                    value={formatDate(email.created_at)}
                  />

                  {email.classification && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Classification:
                      </span>
                      <Badge variant="secondary">
                        {email.classification}
                      </Badge>
                    </div>
                  )}

                  <Meta
                    icon={Clock}
                    label="Status"
                    value={
                      <Badge
                        variant={
                          email.processed ? "success" : "warning"
                        }
                      >
                        {email.processed ? "Processed" : "Unprocessed"}
                      </Badge>
                    }
                  />
                </div>
              </CardHeader>

              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {email.body || email.snippet || "No content"}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Actions */}
          <aside className="w-[500px] overflow-y-auto p-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                <ActionButton
                  icon={Check}
                  disabled={busy || email.processed}
                  onClick={markRead}
                >
                  Mark as Read
                </ActionButton>

                <ActionButton
                  icon={Archive}
                  disabled={busy}
                  onClick={archiveSender}
                >
                  Archive
                </ActionButton>

                <ActionButton
                  icon={Trash2}
                  destructive
                  disabled={busy}
                  onClick={deleteEmail}
                >
                  Delete
                </ActionButton>
              </CardContent>
            </Card>

            {/* Suggested Reply */}
            {loadingAction ? (
              <LoadingCard />
            ) : action?.action_type === "reply" ? (
              <ReplyCard
                action={action}
                replyText={replyText}
                setReplyText={setReplyText}
                busy={busy}
                onApprove={approveReply}
                onReject={rejectReply}
              />
            ) : (
              <EmptyReplyCard />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Small Components ---------------------------- */

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm font-medium">{label}:</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  children,
  destructive,
  ...props
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  destructive?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
        destructive
          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      } disabled:opacity-50`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}

function LoadingCard() {
  return (
    <Card>
      <CardContent className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </CardContent>
    </Card>
  );
}

function EmptyReplyCard() {
  return (
    <Card>
      <CardContent className="p-6 text-center text-muted-foreground">
        <Reply className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No suggested reply available</p>
        <p className="text-sm mt-1">
          This email doesn't have a pending action
        </p>
      </CardContent>
    </Card>
  );
}

function ReplyCard({
  action,
  replyText,
  setReplyText,
  busy,
  onApprove,
  onReject,
}: {
  action: Action;
  replyText: string;
  setReplyText: (v: string) => void;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Reply className="w-5 h-5" />
          Suggested Reply
        </CardTitle>

        {action.reason && (
          <p className="text-sm text-muted-foreground">
            {action.reason}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          rows={12}
          className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />

        <div className="flex gap-2">
          <button
            onClick={onApprove}
            disabled={busy || !replyText.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Send Reply
          </button>

          <button
            onClick={onReject}
            disabled={busy}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
          >
            Reject
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
