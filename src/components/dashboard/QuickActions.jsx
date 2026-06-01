import { useNavigate } from 'react-router-dom';
import { Upload, Plus, Search, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

const actions = [
  { icon: Upload, label: 'Hochladen', to: '/dokumente/neu', color: 'bg-primary/10 text-primary' },
  { icon: Plus, label: 'Ausgabe', to: '/finanzen/neu', color: 'bg-green-500/10 text-green-400' },
  { icon: Search, label: 'Suche', to: '/dokumente?search=1', color: 'bg-purple-500/10 text-purple-400' },
  { icon: Bell, label: 'Frist', to: '/fristen/neu', color: 'bg-orange-500/10 text-orange-400' },
];

export default function QuickActions() {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ icon: Icon, label, to, color }) => (
        <motion.button
          key={label}
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate(to)}
          className={`flex flex-col items-center gap-2 p-3 rounded-2xl ${color} transition-all`}
        >
          <Icon size={22} strokeWidth={1.8} />
          <span className="text-[11px] font-medium">{label}</span>
        </motion.button>
      ))}
    </div>
  );
}