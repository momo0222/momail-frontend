import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';

import { 
  ArrowLeft, 
  Send, 
  Sparkles, 
  Save, 
  Trash2,
  Paperclip,
  X,
  FolderOpen,
  Upload,
  FileText
} from 'lucide-react';

import { emailsApi } from '../api/email';
import { draftsApi } from '../api/drafts';
import { actionsApi } from '../api/actions';
import { FileManager } from '../components/FileManager';
import { useFileContent } from '../hooks/useUserFiles';

import { cn } from '../lib/utils';
import useDebouncedValue from '../hooks/utils';

type Tone = 'professional' | 'casual' | 'friendly' | 'brief';

export function Compose() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as {from?: string})?.from || "/emails";

  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [currentDraftId, setCurrentDraftId] = useState<number | null>(
    draftId ? Number(draftId) : null
  );

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draftAttachments, setDraftAttachments] = useState<any[]>([]);
  const [userFileAttachments, setUserFileAttachments] = useState<any[]>([]);

  // File Manager
  const [showFileManager, setShowFileManager] = useState(false);
  const [selectedUserFileId, setSelectedUserFileId] = useState<number | null>(null);

  // AI Assistant
  const [showAI, setShowAI] = useState(true);
  const [tone, setTone] = useState<Tone>('professional');
  const [instructions, setInstructions] = useState('');
  const [enableResearch, setEnableResearch] = useState(false);

  // Debounced values for autosave
  const debouncedTo = useDebouncedValue(to, 800);
  const debouncedSubject = useDebouncedValue(subject, 800);
  const debouncedBody = useDebouncedValue(body, 800);

  // Load user file content for AI
  const { data: userFileContent } = useFileContent(selectedUserFileId);

  /* ---------------------------
      Mutations
  --------------------------- */

  const createDraftMutation = useMutation({
    mutationFn: () => draftsApi.create({ to: '', subject: '', body: '' }),
    onSuccess: (draft) => {
      setCurrentDraftId(draft.id);
      setLastSaved(new Date(draft.created_at));
      navigate(`/compose/${draft.id}`, {
        replace: true,
        state: location.state,
      });
      // ✅ DON'T fetch the draft - we already have the values in state!
    },
    onError: () => toast.error('Failed to create draft'),
  });

  const saveDraftMutation = useMutation({
    mutationFn: (payload: { id: number; to: string; subject: string; body: string }) =>
      draftsApi.update(payload.id, {
        to: payload.to,
        subject: payload.subject,
        body: payload.body,
      }),
    onSuccess: () => setLastSaved(new Date()),
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: (file: File) => {
      if (!currentDraftId) throw new Error('No draft');
      return draftsApi.uploadAttachment(currentDraftId, file);
    },
    onSuccess: (newAttachment) => {
      setDraftAttachments([...draftAttachments, newAttachment]);
      toast.success('File attached');
    },
    onError: () => toast.error('Failed to upload attachment'),
  });

  const removeAttachmentMutation = useMutation({
    mutationFn: (filename: string) => {
      if (!currentDraftId) throw new Error('No draft');
      return draftsApi.removeAttachment(currentDraftId, filename);
    },
    onSuccess: (_, filename) => {
      setDraftAttachments(draftAttachments.filter(a => a.filename !== filename));
      toast.success('Attachment removed');
    },
    onError: () => toast.error('Failed to remove attachment'),
  });

  const sendMutation = useMutation({
    mutationFn: () => {
      // Combine draft attachments and user file attachments
      const allAttachments = [
        ...draftAttachments.map(a => ({
          filepath: a.filepath,
          original_filename: a.original_filename || a.filename
        })),
        ...userFileAttachments.map(a => ({
          filepath: a.filepath,
          original_filename: a.filename
        }))
      ];
      return emailsApi.sendNew(to, subject, body, allAttachments, currentDraftId || undefined);
    },
    onSuccess: () => {
      toast.success('Email sent successfully');
      navigate(from);
    },
    onError: () => toast.error('Failed to send email'),
  });

  const deleteDraftMutation = useMutation({
    mutationFn: (id: number) => draftsApi.delete(id),
    onSuccess: () => navigate(from),
    onError: () => toast.error('Failed to delete draft'),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Build context with user file if selected
      const files = [];
      if (userFileContent) {
        files.push({
          filename: userFileContent.filename,
          content: userFileContent.content
        })
      }
      const params = {
        to: to,
        subject: subject,
        tone: tone,
        instructions: instructions,
        attachedFiles: files,
        enableResearch
      }
      const res = await actionsApi.generateEmailWithResearch(params);
      
      return res.suggested_reply;
    },
    onSuccess: (generatedText) => {
      setBody(generatedText);
      toast.success(
        enableResearch ? 
        "Email generated with research"
        : "Email generated"
      );
    },
    onError: () => toast.error('Failed to generate email'),
  });

  /* ---------------------------
      File Upload
  --------------------------- */

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      if (!currentDraftId) {
        toast.error('Please wait for draft to be created');
        return;
      }
      files.forEach(file => uploadAttachmentMutation.mutate(file));
    },
    noClick: true,
    noKeyboard: true,
  });

  /* ---------------------------
      Init Draft
  --------------------------- */

  useEffect(() => {
    // Only load draft if there's a draftId in the URL
    if (currentDraftId && draftId) {
      draftsApi.get(currentDraftId).then((draft) => {
        setTo(draft.to);
        setSubject(draft.subject);
        setBody(draft.body);
        setDraftAttachments(draft.attachments || []);
        setLastSaved(new Date(draft.updated_at));
      }).catch(() => {
        toast.error('Failed to load draft');
        navigate('/compose');
      });
    }
  }, []); // ← Only run on mount
  /* ---------------------------
      Auto Save
  --------------------------- */
