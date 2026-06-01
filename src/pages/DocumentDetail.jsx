import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, ExternalLink, Edit2, Check, X, Archive, FileText } from 'lucide-react';
import BereichBadge from '@/components/ui/BereichBadge';
import { DocStatusBadge } from '@/components/ui/StatusBadge';
import { DOC_TYPES, DOC_STATUS } from '@/lib/constants';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Document.filter({ id }).then(docs => {
      const d = docs[0];
      setDoc(d);
      setForm(d || {});
    });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Document.update(doc.id, form);
    setDoc(form);
    setEditing(false);
    setSaving(false);
  };

  const handleArchive = async () => {
    await base44.entities.Document.update(doc.id, { isArchived: true, status: 'archiviert' });
    navigate('/dokumente');
  };

  if (!doc) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="px-4 pt-14 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/dokumente')} className="p-2 rounded-xl hover:bg-secondary transition-colors -ml-2">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="p-2 rounded-xl hover:bg-secondary transition-colors"
              >
                <Edit2 size={18} className="text-muted-foreground" />
              </button>
              <button
                onClick={handleArchive}
                className="p-2 rounded-xl hover:bg-red-500/10 transition-colors"
              >
                <Archive size={18} className="text-muted-foreground" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setEditing(false); setForm(doc); }} className="p-2 rounded-xl hover:bg-secondary">
                <X size={18} className="text-muted-foreground" />
              </button>
              <button onClick={handleSave} disabled={saving} className="p-2 rounded-xl bg-primary hover:bg-primary/90">
                <Check size={18} className="text-primary-foreground" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Document Preview */}
      {doc.fileUrl && (
        <div className="mb-4 p-4 bg-card border border-border rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <FileText size={20} className="text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium">Dokument ansehen</div>
              <div className="text-xs text-muted-foreground">Direkt öffnen</div>
            </div>
          </div>
          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-2 bg-primary/10 rounded-xl">
            <ExternalLink size={16} className="text-primary" />
          </a>
        </div>
      )}

      {/* Main Info */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground font-medium">Titel</label>
          {editing ? (
            <input
              value={form.title || ''}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5"
            />
          ) : (
            <div className="text-base font-semibold mt-1">{doc.title}</div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <BereichBadge bereich={doc.bereich} />
          <DocStatusBadge status={doc.status} />
          {editing && (
            <select
              value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              className="bg-input border border-border text-foreground text-xs rounded-xl px-2 py-1.5 ml-auto"
            >
              {Object.entries(DOC_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
          <div>
            <div className="text-xs text-muted-foreground">Dokumenttyp</div>
            {editing ? (
              <select
                value={form.documentType || ''}
                onChange={e => setForm(p => ({ ...p, documentType: e.target.value }))}
                className="w-full mt-1 bg-input border border-border text-foreground text-xs rounded-xl px-2 py-1.5"
              >
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <div className="text-sm font-medium mt-0.5">{doc.documentType}</div>
            )}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Erstellt</div>
            <div className="text-sm font-medium mt-0.5">
              {doc.created_date ? format(new Date(doc.created_date), 'dd. MMM yyyy', { locale: de }) : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* OCR Data */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold">OCR-Daten</h3>
          {doc.ocrProcessed && <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-md">Erkannt</span>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'ocrDatum', label: 'Datum', type: 'date' },
            { key: 'ocrBetrag', label: 'Betrag (€)', type: 'number' },
            { key: 'ocrAbsender', label: 'Absender', type: 'text' },
            { key: 'ocrRechnungsnummer', label: 'Rechnungsnr.', type: 'text' },
            { key: 'ocrKategorie', label: 'Kategorie', type: 'text' },
            { key: 'ocrZahlungsart', label: 'Zahlungsart', type: 'text' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <div className="text-xs text-muted-foreground">{label}</div>
              {editing ? (
                <input
                  type={type}
                  value={form[key] || ''}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full mt-1 bg-input border border-border text-foreground text-xs rounded-xl px-2 py-1.5"
                />
              ) : (
                <div className="text-sm font-medium mt-0.5 text-foreground">
                  {key === 'ocrBetrag' && doc[key] ? `${parseFloat(doc[key]).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €` : (doc[key] || '—')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* NAS Path */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <h3 className="text-sm font-semibold mb-2">NAS-Pfad</h3>
        {editing ? (
          <input
            value={form.nasPath || ''}
            onChange={e => setForm(p => ({ ...p, nasPath: e.target.value }))}
            className="w-full bg-input border border-border text-foreground text-xs rounded-xl px-3 py-2 font-mono"
          />
        ) : (
          <div className="text-xs font-mono text-muted-foreground bg-secondary rounded-xl px-3 py-2">
            {doc.nasPath || 'Kein NAS-Pfad gesetzt'}
          </div>
        )}
      </div>

      {/* Tags */}
      {doc.tags?.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-semibold mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {doc.tags.map(tag => (
              <span key={tag} className="text-xs bg-secondary text-muted-foreground px-2 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}