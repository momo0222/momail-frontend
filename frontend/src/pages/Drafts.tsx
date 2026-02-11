import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileEdit, Plus, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';

import { draftsApi } from '../api/drafts';
import type { Draft } from '../types';

export const Drafts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ----------------------
  // Query: Load Drafts
  // ----------------------

  const draftsQuery = useQuery({
    queryKey: ['drafts'],
    queryFn: draftsApi.list,
  });

  // ----------------------
  // Mutation: Delete Draft
  // ----------------------

  const deleteMutation = useMutation({
    mutationFn: (draftId: number) => draftsApi.delete(draftId),

    // Optimistic update
    onMutate: async (draftId) => {
      await queryClient.cancelQueries({ queryKey: ['drafts'] });

      const previous = queryClient.getQueryData<Draft[]>(['drafts']);

      queryClient.setQueryData<Draft[]>(['drafts'], (old) =>
        old?.filter((d) => d.id !== draftId) ?? []
      );

      return { previous };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['drafts'], ctx.previous);
      }
      toast.error('Failed to delete draft');
    },

    onSuccess: () => {
      toast.success('Draft deleted');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
  });

  // ----------------------
  // Helpers
  // ----------------------

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // ----------------------
  // States
  // ----------------------

  if (draftsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (draftsQuery.isError || !draftsQuery.data) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Failed to load drafts</p>
      </div>
    );
  }

  const drafts = draftsQuery.data;

  // ----------------------
  // Render
  // ----------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileEdit className="w-8 h-8" />
              Drafts
            </h1>
            <p className="text-muted-foreground mt-1">
              {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}
            </p>
          </div>

          <button
            onClick={() => navigate('/compose', {
                state: {from: "/drafts"}
            })}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="w-5 h-5" />
            New Draft
          </button>
        </div>
      </div>

      {/* List */}
      <div className="container mx-auto px-6 py-8">
        {drafts.length === 0 ? (
          <div className="text-center py-12">
            <FileEdit className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No drafts</h3>
            <p className="text-muted-foreground mb-4">
              Start composing an email to create a draft
            </p>
            <button
              onClick={() => navigate('/compose', {
                state: {from: '/drafts'}
              })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              <Plus className="w-4 h-4" />
              Compose Email
            </button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-background">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                onClick={() => navigate(`/compose/${draft.id}`, {
                    state: {from: '/drafts'}
                })}
                className="border-b last:border-b-0 hover:bg-accent/50 cursor-pointer"
              >
                <div className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <FileEdit className="w-5 h-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-4 mb-1">
                      <div className="min-w-0">
                        <p className="text-sm truncate">
                          {draft.to || (
                            <span className="italic text-muted-foreground">
                              No recipient
                            </span>
                          )}
                        </p>
                        <p className="font-semibold truncate">
                          {draft.subject || (
                            <span className="italic text-muted-foreground">
                              (No subject)
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {draft.updated_at ? formatDate(draft.updated_at): formatDate(draft.created_at)}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(draft.id);
                          }}
                          className="p-1.5 hover:bg-destructive/10 text-destructive rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {draft.body && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {draft.body}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
