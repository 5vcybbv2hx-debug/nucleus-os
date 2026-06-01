import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  BookOpen, Plus, Lock, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight as ChevronRightIcon,
  Paperclip, ExternalLink, Loader2, Sparkles, FolderOpen, RefreshCw, Receipt
} from 'lucide-react';
import NasFolderBrowser from '@/components/nas/NasFolderBrowser';
import CashBookEntryForm from '@/components/cashbook/CashBookEntryForm';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export default function CashBook() {
  const [entries, setEntries] = useState([]);
  const [cashEntries, setCashEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState('buchungen'); // 'buchungen' | 'abschluesse'
  const [showForm, setShowForm] = useState(false);
  const [showAbschlussForm, setShowAbschlussForm] = useState(false);
  const [abschlussForm, setAbschlussForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), openingBalance: '', closingBalance: '', totalIncome: '', totalExpenses: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [nasImporting, setNasImporting] = useState(false);
  const [nasImportResult, setNasImportResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [nasConfig, setNasConfig] = useState(null);
  const [showNasBrowser, setShowNasBrowser] = useState(false);
  const [nasPath, setNasPath] = useState('');

  useEffect(() => {
    base44.entities.NasConfig.list().then(configs => {
      if (configs[0]?.connectionStatus === 'connected') {
        setNasConfig(configs[0]);
        setNasPath(`/Backoffice OS/SAVO/01FINANZEN/Kassenberichte/`);
      }
    });
  }, []);

  const load = async () => {
    setLoading(true);
    const [cb, ce] = await Promise.all([
      base44.entities.CashBook.list(),
      base44.entities.CashBookEntry.list(),
    ]);
    setEntries(cb);
    setCashEntries(ce);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: de });

  // Tagesabschlüsse dieses Monats
  const monthAbschluesse = entries.filter(e => {
    const d = parseISO(e.date);
    return d >= monthStart && d <= monthEnd;
  }).sort((a, b) => a.date.localeCompare(b.date));

  // Einzelbuchungen dieses Monats
  const monthBuchungen = cashEntries.filter(e => {
    if (!e.date) return false;
    const d = parseISO(e.date);
    return d >= monthStart && d <= monthEnd;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const totalIncome = monthBuchungen.filter(e => e.type === 'einnahme').reduce((s, e) => s + (e.amount || 0), 0);
  const totalExpenses = monthBuchungen.filter(e => e.type === 'ausgabe').reduce((s, e) => s + (e.amount || 0), 0);

  // Z-Abschlag Upload & OCR
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setOcrDone(false);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedFileUrl(file_url);
    setUploading(false);
    setOcrLoading(true);
    const res = await base44.functions.invoke('ocrProcessDocument', { fileUrl: file_url, documentType: 'Kassenbericht' });
    const ocr = res.data?.ocr || {};
    setAbschlussForm(prev => ({
      ...prev,
      date: ocr.datum || prev.date,
      openingBalance: ocr.anfangsbestand != null ? String(ocr.anfangsbestand) : prev.openingBalance,
      closingBalance: ocr.endbestand != null ? String(ocr.endbestand) : prev.closingBalance,
      totalIncome: ocr.einnahmen != null ? String(ocr.einnahmen) : (ocr.betrag != null ? String(ocr.betrag) : prev.totalIncome),
      totalExpenses: ocr.ausgaben != null ? String(ocr.ausgaben) : prev.totalExpenses,
      notes: ocr.kurzinhalt || prev.notes,
    }));
    setOcrLoading(false);
    setOcrDone(true);
    if (nasConfig && ocr.datum) {
      const year = ocr.datum.substring(0, 4);
      setNasPath(`/Backoffice OS/SAVO/01FINANZEN/Kassenberichte/${year}/`);
    }
  };

  const handleSaveAbschluss = async () => {
    setSaving(true);
    if (nasConfig && uploadedFileUrl && nasPath) {
      const dateStr = abschlussForm.date.replace(/-/g, '');
      const ext = uploadedFileUrl.split('.').pop()?.split('?')[0] || 'pdf';
      const targetPath = `${nasPath.replace(/\/$/, '')}/Z-Abschlag_${dateStr}.${ext}`;
      await base44.functions.invoke('nasUploadFile', {
        fileUrl: uploadedFileUrl,
        nasUrl: nasConfig.nasUrl,
        nasUsername: nasConfig.nasUsername,
        nasPassword: nasConfig.nasPassword,
        nasTargetPath: targetPath,
      });
    }
    await base44.entities.CashBook.create({
      ...abschlussForm,
      bereich: 'BAR',
      openingBalance: parseFloat(abschlussForm.openingBalance) || 0,
      closingBalance: parseFloat(abschlussForm.closingBalance) || 0,
      totalIncome: parseFloat(abschlussForm.totalIncome) || totalIncome,
      totalExpenses: parseFloat(abschlussForm.totalExpenses) || totalExpenses,
      fileUrl: uploadedFileUrl || null,
      nasPath: nasPath || null,
    });
    setSaving(false);
    setShowAbschlussForm(false);
    setAbschlussForm({ date: format(new Date(), 'yyyy-MM-dd'), openingBalance: '', closingBalance: '', totalIncome: '', totalExpenses: '', notes: '' });
    setUploadedFileUrl('');
    setOcrDone(false);
    load();
  };

  const handleLock = async (entry) => {
    await base44.entities.CashBook.update(entry.id, { isLocked: true });
    load();
  };

  const handleNasImport = async () => {
    setNasImporting(true);
    setNasImportResult(null);
    const res = await base44.functions.invoke('nasImportZAbschlaege', {});
    setNasImportResult(res.data);
    setNasImporting(false);
    if (res.data?.imported > 0) load();
  };

  return (
    <div className="px-4 pt-14 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Kassenbuch Bar</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Einnahmen, Ausgaben & Abschlüsse</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNasImport}
            disabled={nasImporting}
            className="flex items-center gap-1.5 px-3 py-2 border border-border text-muted-foreground rounded-xl text-sm font-medium hover:bg-secondary/50 transition-colors disabled:opacity-50"
            title="Z-Abschlüge von NAS importieren"
          >
            {nasImporting ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            NAS
          </button>
          <button
            onClick={() => activeTab === 'buchungen' ? setShowForm(true) : setShowAbschlussForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
          >
            <Plus size={16} />
            {activeTab === 'buchungen' ? 'Buchung' : 'Abschluss'}
          </button>
        </div>
      </div>

      {/* NAS Import Ergebnis */}
      {nasImportResult && (
        <div className={`mb-4 p-3 rounded-xl border text-xs flex items-start gap-2 ${nasImportResult.error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
          {nasImportResult.error ? '✕' : <Sparkles size={13} className="flex-shrink-0 mt-0.5" />}
          <div>
            {nasImportResult.error
              ? nasImportResult.error
              : <><span className="font-medium">{nasImportResult.imported} neue Z-Abschlüge importiert</span> ({nasImportResult.scanned} Dateien gescannt, {nasImportResult.skipped} bereits vorhanden)</>
            }
          </div>
          <button onClick={() => setNasImportResult(null)} className="ml-auto opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4 p-3 bg-card border border-border rounded-2xl">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold">{monthLabel}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{monthBuchungen.length} Buchungen · {monthAbschluesse.length} Abschlüsse</div>
        </div>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
          <ChevronRightIcon size={18} />
        </button>
      </div>

      {/* Summary */}
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

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary/40 rounded-xl mb-4">
        {[
          { key: 'buchungen', label: 'Buchungen', count: monthBuchungen.length },
          { key: 'abschluesse', label: 'Z-Abschlüsse', count: monthAbschluesse.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            {tab.label} {tab.count > 0 && <span className="ml-1 opacity-60">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* Tab: Buchungen */}
      {activeTab === 'buchungen' && (
        loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-card rounded-xl animate-pulse" />)}</div>
        ) : monthBuchungen.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Keine Buchungen in {monthLabel}</p>
            <button onClick={() => setShowForm(true)} className="mt-3 text-xs text-primary hover:underline">Erste Buchung eintragen</button>
          </div>
        ) : (
          <div className="space-y-2">
            {monthBuchungen.map(e => (
              <div key={e.id} className="p-3 bg-card border border-border rounded-xl flex items-center gap-3">
                <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${e.type === 'einnahme' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{e.description}</span>
                    {e.category && <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full flex-shrink-0">{e.category}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{format(parseISO(e.date), 'dd. MMM yyyy', { locale: de })}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {e.receiptUrl && (
                    <a href={e.receiptUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                      <Paperclip size={13} className="text-primary" />
                    </a>
                  )}
                  <span className={`text-sm font-semibold ${e.type === 'einnahme' ? 'text-green-400' : 'text-red-400'}`}>
                    {e.type === 'einnahme' ? '+' : '−'}{(e.amount || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Tab: Z-Abschlüsse */}
      {activeTab === 'abschluesse' && (
        loading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-card rounded-xl animate-pulse" />)}</div>
        ) : monthAbschluesse.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Keine Z-Abschlüsse in {monthLabel}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {monthAbschluesse.map(e => (
              <div key={e.id} className="p-3 bg-card border border-border rounded-xl flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium">{format(parseISO(e.date), 'EEE, dd. MMMM', { locale: de })}</div>
                  <div className="flex gap-3 mt-0.5 text-xs">
                    <span className="text-green-400">+{(e.totalIncome || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                    <span className="text-red-400">−{(e.totalExpenses || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
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
        )
      )}

      {/* Buchung Form */}
      {showForm && (
        <CashBookEntryForm onClose={() => setShowForm(false)} onSuccess={load} />
      )}

      {/* Z-Abschluss Form */}
      {showAbschlussForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card border border-border rounded-t-3xl p-6 pb-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Z-Abschluss / Tagesabschluss</h2>
              <button onClick={() => setShowAbschlussForm(false)} className="text-muted-foreground text-sm">Abbrechen</button>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Datum</label>
              <input type="date" value={abschlussForm.date} onChange={e => setAbschlussForm(p => ({ ...p, date: e.target.value }))} className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Anfangsbestand (€)</label>
                <input type="number" value={abschlussForm.openingBalance} onChange={e => setAbschlussForm(p => ({ ...p, openingBalance: e.target.value }))} className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5" placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Endbestand (€)</label>
                <input type="number" value={abschlussForm.closingBalance} onChange={e => setAbschlussForm(p => ({ ...p, closingBalance: e.target.value }))} className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5" placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Einnahmen (€)</label>
                <input type="number" value={abschlussForm.totalIncome} onChange={e => setAbschlussForm(p => ({ ...p, totalIncome: e.target.value }))} className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5" placeholder={totalIncome.toFixed(2)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Ausgaben (€)</label>
                <input type="number" value={abschlussForm.totalExpenses} onChange={e => setAbschlussForm(p => ({ ...p, totalExpenses: e.target.value }))} className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5" placeholder={totalExpenses.toFixed(2)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Notizen</label>
              <textarea value={abschlussForm.notes} onChange={e => setAbschlussForm(p => ({ ...p, notes: e.target.value }))} className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5 h-16 resize-none" placeholder="Besonderheiten des Tages..." />
            </div>

            {/* File Upload + Auto-OCR */}
            <div>
              <label className="text-xs text-muted-foreground font-medium">Z-Abschlag / Kassenbeleg</label>
              {uploadedFileUrl ? (
                <div className="mt-1 space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <Paperclip size={14} className="text-green-400 flex-shrink-0" />
                    <span className="text-xs text-green-400 flex-1 truncate">Beleg hochgeladen</span>
                    <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-green-500/20 rounded-lg">
                      <ExternalLink size={13} className="text-green-400" />
                    </a>
                    <button onClick={() => { setUploadedFileUrl(''); setOcrDone(false); }} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
                  </div>
                  {ocrLoading && (
                    <div className="flex items-center gap-2 p-2.5 bg-primary/10 border border-primary/20 rounded-xl">
                      <Loader2 size={13} className="animate-spin text-primary" />
                      <span className="text-xs text-primary">KI analysiert Z-Abschlag...</span>
                    </div>
                  )}
                  {ocrDone && !ocrLoading && (
                    <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <Sparkles size={13} className="text-green-400" />
                      <span className="text-xs text-green-400">OCR abgeschlossen — Felder automatisch befüllt</span>
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

            {/* NAS-Pfad */}
            {nasConfig && (
              <div>
                <label className="text-xs text-muted-foreground font-medium">NAS-Zielordner</label>
                <div className="flex gap-2 mt-1">
                  <input value={nasPath} onChange={e => setNasPath(e.target.value)}
                    className="flex-1 bg-input border border-border text-foreground text-xs rounded-xl px-3 py-2.5 font-mono"
                    placeholder="/Backoffice OS/SAVO/01FINANZEN/Kassenberichte/2026/" />
                  <button type="button" onClick={() => setShowNasBrowser(p => !p)}
                    className={`px-3 py-2 border rounded-xl transition-colors ${showNasBrowser ? 'bg-primary/10 border-primary/30' : 'border-border hover:bg-secondary/50'}`}>
                    <FolderOpen size={14} className="text-primary" />
                  </button>
                </div>
                {showNasBrowser && (
                  <div className="mt-2">
                    <NasFolderBrowser nasConfig={nasConfig} selectedPath={nasPath}
                      onSelectPath={(path) => { setNasPath(path); setShowNasBrowser(false); }} />
                  </div>
                )}
              </div>
            )}

            <button onClick={handleSaveAbschluss} disabled={saving || uploading || ocrLoading}
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-50">
              {saving ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}