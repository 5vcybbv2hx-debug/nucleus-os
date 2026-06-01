import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, TrendingUp, TrendingDown, ChevronDown, Sparkles, Loader2, X } from 'lucide-react';
import BereichBadge from '@/components/ui/BereichBadge';
import { BEREICHE, FINANCE_CATEGORIES } from '@/lib/constants';
import { AnimatePresence, motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';

export default function Finance() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBereich, setFilterBereich] = useState('');
  const [activeTab, setActiveTab] = useState('uebersicht'); // uebersicht | eintraege | fixkosten
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [showAi, setShowAi] = useState(false);

  const load = async () => {
    setLoading(true);
    const q = { isArchived: false };
    if (filterBereich) q.bereich = filterBereich;
    const data = await base44.entities.FinanceEntry.filter(q, '-date', 200);
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterBereich]);

  const now = new Date();
  const thisMonth = entries.filter(e => {
    const d = new Date(e.date);
    return d >= startOfMonth(now) && d <= endOfMonth(now);
  });

  const einnahmen = thisMonth.filter(e => e.type === 'einnahme').reduce((s, e) => s + e.amount, 0);
  const ausgaben = thisMonth.filter(e => e.type === 'ausgabe').reduce((s, e) => s + e.amount, 0);
  const fixkosten = entries.filter(e => e.isFixkost && e.type === 'ausgabe').reduce((s, e) => s + e.amount, 0);
  const netto = einnahmen - ausgaben;

  const runAiAnalysis = async () => {
    setAiLoading(true);
    setShowAi(true);
    const res = await base44.functions.invoke('financeAiAnalysis', {
      bereich: filterBereich || 'ALL',
      month: now.getMonth() + 1,
      year: now.getFullYear()
    });
    setAiAnalysis(res.data?.analysis || 'Keine Analyse verfügbar');
    setAiLoading(false);
  };

  return (
    <div className="px-4 pt-14 pb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Finanzen</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{format(now, 'MMMM yyyy', { locale: de })}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> Neu
        </button>
      </div>

      {/* Bereich Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => setFilterBereich('')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${!filterBereich ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground'}`}
        >
          Alle
        </button>
        {Object.entries(BEREICHE).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setFilterBereich(p => p === key ? '' : key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterBereich === key ? `${val.bg} ${val.border} ${val.color} border` : 'border-border text-muted-foreground'}`}
          >
            {val.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-green-400" />
            <span className="text-xs text-muted-foreground">Einnahmen</span>
          </div>
          <div className="text-xl font-semibold text-green-400">
            {einnahmen.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={14} className="text-red-400" />
            <span className="text-xs text-muted-foreground">Ausgaben</span>
          </div>
          <div className="text-xl font-semibold text-red-400">
            {ausgaben.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="text-xs text-muted-foreground mb-2">Netto</div>
          <div className={`text-xl font-semibold ${netto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netto.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="text-xs text-muted-foreground mb-2">Fixkosten</div>
          <div className="text-xl font-semibold text-yellow-400">
            {fixkosten.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
          </div>
        </div>
      </div>

      {/* AI Analysis Button */}
      <button
        onClick={runAiAnalysis}
        className="w-full mb-4 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/20 rounded-xl text-sm font-medium text-primary hover:from-primary/30 hover:to-purple-500/30 transition-all"
      >
        <Sparkles size={16} />
        KI-Finanzanalyse
      </button>

      {/* AI Analysis Result */}
      <AnimatePresence>
        {showAi && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-card border border-primary/20 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-primary" />
                  <span className="text-sm font-semibold text-primary">KI-Analyse</span>
                </div>
                <button onClick={() => setShowAi(false)}>
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>
              {aiLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Analysiere Finanzdaten...</span>
                </div>
              ) : (
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-4">
        {[
          { key: 'eintraege', label: 'Einträge' },
          { key: 'fixkosten', label: 'Fixkosten' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Entries Tab */}
      {activeTab === 'eintraege' && (
        <div className="space-y-2">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />)
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-3xl mb-3">💰</div>
              <div className="text-sm">Noch keine Einträge</div>
            </div>
          ) : (
            entries.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                <div className={`p-2 rounded-lg ${entry.type === 'einnahme' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {entry.type === 'einnahme'
                    ? <TrendingUp size={16} className="text-green-400" />
                    : <TrendingDown size={16} className="text-red-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{entry.description || entry.category || '—'}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <BereichBadge bereich={entry.bereich} small />
                    <span className="text-[10px] text-muted-foreground">
                      {entry.date ? format(new Date(entry.date), 'dd. MMM', { locale: de }) : ''}
                    </span>
                    {entry.isFixkost && <span className="text-[10px] bg-yellow-400/10 text-yellow-400 px-1.5 py-0.5 rounded">Fixkosten</span>}
                  </div>
                </div>
                <div className={`text-sm font-semibold ${entry.type === 'einnahme' ? 'text-green-400' : 'text-red-400'}`}>
                  {entry.type === 'einnahme' ? '+' : '-'}{entry.amount?.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Fixkosten Tab */}
      {activeTab === 'fixkosten' && (
        <FixkostenList entries={entries.filter(e => e.isFixkost)} onAdd={() => setShowAddModal(true)} />
      )}

      {/* Add Entry Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddEntryModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => { load(); setShowAddModal(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function FixkostenList({ entries, onAdd }) {
  const total = entries.reduce((s, e) => s + e.amount, 0);

  if (!entries.length) return (
    <div className="text-center py-12 text-muted-foreground">
      <div className="text-3xl mb-3">📋</div>
      <div className="text-sm mb-3">Keine Fixkosten</div>
      <button onClick={onAdd} className="text-xs text-primary font-medium">+ Fixkosten hinzufügen</button>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl text-sm font-medium text-yellow-400 text-center">
        Gesamt Fixkosten: {total.toLocaleString('de-DE', { minimumFractionDigits: 2 })} € / Monat
      </div>
      {entries.map(e => (
        <div key={e.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
          <div>
            <div className="text-sm font-medium">{e.fixkostName || e.description || e.category}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              <BereichBadge bereich={e.bereich} small /> · {e.fixkostRhythmus}
            </div>
          </div>
          <div className="text-sm font-semibold text-red-400">
            -{e.amount?.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
          </div>
        </div>
      ))}
    </div>
  );
}

function AddEntryModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    bereich: 'BAR', type: 'ausgabe', amount: '', date: format(new Date(), 'yyyy-MM-dd'),
    category: '', description: '', paymentMethod: 'bar', isFixkost: false,
    fixkostRhythmus: 'monatlich', fixkostName: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.FinanceEntry.create({
      ...form,
      amount: parseFloat(form.amount),
      isArchived: false,
    });
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
          <h2 className="text-lg font-semibold">Buchung erfassen</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary"><X size={18} className="text-muted-foreground" /></button>
        </div>

        {/* Type Toggle */}
        <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-4">
          {['einnahme', 'ausgabe'].map(t => (
            <button
              key={t}
              onClick={() => setForm(p => ({ ...p, type: t }))}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all capitalize ${
                form.type === t
                  ? t === 'einnahme' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  : 'text-muted-foreground'
              }`}
            >
              {t === 'einnahme' ? 'Einnahme' : 'Ausgabe'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {/* Bereich */}
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

          <div>
            <label className="text-xs text-muted-foreground font-medium">Betrag (€) *</label>
            <input
              type="number" step="0.01"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              className="w-full mt-1 bg-input border border-border text-foreground text-lg font-semibold rounded-xl px-3 py-3"
              placeholder="0,00"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium">Datum</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Kategorie</label>
              <select
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5"
              >
                <option value="">Wählen...</option>
                {FINANCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium">Beschreibung</label>
            <input
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-3"
              placeholder="z.B. Metro Einkauf"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium">Zahlungsart</label>
            <select
              value={form.paymentMethod}
              onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}
              className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5"
            >
              {['bar', 'ec', 'ueberweisung', 'lastschrift', 'kreditkarte', 'paypal', 'sonstiges'].map(m => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Fixkosten Toggle */}
          <div
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.isFixkost ? 'bg-yellow-400/10 border-yellow-400/30' : 'border-border'}`}
            onClick={() => setForm(p => ({ ...p, isFixkost: !p.isFixkost }))}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.isFixkost ? 'bg-yellow-400 border-yellow-400' : 'border-border'}`}>
              {form.isFixkost && <Check size={12} className="text-black" />}
            </div>
            <span className="text-sm font-medium">Als Fixkosten markieren</span>
          </div>

          {form.isFixkost && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Bezeichnung</label>
                <input
                  value={form.fixkostName}
                  onChange={e => setForm(p => ({ ...p, fixkostName: e.target.value }))}
                  className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5"
                  placeholder="z.B. Miete"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Rhythmus</label>
                <select
                  value={form.fixkostRhythmus}
                  onChange={e => setForm(p => ({ ...p, fixkostRhythmus: e.target.value }))}
                  className="w-full mt-1 bg-input border border-border text-foreground text-sm rounded-xl px-3 py-2.5"
                >
                  <option value="monatlich">Monatlich</option>
                  <option value="jaehrlich">Jährlich</option>
                  <option value="variabel">Variabel</option>
                </select>
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!form.amount || saving}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Wird gespeichert...' : 'Buchung speichern'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Check({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}