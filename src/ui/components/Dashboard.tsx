'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrainCircuit, Server, Globe, Eye, Zap, Loader2 } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Persona } from '@/domain/entities/Persona'
import { PricingAnalysis } from '@/domain/entities/PricingAnalysis'
import { MOCK_PERSONAS } from '@/domain/entities/MockPersonas'
import { MOCK_ANALYSES } from '@/domain/entities/MockAnalyses'

// Shared Components
import { ThoughtfulDialog } from './dashboard/shared/ThoughtfulDialog'
import { RefinedStep, Step } from './dashboard/shared/RefinedStep'

// Hooks
import { usePersonaFlow } from '../hooks/usePersonaFlow'
import { useAnalysisFlow } from '../hooks/useAnalysisFlow'

// Views
import { CustomerInputView } from './dashboard/views/CustomerInputView'
import { PersonaGridView } from './dashboard/views/PersonaGridView'
import { AnalysisResultView } from './dashboard/views/AnalysisResultView'
import { PersonaChat } from './PersonaChat'
import { PartialPersonaCard } from "@/components/PartialPersonaCard";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel"
import Logo from './Logo'

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('input')
  const [activeChat, setActiveChat] = useState<{ persona: Persona; analysis: PricingAnalysis | null } | null>(null)
  const [api, setApi] = useState<CarouselApi>()

  const {
    customerProfile,
    setCustomerProfile,
    personas,
    setPersonas,
    error: personaError,
    isPending: isPersonaPending,
    personaProgress,
    handleGeneratePersonas,
    handleCancel: cancelPersonaGeneration
  } = usePersonaFlow(() => setActiveTab('personas'))

  const {
    pricingUrl,
    setPricingUrl,
    analyses,
    setAnalyses,
    error: analysisError,
    isPending: isAnalysisPending,
    analysisProgress,
    predictingGazeId,
    handleAnalyzePricing,
    handlePredictGaze,
    handleCancel: cancelAnalysis,
    combinedAnalysisStream
  } = useAnalysisFlow(() => setActiveTab('analysis'))

  const handleUseExamples = () => {
    setPersonas(MOCK_PERSONAS)
    setPricingUrl('https://www.gumroad.com/pricing')
    setActiveTab('personas')
  }

  const handleUseMockAnalysis = () => {
    setPersonas(MOCK_PERSONAS)
    setPricingUrl('https://linear.app/pricing')
    setAnalyses(Object.values(MOCK_ANALYSES))
    setActiveTab('analysis')
  }

  // Progress Calculation
  const getAnalysisProgressPercentage = () => {
    if (!analysisProgress) return 0
    switch (analysisProgress.step) {
      case 'STARTING': return 10
      case 'OPENING_PAGE': return 30
      case 'FINDING_PRICING': return 65
      case 'THINKING': return 90
      case 'DONE': return 100
      default: return 0
    }
  }

  const getPersonaProgressPercentage = () => {
    if (!personaProgress) return 0
    switch (personaProgress.step) {
      case 'BRAINSTORMING_PERSONAS': return 20
      case 'GENERATING_BACKSTORIES':
        const base = 20
        const totalSub = personaProgress.totalSubSteps || 12
        const completedSub = personaProgress.completedSubSteps || 0
        return base + (completedSub / totalSub) * 80
      case 'DONE': return 100
      default: return 0
    }
  }

  const analysisSteps: Step[] = [
    { id: 'STARTING', label: 'Starting', icon: Server, description: 'Powering up...' },
    { id: 'OPENING_PAGE', label: 'Opening Page', icon: Globe, description: 'Loading your site...' },
    { id: 'FINDING_PRICING', label: 'Finding Pricing', icon: Eye, description: 'Scanning for details...' },
    {
      id: 'THINKING',
      label: 'Analyzing',
      icon: BrainCircuit,
      description: analysisProgress?.personaName
        ? `Listening to ${analysisProgress.personaName}...`
        : (analysisProgress?.completedCount ?? 0) > 0 && analysisProgress?.totalCount
          ? `Processed ${analysisProgress.completedCount} of ${analysisProgress.totalCount} buyers`
          : 'Listening to buyer opinions...'
    },
  ]

  const personaSteps: Step[] = [
    { id: 'BRAINSTORMING_PERSONAS', label: 'Finding buyers', icon: BrainCircuit, description: 'Finding the right types of people...' },
    { id: 'GENERATING_BACKSTORIES', label: 'Writing backstories', icon: Zap, description: personaProgress?.personaName ? `Learning about ${personaProgress.personaName}...` : 'Finishing touches...' },
  ]

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 md:pt-4 antialiased selection:bg-primary/20">
      <div className="max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4 pb-4 border-b border-white/5">
            <div className="flex items-center justify-between w-full lg:w-auto">
              <div className="flex items-center gap-3">
                <Logo />
                <h1 className="text-xl font-bold tracking-tight text-foreground whitespace-nowrap uppercase tracking-widest text-[14px]">Dashboard</h1>
              </div>
            </div>

            <div className="w-full lg:w-auto overflow-x-auto scrollbar-none pb-1 lg:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
              <TabsList className="bg-transparent h-auto p-0 gap-2 md:gap-3 flex min-w-max">
                <TabsTrigger value="input" className="rounded-lg h-9 px-4 md:px-5 text-[10px] font-bold uppercase tracking-widest border border-white/10 hover:border-white/20 data-[state=active]:border-primary/50 data-[state=active]:bg-primary/5 transition-all shrink-0">
                  <span className="size-4 rounded-sm border border-current flex items-center justify-center text-[8px] mr-2 md:mr-2.5 opacity-30">1</span>
                  Project Setup
                </TabsTrigger>
                <TabsTrigger value="personas" disabled={!personas} className="rounded-lg h-9 px-4 md:px-5 text-[10px] font-bold uppercase tracking-widest border border-white/10 hover:border-white/20 data-[state=active]:border-primary/50 data-[state=active]:bg-primary/5 transition-all shrink-0">
                  <span className="size-4 rounded-sm border border-current flex items-center justify-center text-[8px] mr-2 md:mr-2.5 opacity-30">2</span>
                  Your Audience
                </TabsTrigger>
                <TabsTrigger value="analysis" disabled={!analyses} className="rounded-lg h-9 px-4 md:px-5 text-[10px] font-bold uppercase tracking-widest border border-white/10 hover:border-white/20 data-[state=active]:border-primary/50 data-[state=active]:bg-primary/5 transition-all shrink-0">
                  <span className="size-4 rounded-sm border border-current flex items-center justify-center text-[8px] mr-2 md:mr-2.5 opacity-30">3</span>
                  Pricing Audit
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="input">
            <CustomerInputView
              customerProfile={customerProfile}
              setCustomerProfile={setCustomerProfile}
              isPending={isPersonaPending}
              error={personaError}
              onGenerate={handleGeneratePersonas}
              onUseExamples={handleUseExamples}
              onUseMockAnalysis={handleUseMockAnalysis}
            />
          </TabsContent>

          <TabsContent value="personas">
            {personas && (
              <PersonaGridView
                personas={personas}
                pricingUrl={pricingUrl}
                setPricingUrl={setPricingUrl}
                isPending={isAnalysisPending}
                onAnalyze={() => handleAnalyzePricing(personas)}
                onChat={(persona) => setActiveChat({ persona, analysis: null })}
              />
            )}
          </TabsContent>

          <TabsContent value="analysis">
            {analyses && personas && (
              <AnalysisResultView
                personas={personas}
                analyses={analyses}
                pricingUrl={pricingUrl}
                predictingGazeId={predictingGazeId}
                onPredictGaze={handlePredictGaze}
                onChat={(persona, analysis) => setActiveChat({ persona, analysis })}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Global Overlays */}
        <ThoughtfulDialog
          isOpen={!!analysisProgress}
          title="Pricing Audit"
          description="Analyzing your page through the eyes of your customers."
          progress={getAnalysisProgressPercentage()}
          onCancel={cancelAnalysis}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 h-full">
            <div className="space-y-8 overflow-y-auto pr-0 lg:pr-4 custom-scrollbar">
              {analysisSteps.map((step, idx) => (
                <RefinedStep
                  key={step.id}
                  step={step}
                  isActive={step.id === analysisProgress?.step}
                  isDone={analysisSteps.findIndex(s => s.id === analysisProgress?.step) > idx}
                />
              ))}
            </div>

            <div className="hidden lg:block relative">
              <div className="sticky top-0 space-y-4">
                {analysisProgress?.screenshot ? (
                  <div className="rounded-xl overflow-hidden border border-white/10 shadow-3xl bg-black relative animate-in fade-in duration-300">
                    <img src={`data:image/jpeg;base64,${analysisProgress.screenshot}`} alt="Live Feed" className="w-full h-auto opacity-50" />
                    <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10">
                      <div className="size-1.5 rounded-full bg-primary" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/80">Stream Active</span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 opacity-10">
                      <Server className="size-10" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.3em]">Connecting to site...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ThoughtfulDialog>

        <ThoughtfulDialog
          isOpen={!!personaProgress}
          title="Building Audience"
          description="Writing 2,500-word backstories for your target customers."
          progress={getPersonaProgressPercentage()}
          onCancel={cancelPersonaGeneration}
        >
          <div className="space-y-10">
            {personaSteps.map((step, idx) => (
              <RefinedStep
                key={step.id}
                step={step}
                isActive={step.id === personaProgress?.step}
                isDone={personaSteps.findIndex(s => s.id === personaProgress?.step) > idx}
                subText={step.id === 'GENERATING_BACKSTORIES' && step.id === personaProgress?.step ? `Generating profile ${(personaProgress.completedCount || 0) + 1} of ${personaProgress.totalCount || 3}` : undefined}
              />
            ))}

            {personaProgress?.step === 'BRAINSTORMING_PERSONAS' && personaProgress.personas && (
              <div className="space-y-8">
                <Carousel key={`brainstorming-${personaProgress.personas.length}`} className="mt-8 mx-6 animate-in fade-in duration-300">
                  <CarouselContent>
                    {personaProgress.personas.length === 0 ? (
                      <CarouselItem>
                        <Card className="rounded-xl border-dashed border-white/10 bg-white/[0.01] overflow-hidden relative animate-pulse">
                          <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                              <Loader2 className="size-5 animate-spin text-primary/60" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Scanning ICP</p>
                              <p className="text-xs text-muted-foreground/40 font-medium">Identifying target buyer segments...</p>
                            </div>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ) : (
                      personaProgress.personas.map((p: Partial<Persona>, i: number) => (
                        <CarouselItem key={i}>
                          <PartialPersonaCard persona={p} />
                        </CarouselItem>
                      ))
                    )}
                  </CarouselContent>
                  {personaProgress.personas.length > 0 && (
                    <div className="flex items-center justify-end gap-3 mt-4">
                      <CarouselPrevious className="size-8 rounded-lg border-white/10 text-muted-foreground/40 hover:text-white bg-white/[0.02]" />
                      <CarouselNext className="size-8 rounded-lg border-white/10 text-muted-foreground/40 hover:text-white bg-white/[0.02]" />
                    </div>
                  )}
                </Carousel>

                {personaProgress.personas.length > 0 && (
                  <div className="flex flex-col items-center gap-4 py-8 border-t border-white/5 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-3">
                      <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Synthesizing more profiles</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-widest">Hold tight — this takes about 30 seconds</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </ThoughtfulDialog>

        {activeChat && (
          <PersonaChat
            persona={activeChat.persona}
            analysis={activeChat.analysis}
            isOpen={!!activeChat}
            onOpenChange={(open) => !open && setActiveChat(null)}
          />
        )}
      </div>
    </div>
  )
}

// <Card key={i} className="p-6 space-y-5 rounded-lg border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] transition-colors duration-200">
//   <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary/60 tracking-tighter">
//     {p.name ? p.name.charAt(0) : <Loader2 className="size-3 animate-spin opacity-40" />}
//   </div>
//
//   <div className="space-y-1">
//     <h4 className="font-bold text-sm text-foreground tracking-tight">
//       {p.name || <span className="opacity-10 text-[10px] uppercase font-black uppercase tracking-widest italic">Learning...</span>}
//     </h4>
//     <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30">
//       {p.occupation || "Analyzing profile..."}
//     </p>
//   </div>
//
//   <div className="flex flex-wrap gap-1.5 pt-1">
//     {p.personalityTraits?.slice(0, 3).map((t: string, ti: number) => (
//       <span key={ti} className="text-[8px] px-2 py-0.5 rounded border border-white/5 bg-white/5 text-muted-foreground/40 font-bold uppercase tracking-widest">
//         {t}
//       </span>
//     )) || (
//         <div className="flex gap-2">
//           {[1, 2].map(s => <div key={s} className="h-3 w-10 rounded-sm bg-white/5 animate-pulse" />)}
//         </div>
//       )}
//   </div>
// </Card>
