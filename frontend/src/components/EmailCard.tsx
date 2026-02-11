import type { EmailThread } from "../types";
import { Card, CardContent, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { MessageSquare } from "lucide-react";

interface EmailCardProps {
    email: EmailThread;
    onClick?: () => void;
}

export function EmailCard({email, onClick}: EmailCardProps){

    function formatDate(dateString: string){
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60_000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    }

    function getClassificationVariant(
        classification: EmailThread["classification"]
    ){
        switch(classification) {
            case "urgent":
                return "destructive";
            case "spam":
                return "secondary";
            case "personal":
                return "default";
            case "routine":
                return "success"
            default:
                return "secondary"
        }   
    }

    return (
    <div 
      onClick={onClick}
      className={`
        flex items-start gap-4 p-4 border-b hover:bg-accent/50 cursor-pointer transition-colors
        ${email.has_unread ? 'bg-blue-50/30' : ''}
      `}
    >
      {/* Left - Unread Indicator */}
      <div className="flex-shrink-0 pt-1">
        <div className={`w-2 h-2 rounded-full ${email.has_unread ? 'bg-primary' : 'bg-transparent'}`} />
      </div>

      {/* Middle - Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className={`text-sm truncate ${email.has_unread ? 'font-semibold' : 'font-medium'}`}>
            {email.from_address.split('<')[0].trim() || email.from_address}
          </span>
          {email.thread_count > 1 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              {email.thread_count}
            </span>
          )}
        </div>
        
        <h3 className={`text-sm truncate mb-1 ${email.has_unread ? 'font-semibold' : ''}`}>
          {email.subject || '(No subject)'}
        </h3>
        
        <p className="text-sm text-muted-foreground truncate">
          {email.snippet}
        </p>
      </div>

      {/* Right - Metadata */}
      <div className="flex-shrink-0 text-right space-y-2">
        <div className="text-xs text-muted-foreground">
          {formatDate(email.created_at)}
        </div>
        {email.classification && (
          <Badge variant={`${getClassificationVariant(email.classification)}`} className="text-xs">
            {email.classification}
          </Badge>
        )}
      </div>
    </div>
  );
}