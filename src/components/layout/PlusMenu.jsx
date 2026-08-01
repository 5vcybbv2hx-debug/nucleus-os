import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, CheckSquare, Lightbulb, FileText, Calendar, Receipt, Brain } from 'lucide-react';

const ACTIONS = [
  { key: 'task', label: 'Aufgabe erstellen', icon: CheckSquare, accent: 'text-sky-400' },
  { key: 'idea', label: 'Idee erfassen', icon: Lightbulb, accent: 'text-amber-400' },
  { key: 'document', label: 'Dokument hinzufügen', icon: FileText, accent: 'text-violet-400', placeholder: true },
  { key: 'appointment', label: 'Termin erstellen', icon: Calendar, accent: 'text-emerald-400', placeholder: true },
  { key: 'expense', label: 'Ausgabe erfassen', icon: Receipt, accent: 'text-red-400', placeholder: true },
  { key: 'reflection', label: 'Erkenntnis / Notiz', icon: Brain, accent: 'text-rose-400' },
];

export default function PlusMenu({ onAction }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Plus Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-20 right-1/2 translate-x-1/2 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform lg:hidden"
        aria-label="Schnellaktion"
      >
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          {open ? <X size={26} /> : <Plus size={26} />}
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-36 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm bg-card border border-border rounded-3xl p-4 shadow-2xl lg:hidden"
            >
              <div className="grid grid-cols-3 gap-3">
                {ACTIONS.map(a => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.key}
                      onClick={() => {
                        if (a.placeholder) return;
                        onAction?.(a.key);
                        setOpen(false);
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                        a.placeholder ? 'border-dashed border-border opacity-40 cursor-not-allowed' : 'border-border hover:bg-secondary'
                      }`}
                    >
                      <Icon size={22} className={a.accent} />
                      <span className="text-[11px] text-center leading-tight">{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}