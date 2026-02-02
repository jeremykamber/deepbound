import React, { useState, useEffect } from 'react'
import { Persona } from '@/domain/entities/Persona'
import { PricingAnalysis } from '@/domain/entities/PricingAnalysis'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel"
import { FileDown, Loader, Target, MessageSquare, ChevronDown, BrainCircuit, ArrowRight, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { GazeOverlay } from '../../GazeOverlay'
import { PsychologicalProfile } from '../shared/PsychologicalProfile'
import { PsychologicalRadar } from '../shared/PsychologicalRadar'
import { MetricBlock } from '../shared/MetricBlock'
import dynamic from 'next/dynamic'
import { PersonaAnalysisReport } from '../../PersonaAnalysisPDF'

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
)

interface AnalysisResultViewProps {
  personas: Persona[]
  analyses: PricingAnalysis[]
  pricingUrl: string
  predictingGazeId: string | null
  onPredictGaze: (analysis: PricingAnalysis, persona: Persona) => void
  onChat: (persona: Persona, analysis: PricingAnalysis) => void
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  personas,
  analyses,
  pricingUrl,
  predictingGazeId,
  onPredictGaze,
  onChat
}) => {
  const [api, setApi] = useState<CarouselApi>()
  const [activeAnalysisIndex, setActiveAnalysisIndex] = useState(0)
  const [expandedMonologueId, setExpandedMonologueId] = useState<string | null>(null)
  const [showPsychInfoId, setShowPsychInfoId] = useState<string | null>(null)

  useEffect(() => {
    if (!api) return

    const onSelect = () => {
      setActiveAnalysisIndex(api.selectedScrollSnap())
    }

    onSelect()
    api.on("select", onSelect)

    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-bold tracking-tight">Buyer Insights</h3>
          <p className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-[0.2em]">{analyses.length} Total Audits</p>
        </div>
        <PDFDownloadLink
          document={<PersonaAnalysisReport personas={personas} analyses={analyses} pricingUrl={pricingUrl} />}
          fileName={`analysis-${new Date().getTime()}.pdf`}
        >
          {({ loading }) => (
            <Button variant="outline" size="sm" disabled={loading} className="rounded-lg px-4 h-9 text-[10px] font-bold uppercase tracking-widest border-white/10">
              {loading ? <Loader className="animate-spin" /> : <><FileDown className="mr-2 size-3" /> Export PDF</>}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      <Carousel setApi={setApi} className="w-full">
        <div className="flex items-center justify-end md:absolute md:-top-16 md:right-0 gap-3 mb-4 md:mb-0">
          <CarouselPrevious className="static translate-y-0 translate-x-0 size-8 rounded-lg border-white/10 text-muted-foreground/40 hover:text-white bg-white/[0.02]" />
          <div className="text-[10px] font-bold text-muted-foreground tracking-widest w-12 text-center uppercase">
            <span className="text-foreground">{activeAnalysisIndex + 1}</span> / {analyses.length}
          </div>
          <CarouselNext className="static translate-y-0 translate-x-0 size-8 rounded-lg border-white/10 text-muted-foreground/40 hover:text-white bg-white/[0.02]" />
        </div>

        <CarouselContent>
          {analyses.map((analysis, idx) => {
            const persona = personas[idx];
            if (!persona) return null;

            return (
              <CarouselItem key={analysis.id}>
                <Card className="rounded-xl border-white/10 bg-white/[0.02] overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                  <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
                      <div className="space-y-2">
                        <Badge variant="premium" className="rounded-md">AUDIT COMPLETE</Badge>
                        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">{persona.name}</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">{persona.occupation}</CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          className="rounded-lg px-6 h-10 text-[10px] font-bold uppercase tracking-widest border-white/10 hover:bg-white/5"
                          disabled={!!predictingGazeId || !!analysis.gazePoints}
                          onClick={() => onPredictGaze(analysis, persona)}
                        >
                          {predictingGazeId === analysis.id ? <Loader className="animate-spin" /> : <Target className="mr-2 size-4 opacity-40" />}
                          Where they look
                        </Button>
                        <Button
                          variant="premium"
                          className="rounded-lg px-6 h-10 text-[10px] font-bold uppercase tracking-widest shadow-none"
                          onClick={() => onChat(persona, analysis)}
                        >
                          <MessageSquare className="mr-2 size-4" />
                          Interview
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10 space-y-12">
                    {/* Gut Reaction - High Density Quote */}
                    <div className="relative pl-0 md:pl-10 border-l-0 md:border-l-2 border-primary/40">
                      <span className="hidden md:block absolute -left-1 top-0 text-[10px] font-black uppercase tracking-[0.3em] text-primary vertical-rl -translate-x-[250%] mt-1">First Impression</span>
                      <p className="text-xl md:text-2xl font-medium text-foreground leading-snug tracking-tight antialiased">
                        &ldquo;{analysis.gutReaction}&rdquo;
                      </p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                      <MetricBlock label="UI Clarity" value={analysis.scores.clarity} />
                      <MetricBlock label="Value Perception" value={analysis.scores.valuePerception} />
                      <MetricBlock label="Psychological Trust" value={analysis.scores.trust} />
                      <MetricBlock label="Buying Likelihood" value={analysis.scores.likelihoodToBuy} highlight />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 pt-10 border-t border-white/5">
                      <div className="space-y-10">
                        <div className="space-y-6">
                          <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50">Summary</h4>
                          <div className="space-y-4">
                            {analysis.thoughts
                              .split('\n\n')
                              .filter(p => p.trim())
                              .map((p, pIdx) => (
                                <p key={pIdx} className="text-muted-foreground/80 leading-relaxed font-normal text-sm antialiased">
                                  {p}
                                </p>
                              ))
                            }
                          </div>
                        </div>

                        {analysis.rawAnalysis && (
                          <div className="space-y-4 pt-6 border-t border-white/5">
                            <button
                              onClick={() => setExpandedMonologueId(expandedMonologueId === analysis.id ? null : analysis.id)}
                              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary transition-colors duration-200 group"
                            >
                              <BrainCircuit className="size-3" />
                              {expandedMonologueId === analysis.id ? 'Close Log' : 'Decision Process'}
                              <ChevronDown className={`size-3 transition-transform duration-200 ${expandedMonologueId === analysis.id ? 'rotate-180' : ''}`} />
                            </button>

                            {expandedMonologueId === analysis.id && (
                              <div className="p-6 bg-white/[0.02] rounded-lg border border-white/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2">
                                  <div className="size-1.5 rounded-full bg-primary/40 animate-pulse" />
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Internal Thoughts</span>
                                </div>
                                <div className="space-y-3">
                                  {analysis.rawAnalysis.split('\n\n').map((p, pIdx) => (
                                    <p key={pIdx} className="text-[11px] text-muted-foreground/50 leading-relaxed font-mono">
                                      {p}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50">Why they hesitate</h4>
                        <div className="grid gap-3">
                          {analysis.risks.map((risk, idx) => (
                            <div key={idx} className="flex gap-4 p-4 bg-white/[0.03] rounded-lg border border-white/5 text-xs font-medium text-foreground leading-relaxed">
                              <AlertCircle className="size-4 shrink-0 text-primary/30" /> {risk}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 pt-10 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/30">Buyer Psychology</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[10px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary transition-colors p-0 h-auto"
                          onClick={() => setShowPsychInfoId(persona.id)}
                        >
                          View Deep Profile <ArrowRight className="ml-2 size-3" />
                        </Button>
                      </div>
                      <div className="h-40 md:h-56 opacity-40">
                        <PsychologicalRadar persona={persona} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>

      <Dialog open={!!showPsychInfoId} onOpenChange={(open) => !open && setShowPsychInfoId(null)}>
        <DialogContent className="sm:max-w-xl rounded-xl bg-background border border-white/15 p-0 overflow-hidden shadow-3xl transform-gpu antialiased">
          <div className="p-6 md:p-10 border-b border-white/5 bg-white/[0.02]">
            <DialogTitle className="text-xl font-bold tracking-tight mb-2">Persona Profile</DialogTitle>
            <DialogDescription className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Backstory, goals, and decision triggers.</DialogDescription>
          </div>
          <div className="p-6 md:p-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {showPsychInfoId && personas.find(p => p.id === showPsychInfoId) && (
              <PsychologicalProfile persona={personas.find(p => p.id === showPsychInfoId)!} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
