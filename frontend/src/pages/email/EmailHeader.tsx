import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Email, EmailThread } from '../../types';

export const EmailHeader = ({ email }: { email: Email }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from;

  return (
    <div className="border-b bg-background sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => (from ? navigate(from) : navigate(-1))}
          className="p-2 hover:bg-accent rounded-md transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold truncate">
            {email.subject || '(No subject)'}
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            {email.from_address}
          </p>
        </div>
      </div>
    </div>
  );
};
