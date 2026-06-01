import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight } from 'lucide-react';
import BereichBadge from '@/components/ui/BereichBadge';
import { DocStatusBadge } from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function InboxList({ documents }) {
  const navigate = useNavigate();

  if (!documents?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Keine neuen Dokumente
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.slice(0, 5).map(doc => (
        <button
          key={doc.id}
          onClick={() => navigate(`/dokumente/${doc.id}`)}
          className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-secondary/30 transition-all text-left"
        >
          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
            <FileText size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{doc.title}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <BereichBadge bereich={doc.bereich} small />
              <span className="text-[10px] text-muted-foreground">
                {doc.created_date ? format(new Date(doc.created_date), 'dd. MMM', { locale: de }) : ''}
              </span>
            </div>
          </div>
          <DocStatusBadge status={doc.status} />
          <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
        </button>
      ))}
    </div>
  );
}