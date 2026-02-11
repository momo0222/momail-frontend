import { Card, CardHeader, CardContent, CardTitle } from '../../components/ui/Card';
import { Archive, Trash2, Check } from 'lucide-react';
import type { Email } from '../../types';

type Props = {
  email: Email;
  busy: boolean;
  onMarkRead: () => void;
  onArchive: () => void;
  onDelete: () => void;
};

export const EmailActions = ({
  email,
  busy,
  onMarkRead,
  onArchive,
  onDelete,
}: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        <ActionButton disabled={busy || email.processed} onClick={onMarkRead}>
          <Check className="w-4 h-4" /> Mark as Read
        </ActionButton>

        <ActionButton disabled={busy} onClick={onArchive}>
          <Archive className="w-4 h-4" /> Archive
        </ActionButton>

        <ActionButton danger disabled={busy} onClick={onDelete}>
          <Trash2 className="w-4 h-4" /> Delete
        </ActionButton>
      </CardContent>
    </Card>
  );
};

const ActionButton = ({
  children,
  danger,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  danger?: boolean;
}) => (
  <button
    {...props}
    className={`w-full flex items-center gap-2 px-4 py-2 rounded-md transition
      ${danger ? 'bg-destructive text-white' : 'bg-secondary'}
      disabled:opacity-50`}
  >
    {children}
  </button>
);
