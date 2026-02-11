import type { Email } from '../../types';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { User, Mail, Calendar, AlertCircle, Clock } from 'lucide-react';

export const EmailBody = ({ email }: { email: Email }) => {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <Row icon={<User />} label="From" value={email.from_address} />
        <Row icon={<Mail />} label="To" value={email.to_address} />
        <Row icon={<Calendar />} label="Date" value={email.created_at} />

        {email.classification && (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Classification:</span>
            <Badge variant="secondary">{email.classification}</Badge>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Status:</span>
          <Badge>{email.processed ? 'Processed' : 'Unprocessed'}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {email.body || email.snippet || 'No content'}
        </div>
      </CardContent>
    </Card>
  );
};

const Row = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-2">
    <span className="text-muted-foreground">{icon}</span>
    <span className="text-sm font-medium">{label}:</span>
    <span className="text-sm">{value}</span>
  </div>
);
