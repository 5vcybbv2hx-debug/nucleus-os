import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, Smile, Frown, Meh } from 'lucide-react';
import { logAudit } from '@/lib/audit';

const MOODS = [
  { key: 'gut', label: 'Gut', icon: Smile, color: 'text-emerald-400' },
  { key: 'ok', label: 'Ok', icon: Meh, color: 'text-amber-400' },
  { key: 'schwer', label: 'Schwer', icon: Frown, color: 'text-red-400' },
];

export default function DailyReflectionModal({ onClose }) {
  const [mood, setMood] = useState('');
  const [wentWell, setWentWell] = useState('');
  const [difficult, setDifficult] = useState('');
  const [learned, setLearned] = useState('');
  const [tomorrow, setTomorrow] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!mood) return;
    setSaving(true);
    const me = await base44.auth.me();
    const payload = {
      user: me?.id,
      reflection_date: new Date().toISOString().slice(0, 10),
      mood,
      what_went_well: wentWell.trim() || null,
      what_was_difficult: difficult.trim() || null,
      what_was_learned: learned.trim() || null,
      change_for_tomorrow: tomorrow.trim() || null,
      private: true,
    };
    const created = await base44.entities.DailyReflection.create(payload);
    // AuditLog ohne Reflexionstexte (Privacy)
    await logAudit({ action: 'create', entityType: 'DailyReflection', entityId: created.id, newValue: { mood, reflection_date: payload.reflection_date } });
    setSaving(false);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-t-3xl p-6 pb-28 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Tagesreflexion</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">Wie war dein Tag?</label>
          <div className="mt-1 flex gap-2">
            {MOODS.map(m => {
              const Icon = m.icon;
              return (
                <button key={m.key} onClick={() => setMood(m.key)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                    mood === m.key ? `border-current ${m.color} bg-secondary` : 'border-border text-muted-foreground hover:bg-secondary'
                  }`}>
                  <Icon size={22} />
                  <span className="text-xs">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">Was lief gut?</label>
          <textarea value={wentWell} onChange={e=>setWentWell(e.target.value)}
            className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5 h-20 resize-none" placeholder="Positive Momente, Erfolge…" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">Was war schwierig?</label>
          <textarea value={difficult} onChange={e=>setDifficult(e.target.value)}
            className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5 h-20 resize-none" placeholder="Hürden, Blockaden…" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">Was hast du gelernt?</label>
          <textarea value={learned} onChange={e=>setLearned(e.target.value)}
            className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5 h-20 resize-none" placeholder="Erkenntnisse, Takeaways…" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">Was ändert sich morgen?</label>
          <textarea value={tomorrow} onChange={e=>setTomorrow(e.target.value)}
            className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5 h-20 resize-none" placeholder="Eine konkrete Änderung…" />
        </div>

        <button onClick={handleSave} disabled={saving || !mood}
          className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Wird gespeichert…</> : 'Reflexion speichern'}
        </button>
      </div>
    </div>
  );
}
