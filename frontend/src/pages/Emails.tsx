import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { emailsApi } from '../api/email';
import type { EmailThread, Email } from '../types';

import { EmailCard } from '../components/EmailCard';
import { AgentChat } from '../components/AgentChat';


import { Inbox, Search, Bot, X, Plus } from 'lucide-react';
import useDebouncedValue from '../hooks/utils';

/* ---------------------------------- Types ---------------------------------- */

type Filter =
  | 'all'
  | 'unprocessed'
  | 'processed'
  | 'urgent'
  | 'routine'
  | 'personal'
  | 'spam'
  | "sent";

interface ThreadQueryParams {
  limit?: number;
  classification?: string;
  processed?: boolean;
}

interface SearchParams {
  query?: string;
  sender?: string;
  classification?: string;
  processed?: boolean;
  limit?: number;
}

/* ---------------------------------- Emails --------------------------------- */

export function Emails() {
  const navigate = useNavigate();
  const location = useLocation();

  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [searchResults, setSearchResults] = useState<Email[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  const [filter, setFilter] = useState<Filter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 400);

  const [showChat, setShowChat] = useState(false);

  const isSearching = debouncedSearch.trim().length > 0;

  /* ------------------------------- Data Load ------------------------------- */

  // Load data when filter or search changes
  useEffect(() => {
    loadData();  // ✅ Fixed!
  }, [filter, debouncedSearch]);
  
  async function loadData(silent = false) {
    const isFirstLoad = threads.length === 0 && searchResults.length === 0;

    try {
      if (!silent && isFirstLoad) {
        setInitialLoading(true);
      } else if (!silent) {
        setSearchLoading(true);
      }

      if (isSearching) {
        await loadSearch();
      } else {
        await loadThreads();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      if (!silent) {
        setInitialLoading(false);
        setSearchLoading(false);
      }
    }
  }

  async function loadThreads() {
    const params: ThreadQueryParams = {
      limit: 50,
    };

    if (filter !== 'all') {
      if (filter === 'unprocessed') {
        params.processed = false;
      } else if(filter === 'processed'){
        params.processed = true;
      } else {
        params.classification = filter;
      }
    }

    const data = await emailsApi.listThreads(params);
    setThreads(data);
    setSearchResults([]);
  }

  async function loadSearch() {
    const params: SearchParams = {
      query: debouncedSearch.trim(),
      limit: 50,
    };

    if (filter !== 'all') {
      if (filter === 'unprocessed') {
        params.processed = false;
      } else if(filter === 'processed'){
        params.processed = true;
      }
      else {
        params.classification = filter;
      }
    }

    const data = await emailsApi.search(params);
    setSearchResults(data);
    setThreads([]);
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [filter, debouncedSearch]);

  /* ------------------------------ Navigation ------------------------------- */

  function handleThreadClick(thread: EmailThread) {
    // Optimistically mark thread as read in UI
    navigate(
      thread.thread_count > 1 ? `/emails/thread/${thread.thread_id}`
      : `/emails/${thread.id}`,
      {
        state: {
          inboxFrom: location.pathname + location.search
        },
      }
    )
  }

  function handleEmailClick(email: Email) {
    navigate(`/emails/${email.id}`);
  }

  /* -------------------------------- Loading -------------------------------- */

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  /* -------------------------------- Render -------------------------------- */

  const displayItems = isSearching ? searchResults : threads;
  const displayCount = displayItems.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          {/* Title + AI Button */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Inbox className="w-8 h-8" />
                Emails
              </h1>
              <p className="text-muted-foreground mt-1">
                {displayCount} {isSearching ? 'results' : 'items'}
                {searchLoading && <span className="ml-2">• Searching...</span>}
              </p>
            </div>
            <div className="flex gap-2">
              {/* Compose Button */}
              <button
                onClick={() => navigate('/compose', {
                  state: { from: location.pathname + location.search}
                })}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Compose
              </button>

              <button
                onClick={() => setShowChat(true)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
              >
                <Bot className="w-5 h-5" />
                Ask AI
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />

              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emails by subject, sender, or content..."
                className="w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
              All
            </FilterButton>

            <FilterButton
              active={filter === 'unprocessed'}
              onClick={() => setFilter('unprocessed')}
            >
              Unprocessed
            </FilterButton>
            <FilterButton
              active={filter === 'processed'}
              onClick={() => setFilter('processed')}
            >
              Processed
            </FilterButton>

            <FilterButton
              active={filter === 'urgent'}
              onClick={() => setFilter('urgent')}
            >
              Urgent
            </FilterButton>

            <FilterButton
              active={filter === 'routine'}
              onClick={() => setFilter('routine')}
            >
              Routine
            </FilterButton>

            <FilterButton
              active={filter === 'personal'}
              onClick={() => setFilter('personal')}
            >
              Personal
            </FilterButton>

            <FilterButton
              active={filter === 'spam'}
              onClick={() => setFilter('spam')}
            >
              Spam
            </FilterButton>
            <FilterButton
              active={filter === 'sent'}
              onClick={() => setFilter('sent')}
            >
              Sent
            </FilterButton>
          </div>
        </div>
      </div>

      {/* AI Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Bot className="w-6 h-6" />
                AI Assistant
              </h2>

              <button
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-accent rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <AgentChat />
            </div>
          </div>
        </div>
      )}

      {/* Email/Thread List */}
      <div className="container mx-auto px-6 py-8">
        {displayCount === 0 ? (
          <div className="text-center py-12">
            <Inbox className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isSearching ? 'No results found' : 'No emails found'}
            </h3>
            <p className="text-muted-foreground">
              {isSearching
                ? `No results for "${searchQuery}"`
                : 'Try changing your filter or wait for new emails.'}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg bg-background overflow-hidden">
            {isSearching ? (
              // Search results - individual emails
              searchResults.map((email) => (
                <EmailCard
                  key={email.id}
                  email={email as EmailThread}
                  onClick={() => handleEmailClick(email)}
                />
              ))
            ) : (
              // Thread view - grouped by conversation
              threads.map((thread) => (
                <EmailCard
                  key={thread.id}
                  email={thread}
                  onClick={() => handleThreadClick(thread)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ FilterButton ------------------------------- */

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-md text-sm font-medium transition-colors
        ${
          active
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        }
      `}
    >
      {children}
    </button>
  );
}