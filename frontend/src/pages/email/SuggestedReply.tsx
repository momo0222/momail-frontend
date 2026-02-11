import { useState, useEffect } from 'react';
import { Reply, Send } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '../../components/ui/Card';
import type { Action } from '../../types';

type Props = {
  action: Action | null;
  busy: boolean;
  onApprove: (reply: string) => void;
  onReject: () => void;
};

export const SuggestedReply = ({
  action,
  busy,
  onApprove,
  onReject,
}: Props) => {
  const [reply, setReply] = useState('');

  useEffect(() => {
    setReply(action?.suggested_reply || '');
  }, [action]);

  if (!action || action.action_type !== 'reply') {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Reply className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No suggested reply available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Reply className="w-5 h-5" />
          Suggested Reply
        </CardTitle>
        {action.reason && (
          <p className="text-sm text-muted-foreground">{action.reason}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={10}
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary text-sm"
        />

        <div className="flex gap-2">
          <button
            onClick={() => onApprove(reply)}
            disabled={busy || !reply.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Send
          </button>

          <button
            onClick={onReject}
            disabled={busy}
            className="px-4 py-2 bg-secondary rounded-md disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
