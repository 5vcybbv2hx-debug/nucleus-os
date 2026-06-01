import { motion } from 'framer-motion';
import { FileText, ExternalLink, ChevronRight } from 'lucide-react';
import BereichBadge from '@/components/ui/BereichBadge';
import { DocStatusBadge } from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function DocumentCard({ doc, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:bg-secondary/30 transition-all text-left"
    >
      <div className="p-2.5 bg-primary/10 rounded-xl flex-shrink-0">
        <FileText size={18} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{doc.title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 truncate">
          {doc.documentType}
          {doc.ocrAbsender && <span> · {doc.ocrAbsender}</span>}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <BereichBadge bereich={doc.bereich} small />
          {doc.ocrBetrag && (
            <span className="text-[10px] font-semibold text-green-400">
              {doc.ocrBetrag.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <DocStatusBadge status={doc.status} />
        <span className="text-[10px] text-muted-foreground">
          {doc.created_date ? format(new Date(doc.created_date), 'dd.MM.yy', { locale: de }) : ''}
        </span>
      </div>
    </motion.button>
  );
}