import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Paperclip, ExternalLink, Loader2, Sparkles, X } from 'lucide-react';

const CATEGORIES = ['Einkauf', 'Lieferant', 'Personalkosten', 'Miete', 'Nebenkosten', 'Betriebsausgaben', 'Sonstiges'];

export default function CashBookEntryForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    type: 'ausgabe',
    amount: '',
    description: '',
    category: '',
    notes: '',
  });
  const [uploading, setUploading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setOcrDone(false);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setReceiptUrl(file_url);
    setUploading(false);

    setOcrLoading(true);
    const res = await base44.functions.invoke('ocrProcessDocument', {
      fileUrl: file_url, documentType: 'Eingangsrechnung'
    });
    const ocr = res.data?.ocr || {};
    setForm(prev => ({
      ...prev,
      date: ocr.datum || prev.date,
      amount: ocr.betrag != null ? String(ocr.betrag) : prev.amount,
      description: ocr.absender ? `${ocr.absender}${ocr.rechnungsnummer ? ' · ' + ocr.rechnungsnummer : ''}` : prev.description,
      category: ocr.kategorie || prev.category,
    }));
    setOcrLoading(false);
    setOcrDone(true);
  };

  const handleSave = async () => {
    if (!form.amount || !form.description) return;
    setSaving(true);
    await base44.entities.CashBookEntry.create({
      ...form,
      amount: parseFloat(form.amount),
      receiptUrl: receiptUrl || null,
    });
    setSaving(false);
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-t-3xl p-6 pb-28 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Buchung eintragen</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Einnahme / Ausgabe */}
        <div className="grid grid-cols-2 gap-2">
          {['ausgabe', 'einnahme'].map(t => (
            <button
              key={t}
              onClick={() => setForm(p => ({ ...p, type: t }))}
              className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                form.type === t
                  ? t === 'ausgabe'
                    ? 'bg-red-500/20 border-red-500/40 text-red-400'
                    : 'bg-green-500/20 border-green-500/40 text-green-400'
                  : 'border-border text-muted-foreground'
              }`}
            >
              {t === 'ausgabe' ? '− Ausgabe' : '+ Einnahme'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-medium">Datum</label>
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium">Betrag (€) *</label>
            <input type="number" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5" placeholder="0.00" />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">Beschreibung / Verwendungszweck *</label>
          <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5"
            placeholder="z.B. Metro Einkauf, Reinigungsmittel..." />
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">Kategorie</label>
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5">
            <option value="">— wählen —</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">Beleg hochladen</label>
          {receiptUrl ? (
            <div className="mt-1 space-y-2">
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <Paperclip size={14} className="text-green-400 flex-shrink-0" />
                <span className="text-xs text-green-400 flex-1 truncate">Beleg hochgeladen</span>
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-green-500/20 rounded-lg">
                  <ExternalLink size={13} className="text-green-400" />
                </a>
                <button onClick={() => { setReceiptUrl(''); setOcrDone(false); }} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
              </div>
              {ocrLoading && (
                <div className="flex items-center gap-2 p-2.5 bg-primary/10 border border-primary/20 rounded-xl">
                  <Loader2 size={13} className="animate-spin text-primary" />
                  <span className="text-xs text-primary">KI liest Beleg aus...</span>
                </div>
              )}
              {ocrDone && !ocrLoading && (
                <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <Sparkles size={13} className="text-green-400" />
                  <span className="text-xs text-green-400">Felder automatisch befüllt — bitte prüfen</span>
                </div>
              )}
            </div>
          ) : (
            <label className="mt-1 flex items-center gap-2 p-3 border border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/30 transition-colors">
              {uploading
                ? <><Loader2 size={14} className="animate-spin text-primary" /><span className="text-xs text-muted-foreground">Wird hochgeladen...</span></>
                : <><Paperclip size={14} className="text-muted-foreground" /><span className="text-xs text-muted-foreground">PDF, JPG oder PNG — OCR startet automatisch</span></>
              }
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </label>
          )}
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">Notiz (optional)</label>
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5 h-14 resize-none"
            placeholder="Zusätzliche Infos..." />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || uploading || ocrLoading || !form.amount || !form.description}
          className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-50"
        >
          {saving ? 'Wird gespeichert...' : 'Buchung speichern'}
        </button>
      </div>
    </div>
  );
}