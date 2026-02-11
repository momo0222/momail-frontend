import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

import type { Email } from '../types';
import { emailsApi } from '../api/email';

import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

import { ArrowLeft, User, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { ThreadSkeleton } from './thread/ThreadSkeleton';
import { cn } from '../lib/utils';

// Add at the very top, before the component
const parseEmailBody = (body: string): { content: string; quotedText: string } => {
  if (!body) return { content: '', quotedText: '' };

  // Find where quoted content starts
  const quotePatterns = [
    { regex: /\n\nOn .+? wrote:\s*\n/i, offset: 0 },           // "On Mon, Jan 12... wrote:"
    { regex: /\n\n>{1,}\s*/m, offset: 0 },                     // Lines starting with >
    { regex: /\n\n_{5,}\s*\n/m, offset: 0 },                   // Horizontal lines _____
    { regex: /\n\nFrom:\s*.+?\nSent:/is, offset: 0 },         // Email forward headers
  ];

  let splitIndex = -1;

  // Find the earliest quote marker
  for (const { regex, offset } of quotePatterns) {
    const match = body.match(regex);
    if (match && match.index !== undefined) {
      const idx = match.index + offset;
      if (splitIndex === -1 || idx < splitIndex) {
        splitIndex = idx;
      }
    }
  }

  // Split content
  if (splitIndex > 0) {
    return {
      content: body.substring(0, splitIndex).trim(),
      quotedText: body.substring(splitIndex).trim(),
    };
  }

  return { content: body.trim(), quotedText: '' };
};

export function ThreadDetail() {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const inboxFrom = (location.state as any)?.inboxFrom;
  const threadUrl = location.pathname + location.search;

  const threadQuery = useQuery({
  queryKey: ['thread', threadId],
  queryFn: () => emailsApi.getThread(threadId!),
  enabled: !!threadId,
  retry: false,
});

useEffect(() => {
  if (threadQuery.isError) {
    toast.error('Failed to load conversation');
    navigate('/emails');
  }
}, [threadQuery.isError, navigate]);


  const emails = threadQuery.data ?? [];

  if (threadQuery.isLoading) {
    return <ThreadSkeleton />;
  }

  if (threadQuery.isError) {
    return null; // navigation already triggered
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <button
           onClick={() => (inboxFrom ? navigate(inboxFrom) : navigate('/emails'))}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-xl font-semibold">
              {emails[0]?.subject || '(No subject)'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {emails.length} message{emails.length !== 1 ? 's' : ''} in conversation
            </p>
          </div>
        </div>
      </div>

      {/* Thread Emails */}
      <div className="container mx-auto px-6 py-6 max-w-4xl space-y-4">
        
        {emails.map((email) => {
            const { content, quotedText } = parseEmailBody(email.body || email.snippet);
            const isMine = email.from_address.includes("jd1864440@gmail.com");
            return (
          <EmailMessage 
            key={email.id}
            email={email}
            content={content}
            quotedText={quotedText}
            isMine={isMine} 
            threadUrl={threadUrl}
            inboxFrom={inboxFrom}
            />
        )})}
      </div>
    </div>
  );
}

/* ----------------------------- Email Message ------------------------------ */

interface EmailMessageProps{
    email: Email;
    content: string;
    quotedText: string;
    isMine: boolean;
    inboxFrom?: string;
    threadUrl: string;
}
function EmailMessage({ email,
  content,
  quotedText,
  isMine, inboxFrom, threadUrl}: EmailMessageProps) {
    const navigate = useNavigate();
    const [showQuoted, setShowQuoted] = useState(false);
    function handleEmailClick(email: Email) {
      navigate(`/emails/${email.id}`, {
      state: { from: threadUrl,      // ✅ back to this thread
      inboxFrom: inboxFrom // ✅ back to inbox later },
      }
    });
  }

  return (
    <Card className={cn(isMine ? "bg-blue-50 border-blue-200" : "bg-white")} >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <button onClick={() => handleEmailClick(email)}>
            <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isMine ? "bg-blue-100" : "bg-gray-100"
            )}>
              <User className={cn(
                "w-5 h-5",
                isMine ? "text-blue-600" : "text-gray-600"
              )} />
            </div>

            <div>
                <div>
                    <p className="font-semibold truncate max-w-[240px]">
                        {email.from_address.split('<')[0].trim() || email.from_address}
                    </p>
                    {isMine && (
                        <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">
                            You
                        </Badge>
                        )}
                </div>
              <p className="text-sm text-muted-foreground truncate max-w-[240px]">
                {email.from_address}
              </p>
            </div>
          </div>
          </button>
          

          <div className="text-right">
            <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
              <Calendar className="w-3 h-3" />
              {formatDate(email.created_at)}
            </p>

            {!email.processed && (
              <Badge variant="warning" className="mt-1">
                Unread
              </Badge>
            )}
          </div>
        </div>

        
        {/* Email Body - New Content Only */}
        <div className="whitespace-pre-wrap text-sm leading-relaxed mb-3">
          {content}
        </div>

        {/* Quoted Text Toggle */}
        {quotedText && (
          <div className="border-t pt-3 mt-3">
            <button
              onClick={() => setShowQuoted(!showQuoted)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              {showQuoted ? (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Hide quoted text
                </>
              ) : (
                <>
                  <ChevronRight className="w-3 h-3" />
                  Show quoted text
                </>
              )}
            </button>
            
            {showQuoted && (
              <div className="mt-3 pl-4 border-l-2 border-muted">
                <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {quotedText}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------- Utilities ------------------------------- */

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
