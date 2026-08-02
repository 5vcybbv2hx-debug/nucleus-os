// ============================================================================
// PROJEKT ATLAS — Atlas-Kernkonstanten
// ============================================================================

// ATLAS ORGANIZATION CONSTANTS (ersetzt BEREICHE für neue Komponenten)
export const ORGANIZATIONS = {
  BAR: { label: 'Bar', short_name: 'BAR', icon: '🍺', type: 'betrieb' },
  SANDRA: { label: 'Sandras Büro', short_name: 'SANDRA', icon: '💼', type: 'buero' },
  PIERRE: { label: 'Pierre privat', short_name: 'PIERRE', icon: '👤', type: 'privat' },
  SANDRA_P: { label: 'Sandra privat', short_name: 'SANDRA_P', icon: '👤', type: 'privat' },
  FAMILIE: { label: 'Familie / Gemeinsam', short_name: 'FAMILIE', icon: '🏠', type: 'familie' },
  EXECUTIVE: { label: 'Executive Center', short_name: 'EXECUTIVE', icon: '👑', type: 'executive' },
  IMMO: { label: 'Immobilienaufbau', short_name: 'IMMO', icon: '🏗️', type: 'investment' },
};

// ATLAS TASK STATUS (ersetzt STATUS_CONFIG für neue Komponenten)
export const TASK_STATUS = {
  'Eingang': { label: 'Eingang', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'Geplant': { label: 'Geplant', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  'In Bearbeitung': { label: 'In Bearbeitung', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  'Teilweise erledigt': { label: 'Teilweise erledigt', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  'Wartet auf Antwort': { label: 'Wartet auf Antwort', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  'Delegiert': { label: 'Delegiert', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  'Blockiert': { label: 'Blockiert', color: 'text-red-500', bg: 'bg-red-500/10' },
  'Zur Prüfung': { label: 'Zur Prüfung', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  'Erledigt': { label: 'Erledigt', color: 'text-green-500', bg: 'bg-green-500/10' },
  'Nicht mehr notwendig': { label: 'Nicht mehr notwendig', color: 'text-gray-500', bg: 'bg-gray-500/10' },
  'Archiviert': { label: 'Archiviert', color: 'text-gray-400', bg: 'bg-gray-400/10' },
};

// Legacy Status Mapping (nur für Anzeige alter Daten)
export const LEGACY_STATUS_MAP = {
  'offen': 'Eingang',
  'in_bearbeitung': 'In Bearbeitung',
  'erledigt': 'Erledigt',
};

// ATLAS ROLES (ersetzt ROLES für neue Komponenten)
export const ATLAS_ROLES = {
  administrator: { label: 'Administrator', description: 'Vollständiger Zugriff' },
  vertretung: { label: 'Vertretung', description: 'Eingeschränkter Zugriff' },
  buero: { label: 'Büro', description: 'Vereinfachte Arbeitsansicht' },
};

// ============================================================================
// LEGACY - nicht für neue Atlas-Komponenten verwenden
// ============================================================================

// LEGACY - nicht für neue Atlas-Komponenten verwenden
export const BEREICHE = {
  BAR: { label: 'Bar', color: 'text-bar', bg: 'bg-bar/10', border: 'border-bar/30', dot: 'bg-bar' },
  PRIVAT_FAMILIE: { label: 'Privat/Familie', color: 'text-privat', bg: 'bg-privat/10', border: 'border-privat/30', dot: 'bg-privat' },
  NEBENGEWERBE: { label: 'Nebengewerbe', color: 'text-nebengewerbe', bg: 'bg-nebengewerbe/10', border: 'border-nebengewerbe/30', dot: 'bg-nebengewerbe' },
};

export const DOC_TYPES = [
  'Eingangsrechnung', 'Ausgangsrechnung', 'Kontoauszug', 'EC-Abrechnung',
  'Kassenbericht', 'Vertrag', 'Versicherung', 'Steuerdokument',
  'Personalunterlage', 'Lizenz', 'Fahrzeugdokument', 'Gesundheitsdokument', 'Sonstiges'
];

export const DOC_STATUS = {
  neu: { label: 'Neu', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  verarbeitet: { label: 'Verarbeitet', color: 'text-green-400', bg: 'bg-green-400/10' },
  offen: { label: 'Offen', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  bezahlt: { label: 'Bezahlt', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  archiviert: { label: 'Archiviert', color: 'text-gray-500', bg: 'bg-gray-500/10' },
  an_steuerberater: { label: 'Beim Stb.', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  wartet_auf_pruefung: { label: 'Wartet', color: 'text-orange-400', bg: 'bg-orange-400/10' },
};

export const DEADLINE_CATEGORIES = {
  versicherung: { label: 'Versicherung', icon: '🛡️' },
  steuertermin: { label: 'Steuertermin', icon: '📅' },
  vertrag: { label: 'Vertrag', icon: '📄' },
  lizenz: { label: 'Lizenz', icon: '📋' },
  fahrzeug: { label: 'Fahrzeug', icon: '🚗' },
  gesundheit: { label: 'Gesundheit', icon: '❤️' },
  sonstiges: { label: 'Sonstiges', icon: '📌' },
};

export const PRIORITY_CONFIG = {
  hoch: { label: 'Hoch', color: 'text-red-400', bg: 'bg-red-400/10', dot: 'bg-red-400' },
  mittel: { label: 'Mittel', color: 'text-yellow-400', bg: 'bg-yellow-400/10', dot: 'bg-yellow-400' },
  niedrig: { label: 'Niedrig', color: 'text-gray-400', bg: 'bg-gray-400/10', dot: 'bg-gray-400' },
};

// LEGACY - nicht für neue Atlas-Komponenten verwenden
export const STATUS_CONFIG = {
  offen: { label: 'Offen', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  in_bearbeitung: { label: 'In Bearbeitung', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  erledigt: { label: 'Erledigt', color: 'text-green-400', bg: 'bg-green-400/10' },
};

// LEGACY - nicht für neue Atlas-Komponenten verwenden. Atlas verwendet ATLAS_ROLES.
export const ROLES = {
  SUPERADMIN: { label: 'Super Admin', bereiche: ['BAR', 'PRIVAT_FAMILIE', 'NEBENGEWERBE'] },
  admin: { label: 'Super Admin', bereiche: ['BAR', 'PRIVAT_FAMILIE', 'NEBENGEWERBE'] },
  ADMIN_FAMILIE: { label: 'Familie Admin', bereiche: ['PRIVAT_FAMILIE', 'NEBENGEWERBE'] },
  BUERO: { label: 'Büro', bereiche: ['BAR', 'NEBENGEWERBE'] },
  LIMITED_USER: { label: 'Benutzer', bereiche: ['BAR'] },
  STEUERBERATER: { label: 'Steuerberater', bereiche: ['BAR', 'PRIVAT_FAMILIE', 'NEBENGEWERBE'] },
  user: { label: 'Benutzer', bereiche: ['BAR', 'PRIVAT_FAMILIE', 'NEBENGEWERBE'] },
};

export const FINANCE_CATEGORIES = [
  'Miete', 'Personal / Gehälter', 'Waren / Einkauf', 'Strom / Gas / Wasser',
  'Telefon / Internet', 'Versicherungen', 'Marketing / Werbung', 'Software / IT',
  'Fahrzeugkosten', 'Steuer / Abgaben', 'Kredite / Leasing', 'Instandhaltung',
  'Büromaterial', 'Reinigung', 'Sonstiges'
];

// ============================================================================
// BAR INTEGRATION (Projekt Atlas ↔ SAVO Bar-App)
// ============================================================================

export const INTEGRATION_MODES = {
  READ_ONLY: 'read_only',
  MOCK: 'mock',
  DISABLED: 'disabled',
  STALE: 'stale',
};

export const INSIGHT_TYPES = {
  EVENT: 'event',
  STAFFING: 'staffing',
  TASK: 'task',
  RESERVATION: 'reservation',
  WARNING: 'warning',
};

export const SEVERITY_ORDER = {
  critical: 0, high: 1, medium: 2, warning: 3, info: 4,
};