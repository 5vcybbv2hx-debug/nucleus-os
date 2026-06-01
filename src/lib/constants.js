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

export const STATUS_CONFIG = {
  offen: { label: 'Offen', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  in_bearbeitung: { label: 'In Bearbeitung', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  erledigt: { label: 'Erledigt', color: 'text-green-400', bg: 'bg-green-400/10' },
};

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