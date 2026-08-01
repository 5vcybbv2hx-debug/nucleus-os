import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, Mic, Sparkles } from 'lucide-react';
import { getOrgMeta } from '@/lib/organizations';

export default function IdeaCaptureModal({ onClose, onSuccess }) {
  const [text, setText] = useState('');
  const [organization, setOrganization] = useState('');
  const [orgs, setOrgs] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Organization.list().then(list => {
      setOrgs(list.filter(o => o.status === 'aktiv').sort((a,b) => (a.display_order||0)-(b.display_order||0)));
    });
  }, []);

  const handleSave = async () => {
    if (!text.trim() || !organization) return;
    setSaving(true);
    const title = text.trim().split('\n')[0].slice(0, 80);
    await base44.entities.Idea.create({
      title,
      raw_input: text.trim(),
      summary: text.trim().slice(0, 200),
      organization,
      input_method: 'text',
      status: 'Neu',
    });
    setSaving(false);
    onSuccess?.();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-t-3xl p-6 pb-28 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Idee erfassen</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">Deine Idee</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
            placeholder="Was immer dir kommt — einfach festhalten…"
            className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-3 h-28 resize-none"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">Bereich</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {orgs.map(o => {
              const m = getOrgMeta(o.short_name);
              return (
                <button key={o.id} onClick={() => setOrganization(o.short_name)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    organization === o.short_name ? `${m.chip} border-current` : 'border-border text-muted-foreground hover:bg-secondary'
                  }`}>
                  <span>{m.emoji}</span> {m.short}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
          <Mic size={14} /> Spracheingabe vorbereitet (folgt)
        </div>

        <div className="flex items-center gap-2 p-2.5 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
          <Sparkles size={14} /> Foto / Link (folgt)
        </div>

        <button onClick={handleSave} disabled={saving || !text.trim() || !organization}
          className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Wird gespeichert…</> : 'Idee festhalten'}
        </button>
      </div>
    </div>
  );
}