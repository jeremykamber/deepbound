import Link from "next/link";
import { BrainCircuit, Zap, Target, BarChart3, ShieldCheck, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MarketingPage() {
  return (
    <div className="bg-background text-foreground antialiased selection:bg-primary/10">
      {/* Hero Section */}
      <section className="relative pt-32 pb-48 overflow-hidden">
        {/* Subtle Depth - more focused on lighting than gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[160px] rounded-full" />
        </div>

        <div className="container mx-auto px-6 max-w-7xl">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-8 px-4 py-1.5 border-border/40 text-muted-foreground font-medium tracking-tight bg-white/[0.02] backdrop-blur-sm">
              Deep Binding Research v2.4
            </Badge>

            <h1 className="text-5xl md:text-7xl font-medium tracking-tight mb-8 leading-[1.1] text-foreground">
              Don’t build for patterns. <br />
              <span className="text-muted-foreground">Build for the person</span> <br />
              behind the pattern.
            </h1>

            <p className="max-w-xl text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">
              Stop guessing why users bounce. DeepBound replaces generic feedback with high-fidelity behavioral agents that think, remember, and feel your product.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Link href="/dashboard">
                <Button variant="premium" size="lg" className="rounded-full px-10 h-14 group">
                  Begin an Audit <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="ghost" size="lg" className="rounded-full px-10 h-14 text-muted-foreground hover:text-foreground">
                  Explore Capabilities
                </Button>
              </Link>
            </div>
          </div>

          {/* Product Preview - Minimalist and Intentional */}
          <div className="mt-40 relative group">
            <div className="relative rounded-2xl border border-border/40 bg-card/10 backdrop-blur-2xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] transition-all duration-700">
              <div className="h-12 border-b border-border/20 flex items-center px-6 gap-3 bg-white/[0.01]">
                <div className="flex gap-2">
                  <div className="size-2 rounded-full bg-border/40" />
                  <div className="size-2 rounded-full bg-border/40" />
                  <div className="size-2 rounded-full bg-border/40" />
                </div>
                <div className="flex-1 text-center text-[10px] text-muted-foreground font-medium tracking-[0.3em] uppercase opacity-40">Observation Deck</div>
              </div>
              <div className="p-12 md:p-24 bg-[#0a0a0a]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {[
                    { name: "Marcus", role: "Founding Engineer", status: "Critical Path Analysis" },
                    { name: "Sarah", role: "Head of Growth", status: "Value Proposition Scrutiny" },
                    { name: "David", role: "The Skeptical CTO", status: "Pricing Elasticity" }
                  ].map((persona, i) => (
                    <div key={i} className="group/card">
                      <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 text-primary transition-colors group-hover/card:bg-primary/20">
                        <Users className="size-5" />
                      </div>
                      <h3 className="text-xl font-medium text-foreground mb-1">{persona.name}</h3>
                      <p className="text-sm text-muted-foreground mb-6">{persona.role}</p>
                      <div className="space-y-4">
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-primary/40 rounded-full" style={{ width: `${70 + i * 10}%` }} />
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">{persona.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - White Space Focused */}
      <section id="features" className="py-48 border-t border-border/5">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-start">
            <div className="sticky top-32">
              <Badge variant="outline" className="mb-6 rounded-full px-4 py-1 text-primary border-primary/20 bg-primary/5">Capabilities</Badge>
              <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-8">
                Testing that lives <br />
                <span className="text-muted-foreground text-3xl md:text-4xl">inside the "Why".</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                Standard bots guess. DeepBound agents possess "Deeply Bound" identities—internally consistent memories, goals, and frustrations that drive their every move.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-16">
              <FeatureItem
                icon={<BrainCircuit className="size-5" />}
                title="Identity Anchoring"
                description="We bind AI decision models to rich narrative histories, eliminating the shallow, generic feedback common in automated testing."
              />
              <FeatureItem
                icon={<Target className="size-5" />}
                title="Cognitive Trace Maps"
                description="Don't just see where they click—see how they think. We map the logical and emotional steps that lead to high-value decisions."
              />
              <FeatureItem
                icon={<Zap className="size-5" />}
                title="Synthetic Feedback"
                description="Interview your audience at scale. Ask your agents why they hesitated on your pricing, and get a grounded, objective answer."
              />
              <FeatureItem
                icon={<ShieldCheck className="size-5" />}
                title="Behavioral Guardrails"
                description="Every simulation is validated against our proprietary behavioral fidelity framework to ensure rigorous, non-hallucinatory outcomes."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Research - Thoughtful Layout */}
      <section id="research" className="py-48 bg-white/[0.01]">
        <div className="container mx-auto px-6 max-w-5xl text-center">
          <Badge variant="outline" className="mb-12 rounded-full px-4 py-1 border-border/40">The Research</Badge>
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-16 italic text-muted-foreground leading-relaxed">
            "By simulating deep narrative backgrounds, <span className="text-foreground">persona fidelity increased by 54%</span> over standard prompting."
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left pt-12 border-t border-border/10">
            <div>
              <h4 className="text-4xl font-light mb-4 text-primary">54%</h4>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest leading-relaxed">Improvement in <br /> Persona Accuracy</p>
            </div>
            <div>
              <h4 className="text-4xl font-light mb-4 text-primary">5k</h4>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest leading-relaxed">Words per <br /> Identity Profile</p>
            </div>
            <div>
              <h4 className="text-4xl font-light mb-4 text-primary">2.4ms</h4>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest leading-relaxed">Avg. Decision <br /> Trace Latency</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Quiet and Meaningful */}
      <section className="py-48">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-12">Stop guessing. <br /> Start knowing.</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button variant="premium" size="lg" className="rounded-full px-12 h-16 text-lg">
                Enter Observation Deck
              </Button>
            </Link>
          </div>
          <p className="mt-12 text-muted-foreground font-medium italic text-lg">High-fidelity testing for the next generation of software.</p>
        </div>
      </section>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group space-y-4">
      <div className="size-10 rounded-xl bg-white/[0.03] border border-border/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors duration-500">
        {icon}
      </div>
      <h3 className="text-xl font-medium text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed max-w-sm">
        {description}
      </p>
    </div>
  );
}
