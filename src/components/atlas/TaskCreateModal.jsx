import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2 } from 'lucide-react';
import { getOrgMeta, WORK_TYPES } from '@/lib/organizations';

const STATUSES = ['Eingang', 'Geplant', 'In Bearbeitung'];
const VISIBILITIES = ['Team', 'Beteiligte', 'Nur Pierre', 'Privat', 'Vertraulich Finanzen', 'Notfallzugriff'];
const SOURCES = ['manuell', 'eingang', 'idee', 'routine', 'delegiert'];

export default function TaskCreateModal({ onClose }) {
  const [form, setForm] = useState({ title: '', description: '', organization: '', status: 'Eingang', manual_priority: 'mittel', work_type: '', visibility: 'Team', source_type: 'manuell', dueDate: '', energy_required: 'mittel' });
  const [orgs, setOrgs] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Organization.list().then(list => {
      setOrgs(list.filter(o => o.status === 'aktiv').sort((a,b)=>(a.display_order||0)-(b.display_order||0)));
    });
  }, []);

  const handleSave = async () => {
    if (!form.title || !form.organization) return;
    setSaving(true);
    await base44.entities.Task.create({ ...form });
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
            {orgs.map(o => {
              const m = getOrgMeta(o.short_name);
              return (
                <button key={o.id} onClick={()=>setForm(p=>({...p,organization:o.short_name}))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    form.organization === o.short_name ? `${m.chip} border-current` : 'border-border text-muted-foreground hover:bg-secondary'
                  }`}>
                  <span>{m.emoji}</span> {m.short}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium">Beschreibung</label>
          <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}
            className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5 h-20 resize-none" placeholder="Optional…" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-medium">Fällig am</label>
            <input type="date" value={form.dueDate} onChange={e=>setForm(p=>({...p,dueDate:e.target.value}))}
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