'use client'

import React, { useState, useTransition } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Zap, TrendingUp, Loader, ChevronDown, ExternalLink, FileDown, Eye, CheckCircle2, Server, BrainCircuit, Globe, Target, X, MessageSquare, FlaskConical, Activity, Users, ArrowRight, Info } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel"
import { generatePersonasAction } from '@/actions/generatePersonas'
import { analyzePricingPageAction } from '@/actions/analyzePricingPage'
import { predictGazeAction } from '@/actions/predictGaze'
import { cancelRequestAction } from '@/actions/cancelRequest'
import { Persona } from '@/domain/entities/Persona'
import { PricingAnalysis } from '@/domain/entities/PricingAnalysis'
import { readStreamableValue } from '@ai-sdk/rsc'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { GazeOverlay } from './GazeOverlay'
import { PersonaChat } from './PersonaChat'
import { MOCK_PERSONAS } from '@/domain/entities/MockPersonas'
import { PricingAnalysisProgressStep } from '@/application/usecases/ParsePricingPageUseCase'

import dynamic from 'next/dynamic'
import { PersonaAnalysisReport } from './PersonaAnalysisPDF'

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
)

export const Dashboard: React.FC = () => {
  const [customerProfile, setCustomerProfile] = useState('')
  const [personas, setPersonas] = useState<Persona[] | null>(null)
  const [pricingUrl, setPricingUrl] = useState('')
  const [analyses, setAnalyses] = useState<PricingAnalysis[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('input')
  const [expandedBackstory, setExpandedBackstory] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null)

  // Analysis Progress State
  const [analysisProgress, setAnalysisProgress] = useState<{
    step: PricingAnalysisProgressStep | 'DONE' | 'ERROR',
    screenshot?: string,
    personaName?: string,
    completedCount?: number,
    totalCount?: number,
    analysisToken?: string,
    streamingTexts?: Record<string, string> // Store streams per persona
  } | null>(null)

  const [predictingGazeId, setPredictingGazeId] = useState<string | null>(null)
  const [activeChat, setActiveChat] = useState<{ persona: Persona, analysis: PricingAnalysis | null } | null>(null)
  const [expandedMonologueId, setExpandedMonologueId] = useState<string | null>(null)

  const [personaProgress, setPersonaProgress] = useState<{
    step: 'BRAINSTORMING_PERSONAS' | 'GENERATING_BACKSTORIES' | 'DONE' | 'ERROR',
    personaName?: string,
    completedCount?: number,
    totalCount?: number,
    completedSubSteps?: number,
    totalSubSteps?: number,
    streamingTexts?: Record<string, string>, // Store streams per persona
    personas?: Persona[]
  } | null>(null)

  const [api, setApi] = useState<CarouselApi>()
  const [activeAnalysisIndex, setActiveAnalysisIndex] = useState(0)

  React.useEffect(() => {
    if (!api) {
      return
    }

    setActiveAnalysisIndex(api.selectedScrollSnap())

    api.on("select", () => {
      setActiveAnalysisIndex(api.selectedScrollSnap())
    })
  }, [api])

  const [showPsychInfoId, setShowPsychInfoId] = useState<string | null>(null)

  const handleCancel = async () => {
    if (currentRequestId) {
      await cancelRequestAction(currentRequestId);
    }
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
    setCurrentRequestId(null)
    setAnalysisProgress(null)
    setPersonaProgress(null)
    setError('Analysis cancelled by user')
  }

  const combinedAnalysisStream = React.useMemo(() => {
    if (!analysisProgress?.streamingTexts) return undefined;
    return Object.entries(analysisProgress.streamingTexts)
      .map(([name, text]) => `### Thinking: ${name}\n${text}`)
      .join('\n\n---\n\n');
  }, [analysisProgress?.streamingTexts]);

  const handleGeneratePersonas = () => {
    if (!customerProfile.trim()) return

    setError(null)
    const controller = new AbortController()
    setAbortController(controller)
    setPersonaProgress({ step: 'BRAINSTORMING_PERSONAS' })

    startTransition(async () => {
      try {
        const { streamData } = await generatePersonasAction(customerProfile)

        let lastUpdate = 0;
        const THROTTLE_MS = 150; // Increased for better stability under high load

        for await (const update of readStreamableValue(streamData)) {
          if (controller.signal.aborted) {
            setPersonaProgress(null)
            setAbortController(null)
            return
          }

          if (update) {
            if (update.step === 'ERROR') {
              setError(update.error)
              setPersonaProgress(null)
              setAbortController(null)
              return
            }

            if (update.step === 'DONE') {
              setPersonas(update.personas)
              setPersonaProgress(null)
              setAbortController(null)
              setActiveTab('personas')
              return
            }

            const now = Date.now();
            if (now - lastUpdate > THROTTLE_MS || update.step === 'DONE') {
              setPersonaProgress((prev) => {
                const newStreams = { ...(prev?.streamingTexts || {}) };
                if (update.personaName && update.streamingText) {
                  newStreams[update.personaName] = update.streamingText;
                }
                return {
                  ...update,
                  streamingTexts: newStreams
                };
              });
              lastUpdate = now;
            }
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError((err as Error).message)
        }
        setPersonaProgress(null)
        setAbortController(null)
      }
    })
  }

  const handleAnalyzePricing = () => {
    if (!pricingUrl.trim() || !personas) return

    setError(null)
    const controller = new AbortController()
    setAbortController(controller)
    setAnalysisProgress({ step: 'STARTING' })

    startTransition(async () => {
      try {
        const { streamData, requestId } = await analyzePricingPageAction(pricingUrl, personas)
        setCurrentRequestId(requestId)

        let lastUpdate = 0;
        const THROTTLE_MS = 150; // Max ~6 UI updates per second to keep browser responsive

        for await (const update of readStreamableValue(streamData)) {
          if (controller.signal.aborted) {
            setAnalysisProgress(null)
            setAbortController(null)
            setCurrentRequestId(null)
            return
          }

          if (update) {
            if (update.step === 'CANCELLED') {
              setAnalysisProgress(null)
              setAbortController(null)
              setCurrentRequestId(null)
              setError('Analysis was cancelled')
              return
            }

            if (update.step === 'ERROR') {
              setError(update.error)
              setAnalysisProgress(null)
              setAbortController(null)
              setCurrentRequestId(null)
              return
            }

            if (update.step === 'DONE') {
              setAnalyses(update.analyses)
              setAnalysisProgress(null)
              setAbortController(null)
              setCurrentRequestId(null)
              setActiveTab('analysis')
              return
            }

            const now = Date.now();
            if (now - lastUpdate > THROTTLE_MS) {
              setAnalysisProgress((prev) => {
                const newStreams = { ...(prev?.streamingTexts || {}) };
                if (update.personaName) {
                  newStreams[update.personaName] = (newStreams[update.personaName] || "") + (update.analysisToken || "");
                }
                return {
                  ...update,
                  screenshot: update.screenshot || prev?.screenshot,
                  streamingTexts: newStreams
                };
              });
              lastUpdate = now;
            }
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError((err as Error).message)
        }
        setAnalysisProgress(null)
        setAbortController(null)
        setCurrentRequestId(null)
      }
    })
  }

  const handlePredictGaze = (analysis: PricingAnalysis, persona: Persona) => {
    if (predictingGazeId) return

    setPredictingGazeId(analysis.id)
    startTransition(async () => {
      try {
        const result = await predictGazeAction(persona, analysis.screenshotBase64)
        if (result.success && result.data) {
          setAnalyses((prev) =>
            prev ? prev.map(a => a.id === analysis.id ? { ...a, gazePoints: result.data } : a) : null
          )
        } else {
          setError(result.error || "Failed to predict gaze")
        }
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setPredictingGazeId(null)
      }
    })
  }

  const getProgressPercentage = () => {
    if (!analysisProgress) return 0;
    switch (analysisProgress.step) {
      case 'STARTING': return 10;
      case 'OPENING_PAGE': return 30;
      case 'FINDING_PRICING': return 65;
      case 'THINKING': return 90;
      case 'DONE': return 100;
      default: return 0;
    }
  }

  const steps = [
    { id: 'STARTING', label: 'Starting', icon: Server, description: 'Powering up...' },
    { id: 'OPENING_PAGE', label: 'Opening Page', icon: Globe, description: 'Loading your site...' },
    { id: 'FINDING_PRICING', label: 'Finding Pricing', icon: Eye, description: 'Scanning for details...' },
    {
      id: 'THINKING',
      label: 'Thinking',
      icon: BrainCircuit,
      description: analysisProgress?.personaName
        ? `Listening to ${analysisProgress.personaName}...`
        : (analysisProgress?.completedCount ?? 0) > 0 && analysisProgress?.totalCount
          ? `Processed ${analysisProgress.completedCount} of ${analysisProgress.totalCount} buyers`
          : 'Listening to buyer opinions...'
    },
  ];

  const getPersonaProgressPercentage = () => {
    if (!personaProgress) return 0;
    switch (personaProgress.step) {
      case 'BRAINSTORMING_PERSONAS': return 20;
      case 'GENERATING_BACKSTORIES':
        const base = 20;
        const totalSub = personaProgress.totalSubSteps || 12;
        const completedSub = personaProgress.completedSubSteps || 0;
        return base + (completedSub / totalSub) * 80;
      case 'DONE': return 100;
      default: return 0;
    }
  }

  const personaSteps = [
    { id: 'BRAINSTORMING_PERSONAS', label: 'Creating personas', icon: BrainCircuit, description: 'Finding the right types of buyers...' },
    { id: 'GENERATING_BACKSTORIES', label: 'Writing backstories', icon: Zap, description: personaProgress?.personaName ? `Learning more about ${personaProgress.personaName}...` : 'Finishing touches...' },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 md:pt-4 antialiased selection:bg-primary/10">
      <div className="max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2 pb-2 border-b border-border/10">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <BrainCircuit className="h-4 w-4 text-primary" />
                </div>
                <h1 className="text-xl font-medium tracking-tight text-foreground whitespace-nowrap">Dashboard</h1>
              </div>

              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/40 bg-white/[0.02]">
                <div className="size-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Ready</span>
              </div>
            </div>

            <TabsList className="bg-transparent h-auto p-0 gap-2">
              <TabsTrigger value="input">
                <span className="size-4 rounded-full border border-current flex items-center justify-center text-[8px] mr-2">1</span>
                Customers
              </TabsTrigger>
              <TabsTrigger value="personas" disabled={!personas}>
                <span className="size-4 rounded-full border border-current flex items-center justify-center text-[8px] mr-2">2</span>
                Personas
              </TabsTrigger>
              <TabsTrigger value="analysis" disabled={!analyses}>
                <span className="size-4 rounded-full border border-current flex items-center justify-center text-[8px] mr-2">3</span>
                Analysis
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Input Tab */}

          <TabsContent value="input">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-12 space-y-12">
                <div className="space-y-6">
                  <label className="text-sm font-medium text-muted-foreground ml-1 ">Who are your customers?</label>
                  <textarea
                    placeholder="E.g., 'Bootstrapped founders aged 25-40, cost-conscious but value-driven...'"
                    value={customerProfile}
                    onChange={(e) => setCustomerProfile(e.target.value)}
                    disabled={isPending}
                    className="text-lg w-full min-h-[160px] p-6 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-white/20 transition-all duration-500 font-light leading-relaxed placeholder:text-muted-foreground/30 shadow-inner mt-4"
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/5 py-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-medium ml-2">{error}</AlertDescription>
                  </Alert>
                )}


                <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-6 border-t border-border/5">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <Zap className="size-5 text-primary/40" />
                    <p className="text-sm font-medium leading-relaxed max-w-sm">We'll create realistic personas based on your description.</p>
                  </div>
                  <div className="flex flex-col gap-4 min-w-[300px]">
                    <Button
                      onClick={handleGeneratePersonas}
                      disabled={!customerProfile.trim() || isPending}
                      variant="premium"
                      size="lg"
                      className="h-16 rounded-full px-12 group transition-all"
                    >
                      {isPending ? (
                        <span className="flex items-center gap-3">
                          <Loader className="h-4 w-4 animate-spin" />
                          Thinking...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Create Personas
                          <ArrowRight className="size-4 ml-1 transition-transform group-hover:translate-x-1" />
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground font-medium uppercase tracking-widest text-[10px]"
                      onClick={() => {
                        setPersonas(MOCK_PERSONAS);
                        setPricingUrl('https://www.gumroad.com/pricing');
                        setActiveTab('personas');
                      }}
                    >
                      <FlaskConical className="h-3 w-3 mr-2" />
                      Try with examples
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Personas Tab */}
          <TabsContent value="personas">
            {personas && (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {personas.map((persona) => (
                    <Card key={persona.id} className="rounded-xl border-border/10 bg-card/10 group hover:bg-card/20 transition-all overflow-hidden relative">
                      <div className="absolute top-4 right-4 z-10">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-full md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPsychInfoId(persona.id)}
                        >
                          <Info className="size-4" />
                        </Button>
                      </div>
                      <CardHeader className="px-6 pb-2 pt-6 border-b border-border/5">
                        <div className="space-y-4">
                          <div className="size-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary/60">
                            <Users className="size-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-medium tracking-tight mb-1">{persona.name}</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">{persona.occupation}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-6 py-4 space-y-6">

                        {/* About Them - Custom Dropdown Style */}
                        <div
                          onClick={() => setShowPsychInfoId(persona.id)}
                          className="group/about relative border border-border/10 rounded-lg p-3 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer overflow-hidden"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover/about:text-primary transition-colors">
                              About Them
                            </span>
                            <ChevronDown className="size-3 text-muted-foreground group-hover/about:text-primary transition-colors" />
                          </div>

                          {/* Hover Preview / Content */}
                          <div className="grid grid-rows-[0fr] group-hover/about:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-out">
                            <div className="overflow-hidden">
                              <p className="text-xs text-muted-foreground leading-relaxed font-light pt-2 line-clamp-2">
                                {persona.backstory}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* High Contrast Tags */}
                        <div className="flex flex-wrap gap-2">
                          {persona.personalityTraits.slice(0, 3).map((trait, idx) => (
                            <Badge key={idx} variant="outline" className="rounded-md px-2.5 py-1 font-semibold text-[11px] border-primary/20 text-white/90 bg-primary/10">
                              {trait}
                            </Badge>
                          ))}
                        </div>

                        <Button
                          variant="ghost"
                          className="w-full rounded-lg text-[10px] h-9 font-bold uppercase tracking-[0.2em] text-primary/60 hover:text-primary hover:bg-primary/5 border border-primary/10 transition-all group"
                          onClick={() => setActiveChat({ persona, analysis: null })}
                        >
                          <MessageSquare className="size-3 mr-2 group-hover:scale-110 transition-transform" />
                          Chat
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Psych Info Dialog */}
                <Dialog open={!!showPsychInfoId} onOpenChange={(open) => !open && setShowPsychInfoId(null)}>
                  <DialogContent className="sm:max-w-xl rounded-3xl bg-background/95 backdrop-blur-xl border-border/10 p-0 overflow-hidden">
                    <div className="p-8 border-b border-border/5">
                      <DialogTitle>Persona Profile</DialogTitle>
                      <DialogDescription>Detailed breakdown of {personas.find(p => p.id === showPsychInfoId)?.name}'s personality.</DialogDescription>
                    </div>
                    <div className="p-8 bg-white/[0.02] max-h-[70vh] overflow-y-auto custom-scrollbar">
                      {showPsychInfoId && personas.find(p => p.id === showPsychInfoId) && (
                        <PsychologicalProfile persona={personas.find(p => p.id === showPsychInfoId)!} />
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Card className="rounded-[2rem] border-border/10 bg-card/5 transition-all overflow-hidden">
                  <div className="px-10 py-4 md:px-12 flex flex-col gap-10">
                    <div className="space-y-4 max-w-2xl">
                      <h3 className="text-xl font-medium text-foreground tracking-tight">Test a Page</h3>
                      <p className="text-base text-muted-foreground font-light leading-relaxed">
                        Enter a link to see what your customers think.
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-4">
                        <label className="text-sm font-medium text-muted-foreground ml-1">Website Link (URL)</label>
                        <Input
                          type="url"
                          placeholder="https://yoursite.com/pricing"
                          value={pricingUrl}
                          onChange={(e) => setPricingUrl(e.target.value)}
                          disabled={isPending}
                          className="text-lg w-full h-14 px-6 bg-white/[0.02] border border-white/10 rounded-xl focus:outline-none focus:border-white/20 transition-all duration-500 font-light leading-relaxed placeholder:text-muted-foreground/30 shadow-inner mt-2"
                        />
                      </div>

                      <Button
                        onClick={handleAnalyzePricing}
                        disabled={!pricingUrl.trim() || isPending}
                        variant="premium"
                        size="lg"
                        className="h-14 px-10 rounded-full w-fit group"
                      >
                        {isPending ? (
                          <span className="flex items-center gap-3">
                            <Loader className="h-4 w-4 animate-spin" />
                            Looking...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-sm">
                            Analyze Page
                            <ArrowRight className="size-4 ml-1 transition-transform group-hover:translate-x-1" />
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis">
            {analyses && personas && (
              <div className="space-y-12">
                <div className="flex items-center justify-between border-b border-border/10 pb-8">
                  <div className="space-y-1">
                    <h3 className="text-xl font-medium tracking-tight">Analysis</h3>
                    <p className="text-sm text-muted-foreground font-light">Feedback from {analyses.length} unique personas.</p>
                  </div>
                  <PDFDownloadLink
                    document={<PersonaAnalysisReport personas={personas} analyses={analyses} pricingUrl={pricingUrl} />}
                    fileName={`analysis-${new Date().getTime()}.pdf`}
                  >
                    {({ loading }) => (
                      <Button variant="outline" size="sm" disabled={loading} className="rounded-full px-5 h-10 text-xs font-medium border-border/20">
                        {loading ? <Loader className="animate-spin" /> : <><FileDown className="mr-2 size-3" /> Export Report</>}
                      </Button>
                    )}
                  </PDFDownloadLink>
                </div>

                <Carousel setApi={setApi} className="w-full">
                  {/* Carousel Navigation */}
                  <div className="absolute -top-20 right-0 flex items-center gap-2">
                    <CarouselPrevious className="static translate-y-0 translate-x-0 size-10 border border-border/20 text-muted-foreground/60 hover:text-foreground bg-transparent" />
                    <div className="text-xs font-bold text-muted-foreground w-12 text-center">
                      <span className="text-foreground">{activeAnalysisIndex + 1}</span> / {analyses.length}
                    </div>
                    <CarouselNext className="static translate-y-0 translate-x-0 size-10 border border-border/20 text-muted-foreground/60 hover:text-foreground bg-transparent" />
                  </div>


                  {/* Active Analysis Card */}
                  <CarouselContent>
                    {analyses.map((analysis, idx) => {
                      const persona = personas[idx];
                      if (!persona) return null;

                      return (
                        <CarouselItem key={analysis.id}>
                          <Card key={analysis.id} className="rounded-[2.5rem] border-border/10 bg-card/5 overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
                            <CardHeader className="p-8 md:p-12 border-b border-border/5">
                              <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
                                <div className="space-y-4 max-w-xl">
                                  <Badge variant="outline" className="rounded-full px-3 text-primary border-primary/20 bg-primary/5">Analyzing</Badge>
                                  <CardTitle className="text-3xl font-medium tracking-tight leading-none text-foreground">{persona.name}’s Review</CardTitle>
                                  <CardDescription className="text-lg font-light text-muted-foreground">{persona.occupation}</CardDescription>
                                </div>
                                <div className="flex items-center gap-4">
                                  <Button
                                    variant="outline"
                                    className="rounded-full px-8 h-12 text-xs font-medium border-border/20 hover:bg-white/[0.02]"
                                    disabled={!!predictingGazeId || !!analysis.gazePoints}
                                    onClick={() => handlePredictGaze(analysis, persona)}
                                  >
                                    {predictingGazeId === analysis.id ? <Loader className="animate-spin" /> : <Target className="mr-2 size-4" />}
                                    See what they saw
                                  </Button>
                                  <Button
                                    variant="premium"
                                    className="rounded-full px-8 h-12 text-xs font-medium shadow-none"
                                    onClick={() => setActiveChat({ persona, analysis })}
                                  >
                                    <MessageSquare className="mr-2 size-4" />
                                    Chat with them
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-8 md:p-12 space-y-16">
                              {/* Qualitative Insight */}
                              <div className="relative pl-12 border-l border-primary/30">
                                <span className="absolute left-0 top-0 text-[10px] font-bold uppercase tracking-widest text-primary vertical-rl -translate-x-[200%] mt-2">First Impression</span>
                                <p className="text-2xl md:text-3xl italic font-light text-foreground leading-relaxed tracking-tight">
                                  &ldquo;{analysis.gutReaction}&rdquo;
                                </p>
                              </div>

                              {/* Metric Array */}
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 pt-8">
                                <MetricBlock label="Easy to use?" value={analysis.scores.clarity} />
                                <MetricBlock label="Worth it?" value={analysis.scores.valuePerception} />
                                <MetricBlock label="Trust" value={analysis.scores.trust} />
                                <MetricBlock label="Likely to buy" value={analysis.scores.likelihoodToBuy} highlight />
                              </div>

                              {/* Visualization Area */}
                              <div className="space-y-8 pt-8">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/70">What they looked at</h4>
                                </div>
                                {analysis.gazePoints ? (
                                  <div className="rounded-3xl overflow-hidden border border-border/10 shadow-2xl">
                                    <GazeOverlay
                                      screenshotBase64={analysis.screenshotBase64}
                                      gazePoints={analysis.gazePoints}
                                    />
                                  </div>
                                ) : (
                                  <div className="relative rounded-[2rem] overflow-hidden border border-border/10 bg-muted/20 group">
                                    <img
                                      src={`data:image/jpeg;base64,${analysis.screenshotBase64}`}
                                      alt="UI Trace"
                                      className="w-full opacity-20 transition-opacity duration-1000 group-hover:opacity-40"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm group-hover:backdrop-blur-none transition-all">
                                      <Button
                                        variant="outline"
                                        className="rounded-full h-14 px-12 border-border/40 bg-white/[0.05] hover:bg-white/[0.1] text-foreground font-medium"
                                        disabled={!!predictingGazeId}
                                        onClick={() => handlePredictGaze(analysis, persona)}
                                      >
                                        <Target className="mr-3 size-4" />
                                        See where they looked
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Detailed Findings */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 pt-12 border-t border-border/5">
                                <div className="space-y-12">
                                  <div className="space-y-8">
                                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/70 text-left">Executive Summary</h4>
                                    <div className="space-y-4">
                                      {analysis.thoughts
                                        .split('\n\n')
                                        .filter(p => p.trim())
                                        .map((p, pIdx) => (
                                          <p key={pIdx} className="text-muted-foreground leading-relaxed font-light text-lg">
                                            {p}
                                          </p>
                                        ))
                                      }
                                    </div>
                                  </div>

                                  {analysis.rawAnalysis && (
                                    <div className="space-y-6 pt-6 border-t border-border/5">
                                      <button
                                        onClick={() => setExpandedMonologueId(expandedMonologueId === analysis.id ? null : analysis.id)}
                                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary transition-colors group"
                                      >
                                        <BrainCircuit className="size-3" />
                                        {expandedMonologueId === analysis.id ? 'Hide Raw Monologue' : 'Read Raw Monologue'}
                                        <ChevronDown className={`size-3 transition-transform duration-300 ${expandedMonologueId === analysis.id ? 'rotate-180' : ''}`} />
                                      </button>

                                      {expandedMonologueId === analysis.id && (
                                        <div className="p-8 bg-white/[0.02] rounded-[2rem] border border-border/10 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                          <div className="flex items-center gap-3 mb-2">
                                            <div className="size-2 rounded-full bg-primary/40 animate-pulse" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Unfiltered Stream of Consciousness</span>
                                          </div>
                                          <div className="space-y-4">
                                            {analysis.rawAnalysis.split('\n\n').map((p, pIdx) => (
                                              <p key={pIdx} className="text-sm text-muted-foreground/60 leading-relaxed font-mono">
                                                {p}
                                              </p>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-8">
                                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/70 text-left">Confusing parts</h4>
                                  <div className="space-y-4">
                                    {analysis.risks.map((risk, idx) => (
                                      <div key={idx} className="flex gap-4 p-6 bg-white/[0.02] rounded-2xl border border-border/10 text-sm font-medium text-muted-foreground">
                                        <AlertCircle className="size-4 shrink-0 mt-0.5 text-primary/40" /> {risk}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Psychological DNA */}
                              <div className="space-y-8 pt-12 border-t border-border/5">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/70 text-left">Psychological Persona Profile</h4>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs text-primary"
                                    onClick={() => setShowPsychInfoId(persona.id)}
                                  >
                                    View Full Profile <ArrowRight className="ml-2 size-3" />
                                  </Button>
                                </div>
                                {/* Mini Radar */}
                                <div className="h-32 opacity-50">
                                  <PsychologicalRadar persona={persona} />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent></Carousel>
              </div>
            )
            }
          </TabsContent >
        </Tabs >

        {/* Global Overlays - Redesigned for calm focus */}
        < ThoughtfulDialog
          isOpen={!!analysisProgress}
          title="Analyzing Page"
          description="We're checking your website now."
          progress={getProgressPercentage()}
          onCancel={handleCancel}
        >
          <div className="space-y-10">
            {/* Sticky Live Feed Layout for Analysis */}
            {analysisProgress && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Left: Steps List */}
                <div className="space-y-10 overflow-y-auto pr-4">
                  {steps.map((step, idx) => (
                    <RefinedStep
                      key={step.id}
                      step={step}
                      isActive={step.id === analysisProgress?.step}
                      isDone={steps.findIndex(s => s.id === analysisProgress?.step) > idx}
                      // Remove screenshot from here, show it in the sticky col
                      streamingText={step.id === 'THINKING' ? combinedAnalysisStream : undefined}
                    />
                  ))}
                </div>

                {/* Right: Sticky Live Feed */}
                <div className="hidden lg:block relative">
                  <div className="sticky top-0 space-y-4">
                    {analysisProgress.screenshot && (
                      <div className="rounded-[1.5rem] overflow-hidden border border-border/10 shadow-2xl bg-black relative animate-in fade-in duration-700">
                        <img src={`data:image/jpeg;base64,${analysisProgress.screenshot}`} alt="Live Feed" className="w-full h-auto opacity-60" />

                        {/* Live Pulse */}
                        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                          <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">Live Feed</span>
                        </div>
                      </div>
                    )}
                    {(!analysisProgress.screenshot) && (
                      <div className="aspect-video rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3 opacity-30">
                          <Server className="size-8 animate-pulse" />
                          <span className="text-xs font-medium uppercase tracking-widest">Connecting...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Standard Layout for Persona Generation (No Sticky Feed Needed) */}
            {personaProgress && (
              <div className="space-y-10">
                {personaSteps.map((step, idx) => (
                  <RefinedStep
                    key={step.id}
                    step={step}
                    isActive={step.id === personaProgress?.step}
                    isDone={personaSteps.findIndex(s => s.id === personaProgress?.step) > idx}
                    subText={step.id === 'GENERATING_BACKSTORIES' && step.id === personaProgress?.step ? `Creating persona ${(personaProgress.completedCount || 0) + 1} of ${personaProgress.totalCount || 3}` : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </ThoughtfulDialog >

        <ThoughtfulDialog
          isOpen={!!personaProgress}
          title="Creating Personas"
          description="Making each persona unique based on your description."
          progress={getPersonaProgressPercentage()}
          onCancel={handleCancel}
        >
          <div className="space-y-10">
            {personaSteps.map((step, idx) => (
              <RefinedStep
                key={step.id}
                step={step}
                isActive={step.id === personaProgress?.step}
                isDone={personaSteps.findIndex(s => s.id === personaProgress?.step) > idx}
                subText={step.id === 'GENERATING_BACKSTORIES' && step.id === personaProgress?.step ? `Creating persona ${(personaProgress.completedCount || 0) + 1} of ${personaProgress.totalCount || 3}` : undefined}
              />
            ))}

            {/* Live Persona Grid Preview */}
            {personaProgress?.step === 'BRAINSTORMING_PERSONAS' && personaProgress.personas && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 animate-in fade-in duration-700">
                {personaProgress.personas.map((p: Partial<Persona>, i: number) => (
                  <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
                    <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary mb-2">
                      {p.name ? p.name.charAt(0) : "?"}
                    </div>
                    <h4 className="font-medium text-sm text-foreground">{p.name || "Generating..."}</h4>
                    <p className="text-xs text-muted-foreground">{p.occupation || "Defining role..."}</p>
                    <div className="flex gap-1 mt-2">
                      {p.personalityTraits?.slice(0, 3).map((t: string, ti: number) => (
                        <span key={ti} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/60">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ThoughtfulDialog>

        {
          activeChat && (
            <PersonaChat
              persona={activeChat.persona}
              analysis={activeChat.analysis}
              isOpen={!!activeChat}
              onOpenChange={(open) => !open && setActiveChat(null)}
            />
          )
        }
      </div >
    </div >
  )
}

function PsychologicalRadar({ persona }: { persona: Persona }) {
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
    <div className="flex flex-col items-center justify-center p-4 bg-white/[0.01] rounded-[2rem] border border-white/[0.03]">
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
            strokeDasharray="2,2"
            className="opacity-10"
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
              className="opacity-10"
            />
          );
        })}

        {/* The DNA Polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(var(--primary-rgb), 0.15)"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-primary transition-all duration-1000 ease-in-out"
        />

        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2"
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
              className="text-[8px] font-bold fill-muted-foreground/70 uppercase tracking-widest"
            >
              {t.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function PsychologicalProfile({ persona }: { persona: Persona }) {
  const [isBackstoryExpanded, setIsBackstoryExpanded] = useState(false);

  const traits = [
    { label: 'Conscientiousness', value: persona.conscientiousness, desc: 'Chaotic vs Meticulous' },
    { label: 'Neuroticism', value: persona.neuroticism, desc: 'Sturdy vs Risk-Averse' },
    { label: 'Openness', value: persona.openness, desc: 'Traditional vs Early Adopter' },
    { label: 'Cognitive Reflex', value: persona.cognitiveReflex, desc: 'System 1 vs System 2' },
    { label: 'Tech Fluency', value: persona.technicalFluency, desc: 'Novice vs Expert' },
    { label: 'Price Sensitivity', value: persona.economicSensitivity, desc: 'Abundance vs Budget' },
  ];

  const backstory = persona.backstory || '';
  const backstoryParagraphs = backstory.split('\n\n');
  const previewBackstory = backstoryParagraphs[0] || '';

  return (
    <div className="flex flex-col gap-12">
      <div className="space-y-8">
        <PsychologicalRadar persona={persona} />

        {backstory && (
          <div className="space-y-4 px-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-0.5 w-6 bg-primary/30" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Backstory</span>
            </div>
            <div className="relative">
              <p className={`text-base text-muted-foreground font-light leading-relaxed transition-all duration-500 ${isBackstoryExpanded ? '' : 'line-clamp-3'}`}>
                {isBackstoryExpanded ? backstory : previewBackstory}
              </p>
              {backstoryParagraphs.length > 1 && (
                <button
                  onClick={() => setIsBackstoryExpanded(!isBackstoryExpanded)}
                  className="mt-4 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/70 transition-colors flex items-center gap-1.5"
                >
                  {isBackstoryExpanded ? (
                    <>Show Less <ChevronDown className="size-3 rotate-180" /></>
                  ) : (
                    <>Read Full Story <ChevronDown className="size-3" /></>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6 pt-6 border-t border-border/5">
        <div className="grid grid-cols-1 gap-y-7">
          {traits.map((trait) => (
            <div key={trait.label} className="space-y-3 group/trait">
              <div className="flex justify-between items-baseline">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 transition-colors group-hover/trait:text-primary">{trait.label}</span>
                <span className="text-xs font-mono text-primary font-bold">{trait.value}%</span>
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/40 transition-all duration-1000 group-hover/trait:bg-primary/60"
                  style={{ width: `${trait.value}%` }}
                />
              </div>
              <div className="flex justify-between items-center opacity-60 group-hover/trait:opacity-100 transition-opacity">
                <span className="text-[8px] text-muted-foreground/90 font-bold uppercase tracking-[0.15em]">{trait.desc.split(' vs ')[0]}</span>
                <span className="text-[8px] text-muted-foreground/90 font-bold uppercase tracking-[0.15em]">{trait.desc.split(' vs ')[1]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricBlock({ label, value, highlight }: { label: string, value: number, highlight?: boolean }) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/80">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-5xl font-light tracking-tighter ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</span>
        <span className="text-xs font-bold text-muted-foreground/30">/ 10</span>
      </div>
      <div className="h-1 w-12 bg-border/20 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-1000 ${highlight ? 'bg-primary' : 'bg-muted-foreground/40'}`} style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  )
}

function ThoughtfulDialog({ isOpen, title, description, progress, onCancel, children }: { isOpen: boolean, title: string, description: string, progress: number, onCancel: () => void, children: React.ReactNode }) {
  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent className="sm:max-w-2xl w-[calc(100%-2rem)] max-h-[85vh] rounded-[2.5rem] border-border/10 bg-background/95 backdrop-blur-3xl overflow-hidden flex flex-col p-0 shadow-2xl" onInteractOutside={(e) => e.preventDefault()}>
        <div className="absolute top-0 left-0 w-full h-1 bg-white/[0.03] z-[60]">
          <div className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
        </div>

        <div className="p-10 md:p-12 pb-8 border-b border-white/5 bg-background/50 backdrop-blur-md relative z-50">
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <DialogTitle className="text-2xl font-medium tracking-tight text-foreground">{title}</DialogTitle>
              <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full size-10 hover:bg-white/5 opacity-40 hover:opacity-100 transition-all">
                <X className="size-5" />
              </Button>
            </div>
            <DialogDescription className="text-muted-foreground font-medium text-base">{description}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-10 md:p-12 space-y-12 custom-scrollbar">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RefinedStep({ step, isActive, isDone, screenshot, subText, streamingText }: { step: any, isActive: boolean, isDone: boolean, screenshot?: string, subText?: string, streamingText?: string }) {
  return (
    <div className={`flex gap-10 transition-all duration-700 ${isActive || isDone ? 'opacity-100 translate-x-0' : 'opacity-20 -translate-x-2'}`}>
      <div className={`mt-2 size-2.5 rounded-full ring-[6px] transition-all duration-1000 ${isActive ? 'bg-primary ring-primary/20 animate-pulse' : isDone ? 'bg-emerald-500 ring-emerald-500/10' : 'bg-border ring-transparent'}`} />
      <div className="flex-1">
        <p className={`text-lg font-medium tracking-tight mb-1.5 ${isActive || isDone ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
        <p className="text-sm text-muted-foreground/60 font-medium tracking-tight leading-relaxed">{subText || step.description}</p>
        {isActive && screenshot && (
          <div className="mt-10 rounded-[2rem] overflow-hidden border border-border/10 shadow-3xl aspect-video bg-black relative group/screenshot">
            <img src={`data:image/jpeg;base64,${screenshot}`} alt="Trace Feed" className="object-cover w-full h-full opacity-50 group-hover:opacity-70 transition-opacity duration-1000" />
            <div className="absolute bottom-6 right-6">
              <Badge variant="outline" className="bg-black/80 backdrop-blur-xl rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest border-white/10 text-muted-foreground/80 shadow-2xl">Live Feed</Badge>
            </div>
          </div>
        )}
        {isActive && (step.id === 'THINKING' || step.id === 'BRAINSTORMING_PERSONAS' || step.id === 'GENERATING_BACKSTORIES') && streamingText && (
          <div key={streamingText.length > 0 ? 'active' : 'inactive'} className="mt-8 p-6 rounded-2xl bg-white/[0.03] border border-white/10 font-mono text-[11px] text-primary/80 overflow-hidden break-words max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner relative group/stream animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-2 mb-4 opacity-50">
              <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span className="uppercase tracking-[0.2em] text-[9px] font-bold">
                {step.id === 'BRAINSTORMING_PERSONAS' ? 'Synthesizing Profiles' : step.id === 'GENERATING_BACKSTORIES' ? 'Writing Narrative' : 'Incoming Thoughts'}
              </span>
            </div>
            <div className="leading-relaxed opacity-90 whitespace-pre-wrap transition-opacity duration-300">
              {streamingText.length > 3000
                ? `...[truncated for performance]\n\n${streamingText.slice(-2500)}`
                : streamingText}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  )
}