useEffect(() => {
  // Skip if no content
  if (!to && !subject && !body) return;

  // If no draft, create it
  if (!currentDraftId) {
    if (!createDraftMutation.isPending) {
      createDraftMutation.mutate();
    }
    return; // ← Don't save yet, creation will happen
  }

  // Skip if we're creating
  if (createDraftMutation.isPending) {
    return;
  }

  // Save to existing draft
  saveDraftMutation.mutate({
    id: currentDraftId,
    to: debouncedTo,
    subject: debouncedSubject,
    body: debouncedBody,
  });
}, [debouncedTo, debouncedSubject, debouncedBody, currentDraftId]);

  const busy =
    sendMutation.isPending ||
    saveDraftMutation.isPending ||
    deleteDraftMutation.isPending;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /* ---------------------------
      Render
  --------------------------- */

  return (
    <div className="min-h-screen bg-background" {...getRootProps()}>
      <input {...getInputProps()} />
      
      {/* Drag Overlay */}
      {isDragActive && (
        <div className="fixed inset-0 bg-primary/10 border-4 border-dashed border-primary z-50 flex items-center justify-center">
          <div className="text-center">
            <Upload className="w-16 h-16 mx-auto mb-4 text-primary" />
            <p className="text-lg font-semibold">Drop files to attach</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(from)}
              className="p-2 hover:bg-accent rounded-md"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-xl font-semibold">Compose Email</h1>
              <p className="text-xs text-muted-foreground">
                {saveDraftMutation.isPending ? (
                  <span className="flex items-center gap-1">
                    <Save className="w-3 h-3 animate-pulse" /> Saving...
                  </span>
                ) : lastSaved ? (
                  `Saved ${lastSaved.toLocaleTimeString()}`
                ) : (
                  'Draft created'
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                currentDraftId && deleteDraftMutation.mutate(currentDraftId)
              }
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md"
            >
              <Trash2 className="w-4 h-4" /> Discard
            </button>

            <button
              onClick={() => sendMutation.mutate()}
              disabled={busy || !to || !subject || !body}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sendMutation.isPending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          <Input label="To" value={to} onChange={setTo} placeholder="recipient@example.com" />
          <Input label="Subject" value={subject} onChange={setSubject} placeholder="Email subject" />

          {/* Attachments */}
          {(draftAttachments.length > 0 || userFileAttachments.length > 0) && (
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <Paperclip className="w-4 h-4" />
                Attachments ({draftAttachments.length + userFileAttachments.length})
              </div>
              <div className="space-y-2">
                {/* User File Attachments (from My Files) */}
                {userFileAttachments.map((attachment) => (
                  <div
                    key={`user-${attachment.filename}`}
                    className="flex items-center justify-between gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {attachment.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.size)} • From My Files
                      </p>
                    </div>
                    <button
                      onClick={() => setUserFileAttachments(
                        userFileAttachments.filter(a => a.filename !== attachment.filename)
                      )}
                      className="p-1 hover:bg-destructive/10 text-destructive rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Draft Attachments (temporary uploads) */}
                {draftAttachments.map((attachment) => (
                  <div
                    key={`draft-${attachment.filename}`}
                    className="flex items-center justify-between gap-2 p-2 bg-accent/50 rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {attachment.original_filename || attachment.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeAttachmentMutation.mutate(attachment.filename)}
                      className="p-1 hover:bg-destructive/10 text-destructive rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attach Buttons */}
          <div className="flex gap-2">
            <label className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-accent cursor-pointer transition-colors">
              <Paperclip className="w-4 h-4" />
              Attach File
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(file => uploadAttachmentMutation.mutate(file));
                  e.target.value = ''
                }}
                disabled={!currentDraftId}
              />
            </label>

            <button
              onClick={() => setShowFileManager(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              My Files
            </button>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={20}
              placeholder="Write your message or use AI to generate..."
              className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-primary text-sm font-mono"
            />
          </div>
        </div>

        {/* AI Assistant */}
        <div className="space-y-4 sticky top-24 h-fit">
          <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                AI Writing Assistant
              </span>
              <button
                onClick={() => setShowAI(!showAI)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {showAI ? 'Hide' : 'Show'}
              </button>
            </div>

            {showAI && (
              <>
                <div className="p-3 bg-white border border-purple-200 rounded-md">
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input 
                    type="checkbox"
                    checked={enableResearch}
                    onChange={(e) => setEnableResearch(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Enable AI research</p>
                      <p className="text-xs text-muted-foreground">
                      AI will search the web for company info, recent news, and industry context (recommended for cold emails)
                    </p>
                    </div>
                  </label>
                </div>
                {/* Selected User File for AI */}
                {userFileContent && (
                  <div className="p-2 bg-purple-100 border border-purple-200 rounded text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Context: {userFileContent.filename}</span>
                      <button
                        onClick={() => setSelectedUserFileId(null)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-purple-600">AI will use this file as context</p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium mb-2">Tone</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['professional', 'casual', 'friendly', 'brief'] as Tone[]).map(
                      (t) => (
                        <button
                          key={t}
                          onClick={() => setTone(t)}
                          className={cn(
                            'text-xs px-3 py-2 rounded-md capitalize transition-colors',
                            tone === t
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-white hover:bg-gray-100'
                          )}
                        >
                          {t}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium mb-2">Instructions</p>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={5}
                    placeholder="e.g., Apply for software engineer position, request a meeting, ask about pricing..."
                    className="w-full text-xs p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={() => setShowFileManager(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs border rounded-md hover:bg-white transition-colors"
                >
                  <FolderOpen className="w-3 h-3" />
                  Add Resume/Document for AI
                </button>

                <button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending || !to || !subject}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  {generateMutation.isPending ? 'Generating...' : 'Generate Email'}
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  AI will draft your email based on the context you provide
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* File Manager Modal */}
      <FileManager
        isOpen={showFileManager}
        onClose={() => setShowFileManager(false)}
        onAttachFile={(fileId, filepath, filename, size) => {
          // Add to email attachments
          setUserFileAttachments([
            ...userFileAttachments,
            { id: fileId, filepath, filename, size }
          ]);
          toast.success(`${filename} attached to email`);
        }}
        onSelectForAI={(fileId) => {
          // Use for AI context
          setSelectedUserFileId(fileId);
          toast.success('File selected for AI context');
        }}
      />
    </div>
  );
}

/* ---------------------------
   Input Component
--------------------------- */

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}