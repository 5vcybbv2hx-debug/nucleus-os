import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2 } from 'lucide-react';
import { getOrgMeta, WORK_TYPES } from '@/lib/organizations';
import { usePermissions } from '@/lib/usePermissions';
import { logAudit } from '@/lib/audit';

const VISIBILITIES = ['Team', 'Beteiligte', 'Nur Pierre', 'Privat', 'Vertraulich Finanzen', 'Notfallzugriff'];

export default function TaskCreateModal({ onClose }) {
  const perms = usePermissions();
  const [form, setForm] = useState({ title: '', description: '', organization: '', status: 'Eingang', manual_priority: 'mittel', work_type: '', visibility: 'Team', source_type: 'manuell', due_date: '', energy_required: 'mittel' });
  const [saving, setSaving] = useState(false);

  // Organization-Dropdown: nur aktive + per canView sichtbare
  const orgs = perms.activeOrgs.filter(o => perms.canView('aufgaben', o));

  const handleSave = async () => {
    if (!form.title || !form.organization) return;
    setSaving(true);
    const me = perms.user;
    const payload = { ...form, creator: me?.id };
    const created = await base44.entities.Task.create(payload);
    await logAudit({ action: 'create', entityType: 'Task', entityId: created.id, newValue: payload });
    setSaving(false);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-t-3xl p-6 pb-28 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Aufgabe erstellen</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">Titel *</label>
          <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} autoFocus
            className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5" placeholder="Was ist zu tun?" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">Bereich *</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {orgs.map(short => {
              const m = getOrgMeta(short);
              return (
                <button key={short} onClick={()=>setForm(p=>({...p,organization:short}))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    form.organization === short ? `${m.chip} border-current` : 'border-border text-muted-foreground hover:bg-secondary'
                  }`}>
                  <span>{m.emoji}</span> {m.short}
                </button>
              );
            })}
          </div>
          {orgs.length === 0 && <p className="text-xs text-muted-foreground mt-1">Keine sichtbaren Bereiche.</p>}
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">Beschreibung</label>
          <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}
            className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5 h-20 resize-none" placeholder="Optional…" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-medium">Fällig am</label>
            <input type="date" value={form.due_date} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}
              className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium">Priorität</label>
            <select value={form.manual_priority} onChange={e=>setForm(p=>({...p,manual_priority:e.target.value}))}
              className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5">
              <option value="hoch">hoch</option>
              <option value="mittel">mittel</option>
              <option value="niedrig">niedrig</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-medium">Aufgabentyp</label>
            <select value={form.work_type} onChange={e=>setForm(p=>({...p,work_type:e.target.value}))}
              className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5">
              <option value="">— wählen —</option>
              {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium">Sichtbarkeit</label>
            <select value={form.visibility} onChange={e=>setForm(p=>({...p,visibility:e.target.value}))}
              className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5">
              {VISIBILITIES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving || !form.title || !form.organization}
          className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Wird gespeichert…</> : 'Aufgabe erstellen'}
        </button>
      </div>
    </div>
  );
}