import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Car, Plus, ChevronRight, AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { BEREICHE } from '@/lib/constants';
import BereichBadge from '@/components/ui/BereichBadge';
import VehicleModal from '@/components/vehicles/VehicleModal';

function urgencyColor(dateStr) {
  if (!dateStr) return null;
  const days = differenceInDays(parseISO(dateStr), new Date());
  if (days < 0) return 'text-red-400';
  if (days <= 30) return 'text-orange-400';
  if (days <= 90) return 'text-yellow-400';
  return 'text-green-400';
}

function urgencyBg(dateStr) {
  if (!dateStr) return '';
  const days = differenceInDays(parseISO(dateStr), new Date());
  if (days < 0) return 'bg-red-500/10 border-red-500/20';
  if (days <= 30) return 'bg-orange-500/10 border-orange-500/20';
  if (days <= 90) return 'bg-yellow-500/10 border-yellow-500/20';
  return '';
}

function DaysLabel({ dateStr, label }) {
  if (!dateStr) return null;
  const days = differenceInDays(parseISO(dateStr), new Date());
  const color = urgencyColor(dateStr);
  return (
    <div className={`text-xs ${color}`}>
      {label}: {days < 0 ? `${Math.abs(days)}T überfällig` : `in ${days}T`}
      <span className="text-muted-foreground ml-1">({format(parseISO(dateStr), 'dd.MM.yy')})</span>
    </div>
  );
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [filterBereich, setFilterBereich] = useState('ALL');

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Vehicle.list();
    setVehicles(data.filter(v => !v.isArchived));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = filterBereich === 'ALL' ? vehicles : vehicles.filter(v => v.bereich === filterBereich);

  // Upcoming alerts (next 30 days)
  const alerts = vehicles.flatMap(v => {
    const items = [];
    if (v.huDatum && differenceInDays(parseISO(v.huDatum), new Date()) <= 30) items.push({ vehicle: v.name, label: 'HU/TÜV', date: v.huDatum });
    if (v.versicherungAblauf && differenceInDays(parseISO(v.versicherungAblauf), new Date()) <= 30) items.push({ vehicle: v.name, label: 'Versicherung', date: v.versicherungAblauf });
    if (v.naechsteWartung && differenceInDays(parseISO(v.naechsteWartung), new Date()) <= 30) items.push({ vehicle: v.name, label: 'Wartung', date: v.naechsteWartung });
    return items;
  });

  return (
    <div className="px-4 pt-14 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Fahrzeuge</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{vehicles.length} Fahrzeuge</p>
        </div>
        <button
          onClick={() => { setEditVehicle(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
        >
          <Plus size={16} /> Neu
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 mb-2">
            <AlertTriangle size={13} /> {alerts.length} Frist{alerts.length > 1 ? 'en' : ''} in 30 Tagen
          </div>
          {alerts.map((a, i) => (
            <div key={i} className="text-xs text-foreground/80">
              <span className="font-medium">{a.vehicle}</span> — {a.label}: {format(parseISO(a.date), 'dd.MM.yyyy')}
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
        <button onClick={() => setFilterBereich('ALL')} className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${filterBereich === 'ALL' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>Alle</button>
        {Object.entries(BEREICHE).map(([k, v]) => (
          <button key={k} onClick={() => setFilterBereich(k)} className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${filterBereich === k ? `${v.bg} ${v.color} border ${v.border}` : 'bg-secondary text-muted-foreground'}`}>{v.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Car size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Noch keine Fahrzeuge</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => (
            <button
              key={v.id}
              onClick={() => { setEditVehicle(v); setShowModal(true); }}
              className={`w-full text-left p-4 bg-card border rounded-2xl transition-all active:scale-[0.98] ${urgencyBg(v.huDatum) || urgencyBg(v.versicherungAblauf) || 'border-border'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold">{v.name}</div>
                  {v.kennzeichen && <div className="text-xs text-muted-foreground font-mono mt-0.5">{v.kennzeichen}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <BereichBadge bereich={v.bereich} small />
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-0.5">
                <DaysLabel dateStr={v.huDatum} label="HU/TÜV" />
                <DaysLabel dateStr={v.versicherungAblauf} label="Versicherung" />
                <DaysLabel dateStr={v.naechsteWartung} label="Wartung" />
              </div>
              {v.kilometerstand && (
                <div className="text-xs text-muted-foreground mt-1.5">{v.kilometerstand.toLocaleString('de-DE')} km</div>
              )}
            </button>
          ))}
        </div>
      )}

      {showModal && (
        <VehicleModal
          vehicle={editVehicle}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}