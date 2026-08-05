// Organization metadata — literal Tailwind classes so they survive purge.
export const ORG_META = {
  BAR: { short: 'BAR', label: 'Bar', emoji: '🍺', text: 'text-amber-400', chip: 'bg-amber-500/10 border-amber-500/30 text-amber-400', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  SANDRA: { short: 'SANDRA', label: 'Sandras Büro', emoji: '💼', text: 'text-sky-400', chip: 'bg-sky-500/10 border-sky-500/30 text-sky-400', dot: 'bg-sky-500', bar: 'bg-sky-500' },
  PIERRE: { short: 'PIERRE', label: 'Pierre privat', emoji: '👤', text: 'text-violet-400', chip: 'bg-violet-500/10 border-violet-500/30 text-violet-400', dot: 'bg-violet-500', bar: 'bg-violet-500' },
  SANDRA_P: { short: 'SANDRA_P', label: 'Sandra privat', emoji: '👤', text: 'text-indigo-400', chip: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400', dot: 'bg-indigo-500', bar: 'bg-indigo-500' },
  FAMILIE: { short: 'FAMILIE', label: 'Familie', emoji: '🏠', text: 'text-emerald-400', chip: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  EXECUTIVE: { short: 'EXECUTIVE', label: 'Executive', emoji: '👑', text: 'text-yellow-400', chip: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', dot: 'bg-yellow-500', bar: 'bg-yellow-500' },
  IMMO: { short: 'IMMO', label: 'Immobilien', emoji: '🏗️', text: 'text-slate-300', chip: 'bg-slate-500/10 border-slate-500/30 text-slate-300', dot: 'bg-slate-500', bar: 'bg-slate-500' },
};

export function getOrgMeta(shortName) {
  return ORG_META[shortName] || { short: shortName || '?', label: shortName || '—', emoji: '📌', text: 'text-muted-foreground', chip: 'bg-secondary border-border text-muted-foreground', dot: 'bg-muted-foreground', bar: 'bg-muted-foreground' };
}

// Einheitliche Statuswerte (neue Komponenten verwenden NUR diese)
export const ACTIVE_STATUSES = [
  'Eingang', 'Geplant', 'In Bearbeitung', 'Teilweise erledigt',
  'Wartet auf Antwort', 'Delegiert', 'Blockiert', 'Zur Prüfung',
  'Erledigt', 'Nicht mehr notwendig', 'Archiviert',
];

// Status → deutsches Label (Legacy-Werte bleiben abgebildet, werden in neuen Komponenten nicht gesetzt)
export const TASK_STATUS_LABELS = {
  Eingang: 'Eingang', Geplant: 'Geplant', 'In Bearbeitung': 'In Bearbeitung',
  'Teilweise erledigt': 'Teilweise erledigt', 'Wartet auf Antwort': 'Wartet auf Antwort',
  Delegiert: 'Delegiert', Blockiert: 'Blockiert', 'Zur Prüfung': 'Zur Prüfung',
  Erledigt: 'Erledigt', 'Nicht mehr notwendig': 'Nicht mehr notwendig', Archiviert: 'Archiviert',
  offen: 'Offen', in_bearbeitung: 'In Bearbeitung', erledigt: 'Erledigt',
};

// LEGACY — Mix aus Tagesart und Arbeitsweise. Neue Logik verwendet WORK_MODES und DAY_TYPES.
export const DAY_MODES = ['Viel Energie', 'Normal', 'Müde', 'Chaotischer Tag', 'Handwerkstag', 'Barbetrieb', 'Familie', 'Urlaub', 'Nur Dringendes'];

// NEU — Work Modes: Aktuelle Arbeitsweise des Benutzers (orthogonal zu Workspaces)
export const WORK_MODES = ['Fokus', 'Verwaltung', 'Kreativ', 'Handwerklich', 'Unterwegs', 'Besprechung', 'Review'];

// NEU — Day Types: Art des Tages (ersetzt Tagesart-Werte aus DAY_MODES)
export const DAY_TYPES = ['Arbeitstag', 'Urlaub', 'Feiertag', 'Krank', 'Familie', 'Sonderfall'];

// NEU — Workspaces: Dauerhafte Arbeitsbereiche (gesteuert über Navigation + Berechtigungen)
export const WORKSPACES = [
  { key: 'executive', label: 'Executive', icon: 'Crown', description: 'Strategische Übersicht, Kompass, Check-In' },
  { key: 'operations', label: 'Operations', icon: 'Settings', description: 'Bar-Alltag, Personal, Reinigung, Wartung' },
  { key: 'finance', label: 'Finance', icon: 'Wallet', description: 'Buchhaltungsvorbereitung, Steuern, Vermögen' },
  { key: 'projects', label: 'Projects', icon: 'Briefcase', description: 'Vorgänge, Sandra-Integration, Bauzeichnungen' },
  { key: 'documents', label: 'Documents', icon: 'FileText', description: 'Dokumente, Verträge, Ablage' },
  { key: 'goals', label: 'Goals', icon: 'Target', description: 'Ziele, Meilensteine, Strategie' },
  { key: 'knowledge', label: 'Knowledge', icon: 'BookOpen', description: 'Wissen, Notizen, Referenzen' },
];

// Work Types (bestehend — für Task- Eigenschaft, nicht zu verwechseln mit Work Modes)
export const WORK_TYPES = ['Verwaltung', 'Finanzen', 'Kreativ', 'Kommunikation', 'Operativ', 'Handwerklich', 'Familie', 'Persönlich'];

// Hilfsfunktion: Fälligkeitsdatum (neues Feld due_date, Legacy-Fallback dueDate)
export function getDueDate(task) {
  return task.due_date || task.dueDate || null;
}

// Priorität berechnen — nachvollziehbarer Score (neue Feldnamen)
export function calculatePriority(task) {
  let score = 0;
  const due = getDueDate(task);
  if (due) {
    const d = new Date(due);
    const today = new Date(); today.setHours(0,0,0,0);
    const days = Math.ceil((d - today) / 86400000);
    if (days <= 0) score += 100;
    else if (days <= 1) score += 80;
    else if (days <= 3) score += 60;
    else if (days <= 7) score += 40;
    else if (days <= 14) score += 20;
  }
  const mp = task.manual_priority;
  if (mp === 'hoch') score += 50;
  else if (mp === 'mittel') score += 25;
  else if (mp === 'niedrig') score += 5;
  if (task.status === 'Zur Prüfung') score += 30;
  if (task.status === 'Blockiert') score += 20;
  if (task.status === 'Wartet auf Antwort') score += 15;
  return score;
}
