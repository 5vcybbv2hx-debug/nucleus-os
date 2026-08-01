import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Check, SkipForward } from 'lucide-react';
import { WORK_TYPES } from '@/lib/organizations';

const DURATIONS = [5, 15, 30, 60];
const NEXT_OPTIONS = ['Beim Thema bleiben', 'Verwaltung', 'Kreativ', 'Handwerklich', 'Kurze Aufgabe', 'Etwas anderes', 'Für heute genug'];

export default function TaskCompleteModal({ task, onClose, onSuggest }) {
  const [step, setStep] = useState(0); // 0 = duration, 1 = next, 2 = done
  const [saving, setSaving] = useState(false);

  const finish = async (duration, nextMode) => {
    setSaving(true);
    const update = {
      status: 'Erledigt',
      completed_at: new Date().toISOString(),
    };
    if (duration != null) update.actual_duration = duration;
    await base44.entities.Task.update(task.id, update);
    setSaving(false);
    onSuggest?.(nextMode);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-t-3xl p-6 pb-28 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Aufgabe erledigt</h2>
          <button onClick={() => finish(null, null)} disabled={saving} className="p-2 rounded-xl hover:bg-secondary">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{task.title}</p>

        {step === 0 && (
          <>
            <p className="text-sm font-medium">Wie lange ungefähr?</p>
            <div className="grid grid-cols-4 gap-2">
              {DURATIONS.map(d => (
                <button key={d} onClick={() => { setStep(1); window.__atlasDur = d; }}
                  className="py-3 rounded-xl border border-border text-sm hover:bg-secondary transition-colors">{d} Min</button>
              ))}
            </div>
            <button onClick={() => { setStep(1); window.__atlasDur = null; }}
              className="w-full py-3 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">
              länger
            </button>
            <button onClick={() => finish(null, null)} disabled={saving}
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
              <SkipForward size={15} /> überspringen & speichern
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-sm font-medium">Wie möchtest du weitermachen?</p>
            <div className="space-y-2">
              {NEXT_OPTIONS.map(opt => (
                <button key={opt} onClick={() => finish(window.__atlasDur, opt)} disabled={saving}
                  className="w-full py-3 px-4 rounded-xl border border-border text-sm hover:bg-secondary transition-colors text-left flex items-center justify-between">
                  {opt} <Check size={15} className="text-muted-foreground" />
                </button>
              ))}
            </div>
            <button onClick={() => finish(window.__atlasDur, null)} disabled={saving}
              className="w-full py-3 text-sm text-muted-foreground hover:text-foreground">
              einfach speichern
            </button>
          </>
        )}

        {saving && <p className="text-xs text-muted-foreground text-center">Wird gespeichert…</p>}
      </div>
    </div>
  );
}