import { motion } from 'framer-motion';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'text-primary', trend, onClick }) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`bg-card border border-border rounded-2xl p-4 ${onClick ? 'cursor-pointer active:bg-secondary/50' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</span>
        {Icon && <Icon size={16} className={color} />}
      </div>
      <div className={`text-2xl font-semibold ${color} mb-1`}>{value}</div>
      {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      {trend && (
        <div className={`text-xs mt-2 font-medium ${trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}% vs. Vormonat
        </div>
      )}
    </motion.div>
  );
}