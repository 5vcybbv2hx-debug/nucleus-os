// Zentrale Badge/Label-Maps für die Case Engine

export const STATUS_BADGE = {
  Entwurf: { label: 'Entwurf', cls: 'bg-gray-500/15 text-gray-300 border-gray-500/30' },
  Aktiv: { label: 'Aktiv', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  Wartet: { label: 'Wartet', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  Blockiert: { label: 'Blockiert', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  Abgeschlossen: { label: 'Abgeschlossen', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  Archiviert: { label: 'Archiviert', cls: 'bg-gray-700/15 text-gray-400 border-gray-700/30' },
};

export const PRIORITY_BADGE = {
  hoch: { label: 'Hoch', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  mittel: { label: 'Mittel', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  niedrig: { label: 'Niedrig', cls: 'bg-gray-500/15 text-gray-300 border-gray-500/30' },
};

export const RISK_BADGE = {
  hoch: { label: 'Risiko hoch', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  mittel: { label: 'Risiko mittel', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  niedrig: { label: 'Risiko niedrig', cls: 'bg-gray-500/15 text-gray-300 border-gray-500/30' },
};

export const VISIBILITY_BADGE = {
  Team: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Beteiligte: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'Nur Pierre': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Privat: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  Vertraulich: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export const PARTICIPANT_ROLE_BADGE = {
  owner: { label: 'Owner', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  contributor: { label: 'Mitwirkend', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  observer: { label: 'Beobachter', cls: 'bg-gray-500/15 text-gray-300 border-gray-500/30' },
  approver: { label: 'Prüfer', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
};

export const TIMELINE_ICONS = {
  business_event: '⚡',
  task: '✅',
  decision: '⚖️',
  note: '📝',
  comment: '💬',
  status_change: '🔄',
  document: '📄',
  calendar: '📆',
  idea: '💡',
};

export const ORG_LABELS = {
  BAR: { label: 'BAR', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  PRIVAT_FAMILIE: { label: 'FAMILIE', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  FAMILIE: { label: 'FAMILIE', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  NEBENGEWERBE: { label: 'NEBENGEWERBE', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  EXECUTIVE: { label: 'EXECUTIVE', cls: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  IMMO: { label: 'IMMO', cls: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
};

export const orgBadge = (org) => ORG_LABELS[org] || { label: org || '—', cls: 'bg-secondary text-muted-foreground border-border' };

export const fmtDateTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
};

export const fmtDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return iso; }
};