import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Upload, Camera, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { DOC_TYPES, BEREICHE } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

export default function DocumentUploadModal({ onClose, onSuccess }) {
  const [step, setStep] = useState('upload'); // upload | ocr | details | saving
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [ocrData, setOcrData] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', bereich: 'BAR', documentType: 'Eingangsrechnung',
    status: 'neu', tags: '', notes: '',
    ocrDatum: '', ocrBetrag: '', ocrAbsender: '', ocrRechnungsnummer: '',
    ocrKategorie: '', ocrZahlungsart: '', nasPath: ''
  });

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
    setFileUrl(file_url);
    setUploading(false);
    setForm(prev => ({ ...prev, title: f.name.replace(/\.[^.]+$/, '') }));
    setStep('ocr');
  };

  const runOCR = async () => {
    setOcrLoading(true);
    const res = await base44.functions.invoke('ocrProcessDocument', {
      fileUrl, documentType: form.documentType
    });
    const ocr = res.data?.ocr || {};
    setOcrData(ocr);
    setForm(prev => ({
      ...prev,
      ocrDatum: ocr.datum || '',
      ocrBetrag: ocr.betrag?.toString() || '',
      ocrAbsender: ocr.absender || '',
      ocrRechnungsnummer: ocr.rechnungsnummer || '',
      ocrKategorie: ocr.kategorie || '',
      ocrZahlungsart: ocr.zahlungsart || '',
      title: prev.title || ocr.absender || prev.title,
    }));
    setOcrLoading(false);
    setStep('details');
  };

  const skipOCR = () => setStep('details');

  const handleSave = async () => {
    setStep('saving');
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    await base44.entities.Document.create({
      title: form.title,
      bereich: form.bereich,
      documentType: form.documentType,
      status: form.status,
      nasPath: form.nasPath,
      fileUrl,
      ocrDatum: form.ocrDatum,
      ocrBetrag: form.ocrBetrag ? parseFloat(form.ocrBetrag) : null,
      ocrAbsender: form.ocrAbsender,
      ocrRechnungsnummer: form.ocrRechnungsnummer,
      ocrKategorie: form.ocrKategorie,
      ocrZahlungsart: form.ocrZahlungsart,
      ocrProcessed: !!ocrData,
      tags,
      notes: form.notes,
      isArchived: false,
    });
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-card border border-border rounded-t-3xl p-6 pb-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Dokument hinzufügen</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(BEREICHE).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setForm(p => ({ ...p, bereich: key }))}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    form.bereich === key
                      ? `${val.bg} ${val.border} ${val.color} border`
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {val.label}
                </button>
              ))}
            </div>

            <select
              value={form.documentType}
              onChange={e => setForm(p => ({ ...p, documentType: e.target.value }))}
              className="w-full bg-input border border-border text-foreground text-sm rounded-xl px-3 py-3"
            >
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <label className="block">
              <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-border rounded-2xl bg-secondary/30 cursor-pointer active:bg-secondary/60 transition-all">
                {uploading ? (
                  <Loader2 size={32} className="text-primary animate-spin" />
                ) : (
                  <>
                    <Upload size={32} className="text-muted-foreground" />
                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">Datei hochladen</div>
                      <div className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG</div>
                    </div>
                  </>
                )}
              </div>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        )}

        {/* Step: OCR */}
        {step === 'ocr' && (
          <div className="space-y-6 text-center">
            <div className="p-6 bg-primary/10 rounded-2xl">
              <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
              <div className="text-sm font-medium text-foreground">{file?.name}</div>
              <div className="text-xs text-muted-foreground mt-1">Erfolgreich hochgeladen</div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">OCR-Analyse durchführen?</h3>
              <p className="text-xs text-muted-foreground">Die KI erkennt automatisch Datum, Betrag, Absender und weitere Felder.</p>
            </div>
            <div className="space-y-3">
              {ocrLoading ? (
                <div className="flex items-center justify-center gap-2 text-primary p-4">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm">KI analysiert Dokument...</span>
                </div>
              ) : (
                <>
                  <button
                    onClick={runOCR}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
                  >
                    <Sparkles size={16} />
                    OCR starten
                  </button>
                  <button
                    onClick={skipOCR}
                    className="w-full py-3 text-muted-foreground text-sm hover:text-foreground transition-colors"
                  >
                    Überspringen
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === 'details' && (
          <div className="space-y-4">
            {ocrData && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-400">
                ✓ OCR erfolgreich — Felder wurden automatisch ausgefüllt. Bitte prüfen und ggf. korrigieren.
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground font-medium">Titel *</label>
              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-3"
                placeholder="Dokumenttitel"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Datum</label>
                <input
                  type="date"
                  value={form.ocrDatum}
                  onChange={e => setForm(p => ({ ...p, ocrDatum: e.target.value }))}
                  className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-3"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Betrag (€)</label>
                <input
                  type="number"
                  value={form.ocrBetrag}
                  onChange={e => setForm(p => ({ ...p, ocrBetrag: e.target.value }))}
                  className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-3"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-medium">Absender / Lieferant</label>
              <input
                value={form.ocrAbsender}
                onChange={e => setForm(p => ({ ...p, ocrAbsender: e.target.value }))}
                className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-3"
                placeholder="Name des Absenders"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Rechnungsnr.</label>
                <input
                  value={form.ocrRechnungsnummer}
                  onChange={e => setForm(p => ({ ...p, ocrRechnungsnummer: e.target.value }))}
                  className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-3"
                  placeholder="RE-12345"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Kategorie</label>
                <input
                  value={form.ocrKategorie}
                  onChange={e => setForm(p => ({ ...p, ocrKategorie: e.target.value }))}
                  className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-3"
                  placeholder="z.B. Miete"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-medium">NAS-Pfad</label>
              <input
                value={form.nasPath}
                onChange={e => setForm(p => ({ ...p, nasPath: e.target.value }))}
                className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5 font-mono text-xs"
                placeholder="/NAS/Bar/Rechnungen/2026/"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-medium">Tags (kommagetrennt)</label>
              <input
                value={form.tags}
                onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-3"
                placeholder="steuer, 2026, metro"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={!form.title}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 mt-2"
            >
              Dokument speichern
            </button>
          </div>
        )}

        {step === 'saving' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 size={36} className="text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Wird gespeichert...</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}