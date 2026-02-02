import React from 'react'

interface MetricBlockProps {
  label: string
  value: number
  highlight?: boolean
}

export const MetricBlock: React.FC<MetricBlockProps> = ({ label, value, highlight }) => {
  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/40">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-bold tracking-tighter ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</span>
        <span className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-widest">/ 10</span>
      </div>
      <div className="h-1 w-10 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-300 ${highlight ? 'bg-primary/80' : 'bg-white/20'}`} style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  )
}
