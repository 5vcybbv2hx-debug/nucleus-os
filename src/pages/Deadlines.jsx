import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, X, Check, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import BereichBadge from '@/components/ui/BereichBadge';
import { BEREICHE, DEADLINE_CATEGORIES, PRIORITY_CONFIG, STATUS_CONFIG } from '@/lib/constants';
import { AnimatePresence, motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { PriorityBadge, TaskStatusBadge } from '@/components/ui/StatusBadge';

export default function Deadlines() {
  const [items, setItems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fristen');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('deadline'); // deadline | task
  const [filterStatus, setFilterStatus] = useState('offen');

  const load = async () => {
    setLoading(true);
    const [dls, tsks] = await Promise.all([
      base44.entities.Deadline.filter({ isArchived: false }, 'dueDate', 100),
      base44.entities.Task.filter({ isArchived: false }, '-created_date', 100),
    ]);
    setItems(dls);
    setTasks(tsks);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (item, newStatus, isTask) => {
    const entity = isTask ? base44.entities.Task : base44.entities.Deadline;
    await entity.update(item.id, { status: newStatus });
    load();
  };

  const filteredItems = items.filter(i => !filterStatus || i.status === filterStatus);
  const filteredTasks = tasks.filter(t => !filterStatus || t.status === filterStatus);

  return (
    <div className="px-4 pt-14 pb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Fristen & Aufgaben</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredItems.length} Fristen · {filteredTasks.length} Aufgaben
          </p>
        </div>
        <button
          onClick={() => { setModalType(activeTab === 'fristen' ? 'deadline' : 'task'); setShowModal(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          <Plus size={16} /> Neu
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-4">
        {[{ key: 'fristen', label: 'Fristen' }, { key: 'aufgaben', label: 'Aufgaben' }].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            {tab.label}
            {tab.key === 'fristen' && items.filter(i => i.status === 'offen').length > 0 && (
              <span className="ml-1.5 bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full">
                {items.filter(i => i.status === 'offen').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {[
          { key: '', label: 'Alle' },
          { key: 'offen', label: 'Offen' },
          { key: 'in_bearbeitung', label: 'In Bearb.' },
          { key: 'erledigt', label: 'Erledigt' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filterStatus === s.key
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'border-border text-muted-foreground'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-card border border-border rounded-2xl animate-pulse" />)}</div>
      ) : (
        <>
          {activeTab === 'fristen' && (
            <div className="space-y-2">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-3xl mb-3">📅</div>
                  <div className="text-sm">Keine Fristen vorhanden</div>
                </div>
              ) : filteredItems.map(dl => (
                <DeadlineCard key={dl.id} item={dl} onStatusChange={(id, s) => handleStatusChange(dl, s, false)} onReload={load} />
              ))}
            </div>
          )}
          {activeTab === 'aufgaben' && (
            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-3xl mb-3">✅</div>
                  <div className="text-sm">Keine Aufgaben vorhanden</div>
                </div>
              ) : filteredTasks.map(t => (
                <TaskCard key={t.id} task={t} onStatusChange={(id, s) => handleStatusChange(t, s, true)} onReload={load} />
              ))}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showModal && (
          <AddItemModal
            type={modalType}
            onClose={() => setShowModal(false)}
            onSuccess={() => { load(); setShowModal(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DeadlineCard({ item, onStatusChange, onReload }) {
  const daysLeft = differenceInDays(new Date(item.dueDate), new Date());
  const cat = DEADLINE_CATEGORIES[item.category] || { label: item.category, icon: '📌' };
  const isOverdue = daysLeft < 0 && item.status !== 'erledigt';
  const isUrgent = daysLeft <= 7 && daysLeft >= 0;

  return (
    <div className={`p-4 bg-card border rounded-2xl transition-all ${isOverdue ? 'border-red-500/30' : isUrgent ? 'border-orange-500/30' : 'border-border'}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0 mt-0.5">{cat.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium truncate">{item.title}</div>
            <PriorityBadge priority={item.priority} />
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <BereichBadge bereich={item.bereich} small />
            <span className="text-[10px] text-muted-foreground">{cat.label}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isOverdue ? 'bg-red-500/15 text-red-400' :
              isUrgent ? 'bg-orange-500/15 text-orange-400' :
              'bg-secondary text-muted-foreground'
            }`}>
              {isOverdue ? `${Math.abs(daysLeft)}d überfällig` : `${daysLeft}d`}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Fällig: {format(new Date(item.dueDate), 'dd. MMMM yyyy', { locale: de })}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {item.status !== 'erledigt' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          {item.status === 'offen' && (
            <button
              onClick={() => onStatusChange(item.id, 'in_bearbeitung')}
              className="flex-1 py-2 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-colors"
            >
              In Bearbeitung
            </button>
          )}
          <button
            onClick={() => onStatusChange(item.id, 'erledigt')}
            className="flex-1 py-2 text-xs font-medium bg-green-500/10 text-green-400 rounded-xl hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1"
          >
            <CheckCircle2 size={12} /> Erledigt
          </button>
        </div>
      )}
      {item.status === 'erledigt' && (
        <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
          <CheckCircle2 size={12} /> Erledigt
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onStatusChange }) {
  return (
    <div className="p-4 bg-card border border-border rounded-2xl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{task.title}</div>
          {task.description && <div className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</div>}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <BereichBadge bereich={task.bereich} small />
            <PriorityBadge priority={task.priority} />
            {task.dueDate && (
              <span className="text-[10px] text-muted-foreground">
                bis {format(new Date(task.dueDate), 'dd. MMM', { locale: de })}
              </span>
            )}
          </div>
        </div>
        <TaskStatusBadge status={task.status} />
      </div>
      {task.status !== 'erledigt' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <button
            onClick={() => onStatusChange(task.id, 'erledigt')}
            className="flex-1 py-2 text-xs font-medium bg-green-500/10 text-green-400 rounded-xl hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1"
          >
            <CheckCircle2 size={12} /> Erledigt
          </button>
        </div>
      )}
    </div>
  );
}

function AddItemModal({ type, onClose, onSuccess }) {
  const isDeadline = type === 'deadline';
  const [form, setForm] = useState({
    title: '', bereich: 'BAR',
    category: isDeadline ? 'sonstiges' : undefined,
    dueDate: '', reminderDate: '', priority: 'mittel',
    notes: '', description: '', assignedTo: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    if (isDeadline) {
      await base44.entities.Deadline.create({ ...form, status: 'offen', isArchived: false });
    } else {
      await base44.entities.Task.create({ ...form, status: 'offen', isArchived: false });
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-lg bg-card border border-border rounded-t-3xl p-6 pb-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{isDeadline ? 'Frist hinzufügen' : 'Aufgabe hinzufügen'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary"><X size={18} className="text-muted-foreground" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground font-medium">Titel *</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-3"
              placeholder={isDeadline ? 'z.B. KFZ-Versicherung verlängern' : 'z.B. Lohnabrechnung prüfen'}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {Object.entries(BEREICHE).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setForm(p => ({ ...p, bereich: key }))}
                className={`py-2 rounded-xl text-xs font-medium border transition-all ${form.bereich === key ? `${val.bg} ${val.border} ${val.color} border` : 'border-border text-muted-foreground'}`}
              >
                {val.label}
              </button>
            ))}
          </div>

          {isDeadline && (
            <div>
              <label className="text-xs text-muted-foreground font-medium">Kategorie</label>
              <select
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5"
              >
                {Object.entries(DEADLINE_CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium">Fälligkeitsdatum *</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Erinnerung</label>
              <input
                type="date"
                value={form.reminderDate}
                onChange={e => setForm(p => ({ ...p, reminderDate: e.target.value }))}
                className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium">Priorität</label>
            <div className="flex gap-2 mt-1">
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setForm(p => ({ ...p, priority: k }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${form.priority === k ? `${v.bg} border-current ${v.color}` : 'border-border text-muted-foreground'}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium">Notizen</label>
            <textarea
              value={form.notes || form.description}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value, description: e.target.value }))}
              rows={2}
              className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5 resize-none"
              placeholder="Optionale Notizen..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!form.title || !form.dueDate || saving}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Wird gespeichert...' : isDeadline ? 'Frist speichern' : 'Aufgabe speichern'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}