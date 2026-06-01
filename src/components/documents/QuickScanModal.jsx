import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Camera, Loader2, Sparkles, CheckCircle2, FolderOpen, ChevronRight, AlertCircle } from 'lucide-react';
import { BEREICHE, DOC_TYPES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import NasFolderBrowser from '@/components/nas/NasFolderBrowser';

// step: capture → ocr → confirm → saving → done
export default function QuickScanModal({ onClose, onSuccess }) {
  const [step, setStep] = useState('capture');
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [ocrData, setOcrData] = useState(null);
  const [nasConfig, setNasConfig] = useState(null);
  const [showNasBrowser, setShowNasBrowser] = useState(false);
  const [form, setForm] = useState({
    bereich: 'BAR',
    documentType: 'Eingangsrechnung',
    nasPath: '',
    title: '',
    ocrDatum: '',
    ocrBetrag: '',
    ocrAbsender: '',
    ocrRechnungsnummer: '',
    ocrKategorie: '',
    ocrZahlungsart: '',
  });

  useEffect(() => {
    base44.entities.NasConfig.list().then(configs => {
      if (configs[0]?.connectionStatus === 'connected') setNasConfig(configs[0]);
    });
  }, []);

  const handleCapture = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setUploading(true);
    setStep('ocr');
    // Upload + OCR parallel starten
    const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
    setFileUrl(file_url);
    const res = await base44.functions.invoke('ocrProcessDocument', {
      fileUrl: file_url, documentType: form.documentType
    });
    const ocr = res.data?.ocr || {};
    setOcrData(ocr);
    setForm(prev => ({
      ...prev,
      title: ocr.absender || f.name.replace(/\.[^.]+$/, ''),
      ocrDatum: ocr.datum || '',
      ocrBetrag: ocr.betrag?.toString() || '',
      ocrAbsender: ocr.absender || '',
      ocrRechnungsnummer: ocr.rechnungsnummer || '',
      ocrKategorie: ocr.kategorie || '',
      ocrZahlungsart: ocr.zahlungsart || '',
    }));
    setUploading(false);
    setStep('confirm');
  };

  const handleSave = async () => {
    setStep('saving');
    await base44.entities.Document.create({
      title: form.title || form.ocrAbsender || 'Scan',
      bereich: form.bereich,
      documentType: form.documentType,
      status: 'neu',
      nasPath: form.nasPath,
      fileUrl,
      ocrDatum: form.ocrDatum,
      ocrBetrag: form.ocrBetrag ? parseFloat(form.ocrBetrag) : null,
      ocrAbsender: form.ocrAbsender,
      ocrRechnungsnummer: form.ocrRechnungsnummer,
      ocrKategorie: form.ocrKategorie,
      ocrZahlungsart: form.ocrZahlungsart,
      ocrProcessed: true,
      tags: [],
      isArchived: false,
    });
    setStep('done');
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="w-full max-w-lg bg-card border border-border rounded-t-3xl p-6 pb-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-primary" />
            <h2 className="text-base font-semibold">Schnell-Scan</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Step: Capture */}
        {step === 'capture' && (
          <div className="space-y-4">
            {/* Bereich */}
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(BEREICHE).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setForm(p => ({ ...p, bereich: key }))}
                  className={`py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    form.bereich === key
                      ? `${val.bg} ${val.border} ${val.color}`
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {val.label}
                </button>
              ))}
            </div>

            {/* Dokumenttyp */}
            <select
              value={form.documentType}
              onChange={e => setForm(p => ({ ...p, documentType: e.target.value }))}
              className="w-full bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5"
            >
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* Kamera / Datei */}
            <label className="block">
              <div className="flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed border-primary/40 rounded-2xl bg-primary/5 cursor-pointer active:bg-primary/10 transition-all">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera size={30} className="text-primary" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-foreground">Foto aufnehmen</div>
                  <div className="text-xs text-muted-foreground mt-0.5">oder aus Galerie wählen</div>
                </div>
              </div>
              <input
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={handleCapture}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Step: OCR läuft */}
        {step === 'ocr' && (
          <div className="flex flex-col items-center justify-center py-14 gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles size={32} className="text-primary" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold">KI analysiert Dokument...</div>
              <div className="text-xs text-muted-foreground mt-1">Datum, Betrag & Absender werden erkannt</div>
            </div>
            <Loader2 size={18} className="text-primary animate-spin mt-2" />
          </div>
        )}

        {/* Step: Bestätigung + NAS-Ordner */}
        {step === 'confirm' && (
          <div className="space-y-4">
            {/* OCR-Ergebnis kompakt */}
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium mb-2">
                <Sparkles size={12} /> OCR erkannt
              </div>
              {form.ocrAbsender && <InfoRow label="Absender" value={form.ocrAbsender} />}
              {form.ocrDatum && <InfoRow label="Datum" value={form.ocrDatum} />}
              {form.ocrBetrag && <InfoRow label="Betrag" value={`${form.ocrBetrag} €`} />}
              {form.ocrRechnungsnummer && <InfoRow label="Re-Nr." value={form.ocrRechnungsnummer} />}
            </div>

            {/* Titel editierbar */}
            <div>
              <label className="text-xs text-muted-foreground font-medium">Titel</label>
              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5"
                placeholder="Dokumenttitel"
              />
            </div>

            {/* NAS-Pfad */}
            <div>
              <label className="text-xs text-muted-foreground font-medium">
                NAS-Ordner {!nasConfig && <span className="text-muted-foreground/50">(kein NAS verbunden)</span>}
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  value={form.nasPath}
                  onChange={e => setForm(p => ({ ...p, nasPath: e.target.value }))}
                  className="flex-1 bg-input border border-border text-foreground text-xs rounded-xl px-3 py-2.5 font-mono"
                  placeholder="/Backoffice/Bar/Rechnungen/"
                />
                {nasConfig && (
                  <button
                    onClick={() => setShowNasBrowser(p => !p)}
                    className={`px-3 py-2 border rounded-xl transition-colors ${showNasBrowser ? 'bg-primary/10 border-primary/30' : 'border-border hover:bg-secondary/50'}`}
                  >
                    <FolderOpen size={14} className="text-primary" />
                  </button>
                )}
              </div>
              {showNasBrowser && nasConfig && (
                <div className="mt-2">
                  <NasFolderBrowser
                    nasConfig={nasConfig}
                    selectedPath={form.nasPath}
                    onSelectPath={(path) => {
                      setForm(p => ({ ...p, nasPath: path }));
                      setShowNasBrowser(false);
                    }}
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors mt-2"
            >
              <CheckCircle2 size={16} />
              Speichern & fertig
            </button>
          </div>
        )}

        {/* Step: Speichern */}
        {step === 'saving' && (
          <div className="flex flex-col items-center justify-center py-14 gap-4">
            <Loader2 size={36} className="text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Wird gespeichert...</span>
          </div>
        )}

        {/* Step: Fertig */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-14 gap-4">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 size={40} className="text-green-400" />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-foreground">Dokument gespeichert!</div>
              <div className="text-xs text-muted-foreground mt-1">OCR & NAS-Pfad eingetragen</div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium truncate max-w-[60%] text-right">{value}</span>
    </div>
  );
}