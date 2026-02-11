import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

import type { Email, Action } from '../types';
import { emailsApi } from '../api/email';
import { apiClient } from '../api/client';
import { actionsApi } from '../api/actions';

import { EmailHeader } from './email/EmailHeader';
import { EmailBody } from './email/EmailBody';
import { EmailActions } from './email/EmailActions';
import { SuggestedReply } from './email/SuggestedReply';
import { EmailSkeleton } from './email/EmailSkeleton';
import { AIReplyAssistant } from '../components/email/AIReplyAssistant';

export const EmailDetail = () => {
  const { emailId } = useParams<{ emailId: string }>();
  const navigate = useNavigate();

   useEffect(() => {
    window.scrollTo(0, 0);
  }, [emailId]);

  // ----------------------
  // Queries
  // ----------------------

  const emailQuery = useQuery({
    queryKey: ['email', emailId],
    queryFn: () => emailsApi.get(emailId!),
    enabled: !!emailId,
  });

  const actionQuery = useQuery({
    queryKey: ['email-action', emailId],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/actions/pending');
      return data.find((a: Action) => a.email_id === emailId) ?? null;
    },
    enabled: !!emailId,
  });

  // ----------------------
  // Mutations
  // ----------------------

  const approveMutation = useMutation({
    mutationFn: (payload: {
      actionId: string;
      approved: boolean;
      editedReply?: string;
    }) =>
      apiClient.post(`/api/actions/${payload.actionId}/approve`, {
        approved: payload.approved,
        edited_reply: payload.editedReply,
      }),
    onSuccess: () => {
      toast.success('Reply sent successfully');
      navigate('/emails');
    },
    onError: () => {
      toast.error('Failed to send reply');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (sender: string) =>
      apiClient.post('/api/bulk/emails/bulk-archive-sender', {
        sender,
        execute_immediately: false,
      }),
    onSuccess: () => {
      toast.success('Archive action created');
      navigate('/emails');
    },
    onError: () => {
      toast.error('Failed to archive email');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (emailId: string) =>
      apiClient.delete('/api/bulk/emails/bulk-delete', {
        data: {
          email_ids: [emailId],
          delete_from_gmail: true,
        },
      }),
    onSuccess: () => {
      toast.success('Email deleted');
      navigate('/emails');
    },
    onError: () => {
      toast.error('Failed to delete email');
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (emailId: string) =>
      apiClient.post('/api/bulk/emails/mark-read', {
        email_ids: [emailId],
        execute_in_gmail: true,
      }),
    onSuccess: () => {
      toast.success('Marked as read');
      emailQuery.refetch();
    },
  });

  const generateReplyMutation = useMutation({
  mutationFn: (payload: {
    emailId: string;
    tone: string;
    instructions?: string;
  }) =>
    actionsApi.generateReply(payload.emailId, {
      tone: payload.tone,
      custom_instructions: payload.instructions,
    }),

  onError: () => {
    toast.error("Failed to generate reply");
  },
});

const sendReplyMutation = useMutation({
  mutationFn: (payload: { emailId: string; replyText: string }) =>
    emailsApi.sendReply(payload.emailId, payload.replyText),
  onSuccess: () => {
    toast.success('Reply sent successfully');
    navigate('/emails');
  },
  onError: () => {
    toast.error('Failed to send reply');
  },
});


  // ----------------------
  // States
  // ----------------------

  if (emailQuery.isLoading) return <EmailSkeleton />;

  if (emailQuery.isError || !emailQuery.data) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Email not found</p>
      </div>
    );
  }

  const email = emailQuery.data;
  const action = actionQuery.data;

  const busy =
    approveMutation.isPending ||
    archiveMutation.isPending ||
    deleteMutation.isPending ||
    markReadMutation.isPending;

  // ----------------------
  // Render
  // ----------------------
 

  return (
    <div className="min-h-screen bg-background">
      <EmailHeader email={email} />

      <div className="container mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EmailBody email={email} />
        </div>

        <div className="space-y-4 sticky top-24 h-fit">
          <EmailActions
            email={email}
            busy={busy}
            onMarkRead={() => markReadMutation.mutate(email.id)}
            onArchive={() => archiveMutation.mutate(email.from_address)}
            onDelete={() => deleteMutation.mutate(email.id)}
          />

          <SuggestedReply
            action={action}
            busy={busy}
            onApprove={(reply) =>
              approveMutation.mutate({
                actionId: action!.id,
                approved: true,
                editedReply: reply,
              })
            }
            onReject={() =>
              approveMutation.mutate({
                actionId: action!.id,
                approved: false,
              })
            }
          />
          <AIReplyAssistant
            loading={generateReplyMutation.isPending}
            onGenerate={async ({ tone, instructions }) => {
              const result = await generateReplyMutation.mutateAsync({
                emailId: email.id,
                tone,
                instructions,
              });

              return result.suggested_reply;
            }}
            onSend={(reply) => {
              sendReplyMutation.mutate({
                emailId: email.id,
                replyText: reply
              });
            }}
          />

        </div>
      </div>
    </div>
  );
};
