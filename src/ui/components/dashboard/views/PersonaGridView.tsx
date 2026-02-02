import React, { useState } from 'react'
import { Persona } from '@/domain/entities/Persona'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, Info, ChevronDown, MessageSquare, ArrowRight, Loader } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { PsychologicalProfile } from '../shared/PsychologicalProfile'
import { PersonaCard } from '../shared/PersonaCard'

interface PersonaGridViewProps {
  personas: Persona[]
  pricingUrl: string
  setPricingUrl: (val: string) => void
  isPending: boolean
  onAnalyze: () => void
  onChat: (persona: Persona) => void
}

export const PersonaGridView: React.FC<PersonaGridViewProps> = ({
  personas,
  pricingUrl,
  setPricingUrl,
  isPending,
  onAnalyze,
  onChat
}) => {
  const [showPsychInfoId, setShowPsychInfoId] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {personas.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            onChat={onChat}
            onViewProfile={(p) => setShowPsychInfoId(p.id)}
          />
        ))}
      </div>

      <Dialog open={!!showPsychInfoId} onOpenChange={(open) => !open && setShowPsychInfoId(null)}>
        <DialogContent className="sm:max-w-xl rounded-xl bg-background border-white/15 p-0 overflow-hidden shadow-3xl transform-gpu antialiased">
          <div className="p-6 md:p-10 border-b border-white/5 bg-white/[0.02]">
            <DialogTitle className="text-xl font-bold tracking-tight mb-2">Full Profile</DialogTitle>
            <DialogDescription className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Deep-dive into their backstory, goals, and decision triggers.</DialogDescription>
          </div>
          <div className="p-6 md:p-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {showPsychInfoId && personas.find(p => p.id === showPsychInfoId) && (
              <PsychologicalProfile persona={personas.find(p => p.id === showPsychInfoId)!} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="rounded-xl border-white/10 bg-white/[0.02] shadow-2xl transition-all overflow-hidden border">
        <div className="px-8 py-10 md:px-12 flex flex-col gap-10">
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-foreground tracking-tight">Audit your pricing</h3>
            <p className="text-sm text-muted-foreground/60 font-medium leading-relaxed max-w-lg">
              See how these people react to your pricing, packaging, and value proposition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-9 space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50 ml-1">Pricing page URL</label>
              <Input
                type="url"
                placeholder="https://acme.inc/pricing"
                value={pricingUrl}
                onChange={(e) => setPricingUrl(e.target.value)}
                disabled={isPending}
                className="text-sm w-full h-12 bg-white/[0.02] border-white/10 rounded-lg focus:border-white/20 transition-colors duration-200 placeholder:text-muted-foreground/10 shadow-inner px-4 font-mono"
              />
            </div>

            <div className="md:col-span-3">
              <Button
                onClick={onAnalyze}
                disabled={!pricingUrl.trim() || isPending}
                variant="premium"
                size="lg"
                className="h-12 w-full rounded-lg px-8 group font-bold uppercase tracking-widest text-[11px]"
              >
                {isPending ? (
                  <span className="flex items-center gap-3">
                    <Loader className="h-4 w-4 animate-spin" />
                    Auditing
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Run Audit
                    <ArrowRight className="size-3 ml-1 opacity-50" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
