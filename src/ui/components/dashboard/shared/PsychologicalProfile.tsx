import React, { useState } from 'react'
import { Persona } from '@/domain/entities/Persona'
import { ChevronDown, Info, HelpCircle } from 'lucide-react'
import { PsychologicalRadar } from './PsychologicalRadar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface PsychologicalProfileProps {
  persona: Persona
}

export const PsychologicalProfile: React.FC<PsychologicalProfileProps> = ({ persona }) => {
  const [isBackstoryExpanded, setIsBackstoryExpanded] = useState(false);

  const traits = [
    { label: 'Conscientiousness', value: persona.conscientiousness, desc: 'Flexible vs Meticulous' },
    { label: 'Neuroticism', value: persona.neuroticism, desc: 'Sturdy vs Risk-Averse' },
    { label: 'Openness', value: persona.openness, desc: 'Traditional vs Early Adopter' },
    { label: 'Cognitive Reflex', value: persona.cognitiveReflex, desc: 'System 1 vs System 2' },
    { label: 'Tech Fluency', value: persona.technicalFluency, desc: 'Novice vs Expert' },
    { label: 'Price Sensitivity', value: persona.economicSensitivity, desc: 'Abundance vs Budget' },
  ];

  const backstory = persona.backstory || '';
  const [showDefinitions, setShowDefinitions] = useState(false);

  const traitDefinitions = [
    { label: 'Conscientiousness', desc: 'Measures organization and dependability. High scores indicate meticulous, structured thinkers; low scores indicate more flexible approaches.' },
    { label: 'Neuroticism', desc: 'Measures emotional stability and risk-aversion. High scores indicate a high sensitivity to risk and uncertainty.' },
    { label: 'Openness', desc: 'Measures curiosity and willingness to try new things. High scores indicate early adopters and innovators.' },
    { label: 'Cognitive Reflex', desc: 'Measures the tendency to use System 1 (intuitive) vs System 2 (analytical) thinking.' },
    { label: 'Tech Fluency', desc: 'Measures expertise with digital tools and interfaces.' },
    { label: 'Price Sensitivity', desc: 'Measures the importance of cost in purchasing decisions.' },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="space-y-10">
        <PsychologicalRadar persona={persona} />

        {backstory && (
          <div className="space-y-4 px-2">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-px w-6 bg-primary/40" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">Backstory</h3>
              </div>
              <p className="text-[11px] text-primary/50 font-bold uppercase tracking-widest leading-relaxed max-w-md">
                The life experiences that influence how they buy.
              </p>
            </div>

            <div className="relative">
              <p className={`text-sm text-muted-foreground/80 font-normal leading-relaxed transition-all duration-300 ${isBackstoryExpanded ? '' : 'line-clamp-4'}`}>
                {backstory}
              </p>
              <button
                onClick={() => setIsBackstoryExpanded(!isBackstoryExpanded)}
                className="mt-4 text-[9px] font-bold uppercase tracking-[0.2em] text-primary hover:text-white transition-colors duration-200 flex items-center gap-2 group"
              >
                {isBackstoryExpanded ? 'Collapse' : 'Expand full history'}
                <ChevronDown className={`size-3 transition-transform duration-200 ${isBackstoryExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-8 pt-8 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50">Buyer Psychology</h3>
          </div>
          <button
            onClick={() => setShowDefinitions(true)}
            className="h-8 px-4 rounded-lg border border-white/10 bg-white/5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors duration-200 flex items-center gap-2"
          >
            <HelpCircle className="size-3" />
            Definitions
          </button>
        </div>

        <Dialog open={showDefinitions} onOpenChange={setShowDefinitions}>
          <DialogContent className="sm:max-w-md rounded-xl bg-background border-white/15 p-0 overflow-hidden shadow-3xl transform-gpu antialiased">
            <div className="p-6 md:p-10 border-b border-white/5 bg-white/[0.02]">
              <DialogTitle className="text-xl font-bold tracking-tight mb-2">Trait Definitions</DialogTitle>
              <DialogDescription className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">How we measure buyer behavior.</DialogDescription>
            </div>
            <div className="p-6 md:p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {traitDefinitions.map((trait) => (
                <div key={trait.label} className="space-y-1.5">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{trait.label}</p>
                  <p className="text-xs text-muted-foreground/60 font-normal leading-relaxed">{trait.desc}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 gap-y-6">
          {traits.map((trait) => (
            <div key={trait.label} className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground/50">{trait.label}</span>
                <span className="text-[10px] font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{trait.value}%</span>
              </div>
              <div className="relative h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-primary/60 transition-all duration-300 ease-out"
                  style={{ width: `${trait.value}%` }}
                />
              </div>
              <div className="flex justify-between items-center px-0.5">
                <span className="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-[0.2em]">{trait.desc.split(' vs ')[0]}</span>
                <span className="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-[0.2em]">{trait.desc.split(' vs ')[1]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
