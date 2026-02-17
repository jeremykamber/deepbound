import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/ui/components/Logo";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/10 font-sans antialiased">
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Logo size={20} />
            <span className="text-base font-bold tracking-widest text-white uppercase text-[12px]">DeepBound</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-[10px] font-bold text-muted-foreground/60 hover:text-white transition-colors tracking-widest uppercase">How it works</Link>
            <Link href="#research" className="text-[10px] font-bold text-muted-foreground/60 hover:text-white transition-colors tracking-widest uppercase">The Science</Link>
            {/* <Link href="#pricing" className="text-[10px] font-bold text-muted-foreground/60 hover:text-white transition-colors tracking-widest uppercase">Pricing</Link> */}
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="premium" size="sm" className="rounded-lg px-5 h-8 font-bold text-[10px] uppercase tracking-widest">Get started</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-white/5 py-24 bg-background">
        <div className="container mx-auto px-6 max-w-7xl flex flex-col md:flex-row justify-between items-start gap-16">
          <div className="space-y-6 max-w-sm">
            <div className="flex items-center gap-3">
              <Logo size={20} />
              <span className="text-base font-bold tracking-widest text-white uppercase text-[12px]">DeepBound</span>
            </div>
            <p className="text-xs text-muted-foreground/40 leading-relaxed font-medium">
              Skip 4 weeks of user testing. Get instant feedback from high-fidelity behavioral agents. Based on Deep Binding research.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-xs text-muted-foreground/60 hover:text-white transition-colors font-medium">Features</Link></li>
                <li><Link href="#" className="text-xs text-muted-foreground/60 hover:text-white transition-colors font-medium">Pricing</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">Company</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-xs text-muted-foreground/60 hover:text-white transition-colors font-medium">Research</Link></li>
                <li><Link href="#" className="text-xs text-muted-foreground/60 hover:text-white transition-colors font-medium">About</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-xs text-muted-foreground/60 hover:text-white transition-colors font-medium">Privacy</Link></li>
                <li><Link href="#" className="text-xs text-muted-foreground/60 hover:text-white transition-colors font-medium">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-6 max-w-7xl mt-24 pt-8 border-t border-white/5">
          <p className="text-[10px] text-muted-foreground/20 font-bold uppercase tracking-widest">© {new Date().getFullYear()} DeepBound AI. Built for designers by researchers.</p>
        </div>
      </footer>
    </div>
  );
}
