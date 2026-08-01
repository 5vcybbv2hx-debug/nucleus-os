import { AlertTriangle } from 'lucide-react';

/**
 * LegacyBanner — einheitlicher Hinweis für Legacy-Module.
 * Wird später migriert; nicht für neue Daten verwenden.
 */
export default function LegacyBanner() {
  return (
    <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
      <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
      <span className="text-xs text-amber-300">
        ⚠️ Legacy – wird später migriert. Nicht für neue Daten verwenden.
      </span>
    </div>
  );
}