import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BookOpen, Plus, Lock, TrendingUp, TrendingDown, ChevronLeft, ChevronRight as ChevronRightIcon, Paperclip, ExternalLink, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export default function CashBook() {
  const [entries, setEntries] = useState([]);
  const [financeEntries, setFinanceEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), openingBalance: '', closingBalance: '', totalIncome: '', totalExpenses: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');

  const load = async () => {
    setLoading(true);
    const [cb, fe] = await Promise.all([
      base44.entities.CashBook.list(),
      base44.entities.FinanceEntry.filter({ bereich: 'BAR' })
    ]);
    setEntries(cb);
    setFinanceEntries(fe);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: de });

  // CashBook entries for this month
  const monthEntries = entries.filter(e => {
    const d = parseISO(e.date);
    return d >= monthStart && d <= monthEnd;
  }).sort((a, b) => a.date.localeCompare(b.date));

  // Finance entries for this month (BAR)
  const monthFinance = financeEntries.filter(e => {
    if (!e.date) return false;
    const d = parseISO(e.date);
    return d >= monthStart && d <= monthEnd;
  });
  const totalIncome = monthFinance.filter(e => e.type === 'einnahme').reduce((s, e) => s + (e.amount || 0), 0);
  const totalExpenses = monthFinance.filter(e => e.type === 'ausgabe').reduce((s, e) => s + (e.amount || 0), 0);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedFileUrl(file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.CashBook.create({
      ...form,
      bereich: 'BAR',
      openingBalance: parseFloat(form.openingBalance) || 0,
      closingBalance: parseFloat(form.closingBalance) || 0,
      totalIncome: parseFloat(form.totalIncome) || totalIncome,
      totalExpenses: parseFloat(form.totalExpenses) || totalExpenses,
      fileUrl: uploadedFileUrl || null,
    });
    setSaving(false);
    setShowForm(false);
    setForm({ date: format(new Date(), 'yyyy-MM-dd'), openingBalance: '', closingBalance: '', totalIncome: '', totalExpenses: '', notes: '' });
    setUploadedFileUrl('');
    load();
  };

  const handleLock = async (entry) => {
    await base44.entities.CashBook.update(entry.id, { isLocked: true });
    load();
  };

  return (
    <div className="px-4 pt-14 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Kassenbuch Bar</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Tagesabschlüsse</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
        >
          <Plus size={16} /> Tagesabschluss
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4 p-3 bg-card border border-border rounded-2xl">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold">{monthLabel}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{monthEntries.length} Einträge</div>
        </div>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
          <ChevronRightIcon size={18} />
        </button>
      </div>

      {/* Monthly Summary from FinanceEntries */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs text-green-400 mb-1"><TrendingUp size={12} /> Einnahmen</div>
          <div className="text-lg font-bold text-green-400">{totalIncome.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</div>
        </div>
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs text-red-400 mb-1"><TrendingDown size={12} /> Ausgaben</div>
          <div className="text-lg font-bold text-red-400">{totalExpenses.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</div>
        </div>
      </div>

      {/* Tagesabschlüsse */}
      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-card rounded-xl animate-pulse" />)}</div>
      ) : monthEntries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Keine Tagesabschlüsse in {monthLabel}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {monthEntries.map(e => (
            <div key={e.id} className="p-3 bg-card border border-border rounded-xl flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm font-medium">{format(parseISO(e.date), 'EEE, dd. MMMM', { locale: de })}</div>
                <div className="flex gap-3 mt-0.5 text-xs">
                  <span className="text-green-400">+{(e.totalIncome || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                  <span className="text-red-400">-{(e.totalExpenses || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                  <span className="text-muted-foreground">End: {(e.closingBalance || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                </div>
                {e.notes && <div className="text-xs text-muted-foreground mt-0.5 truncate">{e.notes}</div>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {e.fileUrl && (
                  <a href={e.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                    <Paperclip size={13} className="text-primary" />
                  </a>
                )}
                {e.isLocked ? (
                  <Lock size={14} className="text-muted-foreground" />
                ) : (
                  <button onClick={() => handleLock(e)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 border border-border rounded-lg transition-colors">
                    Sperren
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card border border-border rounded-t-3xl p-6 pb-10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Tagesabschluss</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground text-sm">Abbrechen</button>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Datum</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Anfangsbestand (€)</label>
                <input type="number" value={form.openingBalance} onChange={e => setForm(p => ({ ...p, openingBalance: e.target.value }))} className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5" placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Endbestand (€)</label>
                <input type="number" value={form.closingBalance} onChange={e => setForm(p => ({ ...p, closingBalance: e.target.value }))} className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5" placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Einnahmen (€)</label>
                <input type="number" value={form.totalIncome} onChange={e => setForm(p => ({ ...p, totalIncome: e.target.value }))} className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5" placeholder={totalIncome.toFixed(2)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Ausgaben (€)</label>
                <input type="number" value={form.totalExpenses} onChange={e => setForm(p => ({ ...p, totalExpenses: e.target.value }))} className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5" placeholder={totalExpenses.toFixed(2)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Notizen</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5 h-16 resize-none" placeholder="Besonderheiten des Tages..." />
            </div>

            {/* File Upload */}
            <div>
              <label className="text-xs text-muted-foreground font-medium">Kassenbeleg (PDF / Foto)</label>
              {uploadedFileUrl ? (
                <div className="mt-1 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <Paperclip size={14} className="text-green-400 flex-shrink-0" />
                  <span className="text-xs text-green-400 flex-1 truncate">Datei hochgeladen</span>
                  <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-green-500/20 rounded-lg transition-colors">
                    <ExternalLink size={13} className="text-green-400" />
                  </a>
                  <button onClick={() => setUploadedFileUrl('')} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
                </div>
              ) : (
                <label className="mt-1 flex items-center gap-2 p-3 border border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/30 transition-colors">
                  {uploading ? (
                    <><Loader2 size={14} className="animate-spin text-primary" /><span className="text-xs text-muted-foreground">Wird hochgeladen...</span></>
                  ) : (
                    <><Paperclip size={14} className="text-muted-foreground" /><span className="text-xs text-muted-foreground">PDF, JPG oder PNG anhängen</span></>
                  )}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>

            <button onClick={handleSave} disabled={saving || uploading} className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-50">
              {saving ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}