import Link from "next/link";
import { BrainCircuit, Zap, Target, ShieldCheck, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_PERSONAS } from "@/domain/entities/MockPersonas";
import { PersonaCard } from "@/ui/components/dashboard/shared/PersonaCard";
import { PersonaChatInterface } from "@/ui/components/dashboard/shared/PersonaChatInterface";

export default function MarketingPage() {
  return (
    <div className="bg-background text-foreground antialiased selection:bg-primary/10">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-40 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/[0.03] blur-[160px] rounded-full" />
        </div>

        <div className="container mx-auto px-6 max-w-7xl">
          <div className="max-w-4xl">
            <Badge variant="outline" className="mb-10 px-4 py-1.5 border-white/10 text-muted-foreground font-bold tracking-[0.2em] uppercase text-[10px] bg-white/[0.02] rounded-md">
              Derived from UC Berkeley Research
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-[5.5rem] font-bold tracking-tight mb-8 md:mb-10 leading-[0.95] text-foreground">
              User testing. <br />
              <span className="text-muted-foreground/40">Without the </span> <br />
              actual users.
            </h1>

            <p className="max-w-xl text-lg md:text-xl text-muted-foreground/60 mb-12 leading-relaxed font-medium tracking-tight antialiased">
              Stop guessing why your pricing page is failing. DeepBound uses 2,500-word backstories to simulate real customers who think, calculate, and buy—instantly.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/dashboard">
                <Button variant="premium" size="lg" className="rounded-lg px-8 h-14 group font-bold uppercase tracking-widest text-[11px]">
                  Run a Pricing Audit <ArrowRight className="ml-2 h-3.5 w-3.5 opacity-40 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="ghost" size="lg" className="rounded-lg px-8 h-14 text-muted-foreground hover:text-white font-bold uppercase tracking-widest text-[11px]">
                  How it works
                </Button>
              </Link>
            </div>
          </div>

          {/* Product Preview - Precise & Technical */}
          <div className="mt-32 relative group">
            <div className="relative rounded-xl border border-white/10 bg-white/[0.01] overflow-hidden shadow-2xl transition-all duration-300">
              <div className="h-10 border-b border-white/5 flex items-center px-6 gap-3 bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="size-1.5 rounded-full bg-white/10" />
                  <div className="size-1.5 rounded-full bg-white/10" />
                  <div className="size-1.5 rounded-full bg-white/10" />
                </div>
                <div className="flex-1 text-center text-[9px] text-muted-foreground/30 font-bold tracking-[0.4em] uppercase">The Decision Core: Real Resident Personas</div>
              </div>
              <div className="p-6 md:p-12 bg-black/40">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {MOCK_PERSONAS.map((persona) => (
                    <PersonaCard
                      key={persona.id}
                      persona={persona}
                      showChatButton={false}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Persona Chat Section - 1:1 Representation */}
      <section className="py-24 border-y border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-8">
              <Badge variant="outline" className="rounded-md border-primary/20 bg-primary/5 text-primary tracking-widest uppercase text-[9px] font-bold">Live Simulation</Badge>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]">
                Interview your buyers. <br />
                <span className="text-muted-foreground/40 italic">Hear the unfiltered truth.</span>
              </h2>
              <p className="text-muted-foreground/60 text-base leading-relaxed max-w-md font-medium">
                Don't just look at numbers. Open a direct line to your persona's internal monologue. Ask Sarah why she's hesitant, or what David thinks about your enterprise tier.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-3">
                  {MOCK_PERSONAS.map((p, i) => (
                    <div key={i} className="size-10 rounded-full border-2 border-background bg-zinc-800 flex items-center justify-center text-[10px] font-bold ring-2 ring-white/5">
                      {p.name.charAt(0)}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Simulation active for 3 core personas</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full -z-10" />
              <div className="rounded-xl border border-white/10 bg-background shadow-3xl overflow-hidden h-[500px] md:h-[600px] flex flex-col transform-gpu">
                <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary/60">
                      <Users className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{MOCK_PERSONAS[0].name}</p>
                      <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">Live Interview</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="rounded-md border-emerald-500/30 text-emerald-500 bg-emerald-500/10 font-bold tracking-widest text-[8px] uppercase">Active Session</Badge>
                </div>
                <div className="flex-1 overflow-hidden">
                  <PersonaChatInterface persona={MOCK_PERSONAS[0]} analysis={null} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - High Density Performance */}
      <section id="features" className="py-40 border-t border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
            <div className="space-y-8">
              <Badge variant="outline" className="rounded-md border-primary/20 bg-primary/5 text-primary tracking-widest uppercase text-[9px] font-bold">Protocol</Badge>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]">
                30 days of focus groups. <br />
                <span className="text-muted-foreground/40 italic">Synthesized in 30 seconds.</span>
              </h2>
              <p className="text-muted-foreground/60 text-base leading-relaxed max-w-md font-medium">
                Generic bots guess. DeepBound agents possess real memories, specific budgets, and career pressures that drive their buying decisions.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
              <FeatureItem
                icon={<BrainCircuit className="size-4" />}
                title="2,500-Word Backstories"
                description="Our agents aren't just 'personas'. They have 2,500-word life stories, making them 54% more accurate than standard AI."
              />
              <FeatureItem
                icon={<Target className="size-4" />}
                title="Watch Them Calculate ROI"
                description="See the mental trade-offs your buyers make between your feature list and their actual quarterly budget."
              />
              <FeatureItem
                icon={<Zap className="size-4" />}
                title="In-Depth Interviews"
                description="Interview your audience. Ask Sarah why she hesitated at checkout, and get an answer based on her simulated life story."
              />
              <FeatureItem
                icon={<ShieldCheck className="size-4" />}
                title="UC Berkeley Foundation"
                description="Our methodology is built on the 'Deep Binding' framework, ensuring agents remain consistent during complex audits."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Research Stats - Professional Grid */}
      <section id="research" className="py-24 border-y border-white/5 bg-black">
        <div className="container mx-auto px-6 max-w-5xl text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 py-12">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em] mb-4">Persona Fidelity</p>
              <h4 className="text-5xl font-bold text-primary tracking-tighter mb-2">+54%</h4>
              <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest leading-relaxed">Better than Zero-Shot</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em] mb-4">Context Depth</p>
              <h4 className="text-5xl font-bold text-primary tracking-tighter mb-2">2,500</h4>
              <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest leading-relaxed">Words per simulation</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em] mb-4">Audit Speed</p>
              <h4 className="text-5xl font-bold text-primary tracking-tighter mb-2">30s</h4>
              <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest leading-relaxed">From URL to insights</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Functional & Fast */}
      <section className="py-24 md:py-48">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h2 className="text-4xl md:text-7xl font-bold tracking-tight mb-8 md:mb-12 leading-[1.05]">Fine-tune your pricing. <br /> Before you launch.</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button variant="premium" size="lg" className="rounded-lg px-12 h-16 font-bold uppercase tracking-[0.2em] text-xs">
                Get Started
              </Button>
            </Link>
          </div>
          <p className="mt-10 text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.4em] antialiased">Instant behavioral feedback. No surveys required.</p>
        </div>
      </section>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group space-y-4">
      <div className="size-9 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center text-muted-foreground group-hover:text-primary/60 transition-colors duration-200">
        {icon}
      </div>
      <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
      <p className="text-xs text-muted-foreground/60 leading-relaxed font-medium">
        {description}
      </p>
    </div>
  );
}
