import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { BEREICHE } from '@/lib/constants';

const TYPEN = ['PKW', 'LKW', 'Transporter', 'Motorrad', 'Anhänger', 'Sonstiges'];
const KRAFTSTOFFE = ['Benzin', 'Diesel', 'Elektro', 'Hybrid', 'Gas', 'Sonstiges'];

export default function VehicleModal({ vehicle, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: vehicle?.name || '',
    kennzeichen: vehicle?.kennzeichen || '',
    bereich: vehicle?.bereich || 'BAR',
    typ: vehicle?.typ || 'PKW',
    marke: vehicle?.marke || '',
    modell: vehicle?.modell || '',
    baujahr: vehicle?.baujahr || '',
    kilometerstand: vehicle?.kilometerstand || '',
    huDatum: vehicle?.huDatum || '',
    auDatum: vehicle?.auDatum || '',
    versicherungAblauf: vehicle?.versicherungAblauf || '',
    versicherungGesellschaft: vehicle?.versicherungGesellschaft || '',
    naechsteWartung: vehicle?.naechsteWartung || '',
    naechsteWartungKm: vehicle?.naechsteWartungKm || '',
    kraftstoff: vehicle?.kraftstoff || 'Diesel',
    notes: vehicle?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const f = (field) => ({ value: form[field], onChange: e => setForm(p => ({ ...p, [field]: e.target.value })) });
  const inputCls = 'w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5';

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      baujahr: form.baujahr ? parseInt(form.baujahr) : null,
      kilometerstand: form.kilometerstand ? parseFloat(form.kilometerstand) : null,
      naechsteWartungKm: form.naechsteWartungKm ? parseFloat(form.naechsteWartungKm) : null,
    };
    if (vehicle) {
      await base44.entities.Vehicle.update(vehicle.id, data);
    } else {
      await base44.entities.Vehicle.create(data);
    }
    setSaving(false);
    onSuccess();
  };

  const handleDelete = async () => {
    if (!vehicle) return;
    setDeleting(true);
    await base44.entities.Vehicle.update(vehicle.id, { isArchived: true });
    setDeleting(false);
    onSuccess();
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
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold">{vehicle ? 'Fahrzeug bearbeiten' : 'Neues Fahrzeug'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground font-medium">Bezeichnung *</label>
            <input {...f('name')} className={inputCls} placeholder="z.B. VW Transporter Bar" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium">Kennzeichen</label>
              <input {...f('kennzeichen')} className={inputCls} placeholder="MU-XX 123" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Bereich</label>
              <select {...f('bereich')} className={inputCls}>
                {Object.entries(BEREICHE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium">Typ</label>
              <select {...f('typ')} className={inputCls}>
                {TYPEN.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Kraftstoff</label>
              <select {...f('kraftstoff')} className={inputCls}>
                {KRAFTSTOFFE.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium">Marke</label>
              <input {...f('marke')} className={inputCls} placeholder="VW" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Modell</label>
              <input {...f('modell')} className={inputCls} placeholder="Transporter T6" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium">Baujahr</label>
              <input type="number" {...f('baujahr')} className={inputCls} placeholder="2020" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Kilometerstand</label>
              <input type="number" {...f('kilometerstand')} className={inputCls} placeholder="85000" />
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">Fristen & Termine</div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">HU/TÜV fällig</label>
                  <input type="date" {...f('huDatum')} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">AU fällig</label>
                  <input type="date" {...f('auDatum')} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Versicherung läuft ab</label>
                  <input type="date" {...f('versicherungAblauf')} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Versicherung Gesellschaft</label>
                  <input {...f('versicherungGesellschaft')} className={inputCls} placeholder="ADAC" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Nächste Wartung</label>
                  <input type="date" {...f('naechsteWartung')} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Wartung bei km</label>
                  <input type="number" {...f('naechsteWartungKm')} className={inputCls} placeholder="90000" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium">Notizen</label>
            <textarea {...f('notes')} className={`${inputCls} h-16 resize-none`} placeholder="Weitere Infos..." />
          </div>

          <button onClick={handleSave} disabled={saving || !form.name} className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-50 mt-2">
            {saving ? 'Wird gespeichert...' : vehicle ? 'Änderungen speichern' : 'Fahrzeug anlegen'}
          </button>

          {vehicle && (
            <button onClick={handleDelete} disabled={deleting} className="w-full py-2.5 border border-destructive/30 text-destructive rounded-xl text-sm font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <Trash2 size={14} /> {deleting ? 'Wird gelöscht...' : 'Fahrzeug archivieren'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}