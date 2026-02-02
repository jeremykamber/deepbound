import React from 'react'
import { Persona } from '@/domain/entities/Persona'

interface PsychologicalRadarProps {
  persona: Persona
}

export const PsychologicalRadar: React.FC<PsychologicalRadarProps> = ({ persona }) => {
  const traits = [
    { label: 'CON', value: persona.conscientiousness },
    { label: 'NEU', value: persona.neuroticism },
    { label: 'OPN', value: persona.openness },
    { label: 'COG', value: persona.cognitiveReflex },
    { label: 'TEC', value: persona.technicalFluency },
    { label: 'PRI', value: persona.economicSensitivity },
  ];

  const size = 160;
  const center = size / 2;
  const radius = (size / 2) * 0.75;
  const angleStep = (Math.PI * 2) / traits.length;

  // Calculate coordinates for a trait value (0-100)
  const getPoint = (index: number, value: number, offset = 0) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / 100) * radius + offset;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const points = traits.map((t, i) => getPoint(i, t.value));
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Background circles/hexagons for scale
  const scales = [25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white/[0.01] rounded-lg border border-white/5 shadow-inner">
      <svg width={size} height={size} className="overflow-visible">
        {/* Scale Hexagons */}
        {scales.map(s => (
          <polygon
            key={s}
            points={traits.map((_, i) => {
              const p = getPoint(i, s);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            strokeDasharray="1,2"
            className="opacity-[0.03]"
          />
        ))}

        {/* Axis Lines */}
        {traits.map((_, i) => {
          const p = getPoint(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="white"
              strokeWidth="0.5"
              className="opacity-[0.03]"
            />
          );
        })}

        {/* The DNA Polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(var(--primary-rgb), 0.1)"
          stroke="currentColor"
          strokeWidth="1.2"
          className="text-primary/60 transition-all duration-300 ease-out"
        />

        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.5"
            fill="currentColor"
            className="text-primary"
          />
        ))}

        {/* Labels */}
        {traits.map((t, i) => {
          const p = getPoint(i, 115); // Label position
          return (
            <text
              key={i}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[7px] font-black fill-muted-foreground/30 uppercase tracking-[0.2em]"
            >
              {t.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
