import React from 'react';
import { GazePoint } from '@/domain/entities/PricingAnalysis';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GazeOverlayProps {
  screenshotBase64: string;
  gazePoints: GazePoint[];
}

export const GazeOverlay: React.FC<GazeOverlayProps> = ({ screenshotBase64, gazePoints }) => {
  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-slate-200 shadow-xl group">
      {/* The base screenshot */}
      <img
        src={screenshotBase64.startsWith('http') || screenshotBase64.startsWith('/') ? screenshotBase64 : `data:image/jpeg;base64,${screenshotBase64}`}
        alt="Pricing Page Analysis"
        className="w-full h-auto block"
      />

      {/* The Overlay Layer */}
      <div className="absolute inset-0 pointer-events-auto">
        <TooltipProvider>
          {gazePoints.map((point, idx) => (
            <div
              key={idx}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
              }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative cursor-help">
                    {/* Hotspot Core */}
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg animate-pulse" />

                    {/* Expanding Glow Rings */}
                    <div className="absolute inset-0 w-full h-full rounded-full bg-blue-400 opacity-40 animate-ping" />

                    {/* Heatmap-like background glow */}
                    <div
                      className="absolute inset-[-20px] rounded-full bg-blue-500/20 blur-xl pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0) 70%)'
                      }}
                    />

                    {/* Label Number */}
                    <div className="absolute -top-4 -right-4 bg-slate-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                      {idx + 1}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-900 text-white border-slate-800">
                  <p className="text-xs font-medium">{point.focusLabel}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
        </TooltipProvider>
      </div>

      {/* Legend Overlay (optional, nice touch) */}
      <div className="absolute bottom-4 left-4 right-4 flex gap-4 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Predicted Gaze Points</span>
        </div>
      </div>
    </div>
  );
};
