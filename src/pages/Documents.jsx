import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Search, Plus, Filter, X, SlidersHorizontal, Camera } from 'lucide-react';
import DocumentCard from '@/components/documents/DocumentCard';
import DocumentUploadModal from '@/components/documents/DocumentUploadModal';
import QuickScanModal from '@/components/documents/QuickScanModal';
import BereichBadge from '@/components/ui/BereichBadge';
import { DOC_TYPES, DOC_STATUS, BEREICHE } from '@/lib/constants';
import { AnimatePresence, motion } from 'framer-motion';
import LegacyBanner from '@/components/LegacyBanner';

export default function Documents() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showQuickScan, setShowQuickScan] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ bereich: '', documentType: '', status: '' });

  const load = async () => {
    setLoading(true);
    const query = { isArchived: false };
    if (filters.bereich) query.bereich = filters.bereich;
    if (filters.documentType) query.documentType = filters.documentType;
    if (filters.status) query.status = filters.status;
    const docs = await base44.entities.Document.filter(query, '-created_date', 100);
    setDocuments(docs);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters]);

  const urlParams = new URLSearchParams(window.location.search);
  useEffect(() => {
    if (urlParams.get('search') === '1') document.getElementById('doc-search')?.focus();
  }, []);

  const filtered = documents.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.title?.toLowerCase().includes(q) ||
      d.ocrAbsender?.toLowerCase().includes(q) ||
      d.ocrRawText?.toLowerCase().includes(q) ||
      d.ocrRechnungsnummer?.toLowerCase().includes(q) ||
      d.documentType?.toLowerCase().includes(q) ||
      d.tags?.some(t => t.toLowerCase().includes(q)) ||
      d.ocrBetrag?.toString().includes(q)
    );
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="px-4 pt-14 pb-4">
      <LegacyBanner />
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Dokumente</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{documents.length} Einträge</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuickScan(true)}
            className="flex items-center gap-1.5 border border-primary/40 text-primary px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/10 transition-colors"
          >
            <Camera size={16} />
            Scan
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Neu
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          id="doc-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Suche: Absender, Betrag, Tag..."
          className="w-full bg-secondary border border-border text-foreground text-sm rounded-xl pl-10 pr-10 py-3 placeholder:text-muted-foreground"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <X size={14} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => setShowFilter(p => !p)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex-shrink-0 ${
            activeFilterCount > 0 || showFilter
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'border-border text-muted-foreground'
          }`}
        >
          <SlidersHorizontal size={12} />
          Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>

        {Object.entries(BEREICHE).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setFilters(p => ({ ...p, bereich: p.bereich === key ? '' : key }))}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filters.bereich === key
                ? `${val.bg} ${val.border} ${val.color} border`
                : 'border-border text-muted-foreground'
            }`}
          >
            {val.label}
          </button>
        ))}
      </div>

      {/* Expanded Filter */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-4 bg-card border border-border rounded-2xl space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Dokumenttyp</label>
                <select
                  value={filters.documentType}
                  onChange={e => setFilters(p => ({ ...p, documentType: e.target.value }))}
                  className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5"
                >
                  <option value="">Alle Typen</option>
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Status</label>
                <select
                  value={filters.status}
                  onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
                  className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5"
                >
                  <option value="">Alle Status</option>
                  {Object.entries(DOC_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters({ bereich: '', documentType: '', status: '' })}
                  className="text-xs text-red-400 font-medium"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 bg-card border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-4xl mb-3">📄</div>
          <div className="text-sm font-medium">Keine Dokumente gefunden</div>
          <div className="text-xs mt-1">Lade dein erstes Dokument hoch</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => (
            <DocumentCard key={doc.id} doc={doc} onClick={() => navigate(`/dokumente/${doc.id}`)} />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <DocumentUploadModal
            onClose={() => setShowUpload(false)}
            onSuccess={load}
          />
        )}
      </AnimatePresence>

      {/* Quick Scan Modal */}
      <AnimatePresence>
        {showQuickScan && (
          <QuickScanModal
            onClose={() => setShowQuickScan(false)}
            onSuccess={load}
          />
        )}
      </AnimatePresence>
    </div>
  );
}