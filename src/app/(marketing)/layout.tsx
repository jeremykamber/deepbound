import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/10 font-sans antialiased">
      <header className="fixed top-0 w-full z-50 border-b border-border/5 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="size-8 rounded-lg bg-primary/20 border border-primary/20 flex items-center justify-center transition-all duration-500 group-hover:bg-primary/30">
              <BrainCircuit className="h-4 w-4 text-primary" />
            </div>
            <span className="text-lg font-medium tracking-tight text-foreground">
              DeepBound
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors tracking-tight">Capabilities</Link>
            <Link href="#research" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors tracking-tight">Research</Link>
            <Link href="#pricing" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors tracking-tight">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground px-4 font-medium h-9 rounded-full">Login</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="premium" size="sm" className="rounded-full px-5 h-9 font-medium">Get started</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border/5 py-24 bg-background">
        <div className="container mx-auto px-6 max-w-7xl flex flex-col md:flex-row justify-between items-start gap-16">
          <div className="space-y-6 max-w-sm">
            <div className="flex items-center gap-3">
              <BrainCircuit className="h-6 w-6 text-primary" />
              <span className="text-xl font-medium tracking-tight text-foreground">DeepBound</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Transitioning user research from generic data to high-fidelity behavioral simulation. Based on Deep Binding research.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Company</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Research</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-6 max-w-7xl mt-24 pt-8 border-t border-border/5">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} DeepBound AI. Built for designers by researchers.</p>
        </div>
      </footer>
    </div>
  );
}
