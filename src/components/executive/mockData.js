// ============================================================
// Paket 4A — Executive Workspace Mock Data
// Alle Daten sind Mock. Keine API-Calls.
// Später durch echte Entitäten ersetzt.
// ============================================================

// --- Unternehmensstatus ---
export const COMPANY_STATUS = {
  level: 'stable', // stable | attention | critical
  label: 'Unternehmen stabil',
  sublabel: 'Alle Systeme laufen. Keine dringenden Eskalationen.',
};

// --- Work Modes ---
export const WORK_MODES = [
  { key: 'executive', label: 'Executive', description: 'Fokus, Entscheidungen, Strategie' },
  { key: 'operations', label: 'Operations', description: 'Bar, Team, Tagesgeschäft' },
  { key: 'finance', label: 'Finance', description: 'Zahlen, Steuern, Vermögen' },
  { key: 'project', label: 'Project', description: 'Vorgänge, Bauzeichnungen, Sandra' },
];

// --- Top 3 für heute ---
export const TOP_THREE = [
  {
    id: 't1',
    title: 'Steuervorbereitung August 2026',
    duration: '45 min',
    reason: 'Frist endet in 10 Tagen — Unterlagen müssen vorbereitet werden',
    source: 'Finanzen',
    priority: 'hoch',
    icon: 'wallet',
  },
  {
    id: 't2',
    title: 'Bar-Team koordinieren — Wochenende',
    duration: '20 min',
    reason: '3 Schichten noch unbesetzt für Sa/So',
    source: 'SAVO Bar',
    priority: 'hoch',
    icon: 'users',
  },
  {
    id: 't3',
    title: 'Angebot Baugesuch Müller finalisieren',
    duration: '60 min',
    reason: 'Sandra wartet auf Freigabe seit Dienstag',
    source: 'Sandra Büro',
    priority: 'mittel',
    icon: 'file',
  },
];

// --- Business Events (max 5) ---
export const BUSINESS_EVENTS = [
  {
    id: 'e1',
    icon: 'alert',
    category: 'Personal',
    source: 'SAVO',
    title: 'Schicht unbesetzt — Samstagabend',
    time: 'vor 2 Std',
    severity: 'warning',
  },
  {
    id: 'e2',
    icon: 'check',
    category: 'Bar',
    source: 'SAVO',
    title: 'Wartung Zapfanlage abgeschlossen',
    time: 'vor 4 Std',
    severity: 'info',
  },
  {
    id: 'e3',
    icon: 'calendar',
    category: 'Finanzen',
    source: 'Atlas',
    title: 'USt-Voranmeldung fällig in 10 Tagen',
    time: 'vor 6 Std',
    severity: 'warning',
  },
  {
    id: 'e4',
    icon: 'bell',
    category: 'Sandra',
    source: 'Büro',
    title: 'Angebot Müller wartet auf Freigabe',
    time: 'vor 1 Tag',
    severity: 'info',
  },
  {
    id: 'e5',
    icon: 'bell',
    category: 'Executive',
    source: 'Atlas',
    title: 'Vorgang "Immobilienstrategie 2026" aktualisiert',
    time: 'vor 2 Tagen',
    severity: 'info',
  },
];

// --- Entscheidungen ---
export const DECISIONS = [
  {
    id: 'd1',
    title: 'Zapfanlage Wartung: Sofort oder nach Saison?',
    context: 'Wartungstechniker bietet Termin nächste Woche oder Oktober an',
    options: ['Jetzt (€800, 2 Tage Ausfall)', 'Nach Saison (€850, Risiko повышен)'],
    urgency: ' Diese Woche',
  },
  {
    id: 'd2',
    title: 'Neue Getränkekarte: Herbst-Auflage starten?',
    context: 'Design-Entwurf liegt vor, Druckkosten €450',
    options: ['Ja, September starten', 'Auf Oktober verschieben'],
    urgency: 'Bis Ende August',
  },
  {
    id: 'd3',
    title: 'Sandra: Projektphase Baugesuch freigeben?',
    context: 'Zeichnungen vollständig, Stundenaufwand 18h',
    options: ['Freigeben', 'Rückfrage stellen'],
    urgency: 'Bis Freitag',
  },
];

// --- Team Status ---
export const TEAM_STATUS = [
  {
    id: 'pierre',
    name: 'Pierre',
    role: 'Geschäftsführung',
    status: 'arbeitet', // arbeitet | wartet | braucht_entscheidung | bereit | offline
    detail: 'Executive Workspace',
    avatar: 'P',
  },
  {
    id: 'johanna',
    name: 'Johanna',
    role: 'Buchhaltungsvorbereitung',
    status: 'arbeitet',
    detail: 'Eingang bearbeitet',
    avatar: 'J',
  },
  {
    id: 'bettina',
    name: 'Bettina',
    role: 'Bar — Management',
    status: 'wartet',
    detail: 'Wartet auf Schichtplan',
    avatar: 'B',
  },
  {
    id: 'sandra',
    name: 'Sandra',
    role: 'Büro — Bautechnik',
    status: 'braucht_entscheidung',
    detail: 'Angebot Müller — Freigabe',
    avatar: 'S',
  },
];

// --- Kompass ---
export const KOMPASS = {
  status: {
    level: 'stable',
    label: 'Unternehmen stabil',
    trend: 'positive',
    trendLabel: 'Positive Entwicklung diese Woche',
  },
  focus: [
    'Bar-Team für Wochenende koordinieren',
    'Steuervorbereitung August starten',
    'Angebot Müller freigeben',
  ],
  development: 'Alle Bereiche im Plan. Bar-Umsatz +12% vs. Vorwoche. Büro ausgelastet. Keine kritischen Blockaden.',
};

// --- Executive Check-In ---
export const CHECKIN_QUESTIONS = [
  {
    id: 'q1',
    question: 'Was ist heute die eine Sache, die den größten Unterschied macht?',
    type: 'text',
    placeholder: 'z.B. Steuervorbereitung abschließen...',
  },
  {
    id: 'q2',
    question: 'Gibt es etwas, das dich heute blockiert oder ablenkt?',
    type: 'text',
    placeholder: 'z.B. zu viele gleichzeitige Anfragen...',
  },
  {
    id: 'q3',
    question: 'Wie fühlst du dich heute energiemäßig?',
    type: 'energy',
    options: ['Niedrig', 'Mittel', 'Hoch'],
  },
  {
    id: 'q4',
    question: 'Was kannst du heute delegieren?',
    type: 'text',
    placeholder: 'z.B. Schichtplan an Bettina...',
  },
];

// --- Quick Actions ---
export const QUICK_ACTIONS = [
  { key: 'idea', label: 'Neue Idee', icon: 'lightbulb' },
  { key: 'decision', label: 'Entscheidung', icon: 'scale' },
  { key: 'case', label: 'Neuer Vorgang', icon: 'folder' },
  { key: 'event', label: 'Business Event', icon: 'bell' },
  { key: 'note', label: 'Notiz', icon: 'edit' },
  { key: 'voice', label: 'Sprachnotiz', icon: 'mic' },
];
