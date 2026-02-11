export interface Email{
    id: string;
    thread_id: string;
    from_address: string;
    from_name: string;
    to_address: string;
    subject: string;
    snippet: string;
    body: string;
    classification: string;
    processed: boolean;
    created_at: string;
    updated_at: string | null;
}
// New type for thread view
export interface EmailThread extends Email {
  thread_count: number;
  has_unread: boolean;
}

export interface Action {
    id: number;
    email_id: string;
    action_type: string;
    status: string;
    suggested_reply: string | null;
    actual_reply: string | null;
    reason: string | null;
    created_at: string;
    processed_at: string | null;
}

export interface AgentStats{
    running: boolean;
    total_emails: number;
    processed_emails: number;
    pending_actions: number;
}

export interface DashboardStats{
    totals: {
        emails: number;
        processed: number;
        pending_actions: number;
        unprocessed: number;
    };
    classification: Record<string, number>;
    action_types: Record<string, number>;
    recent_activity: {
        last_7_days: number;
    };
    top_senders: Array<{
        email: string;
        count: number
    }>;
}

export interface AgentChatResponse{
    reply: string;
    emails?: Email[];
}

export interface ReplyResult {
    suggested_reply: string;
    email_id: string;
}

export interface Draft {
    id: number;
    to: string;
    subject: string;
    body: string;
    attachments: Array<{
        filename: string;
        filepath: string;
        size: number;
    }>;
    created_at: string;
    updated_at: string;
}

export interface UserFile{
    id: number;
    filename: string;
    filepath: string;
    original_filename: string;
    size: number;
    file_type: string;
    created_at: string;
}

export interface EmailResponse{
    suggested_reply: string;
    enable_research: boolean;
}