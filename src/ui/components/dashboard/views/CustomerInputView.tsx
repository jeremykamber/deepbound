import React from 'react'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Zap, Loader, ArrowRight, FlaskConical } from 'lucide-react'

interface CustomerInputViewProps {
  customerProfile: string
  setCustomerProfile: (val: string) => void
  isPending: boolean
  error: string | null
  onGenerate: () => void
  onUseExamples: () => void
  onUseMockAnalysis: () => void
}

export const CustomerInputView: React.FC<CustomerInputViewProps> = ({
  customerProfile,
  setCustomerProfile,
  isPending,
  error,
  onGenerate,
  onUseExamples,
  onUseMockAnalysis
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-12 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Who is your product for?</label>
            <button
              onClick={onUseMockAnalysis}
              className="text-[10px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary transition-colors flex items-center gap-2"
            >
              <FlaskConical className="size-3" />
              View Sample Analysis
            </button>
          </div>
          <textarea
            placeholder="E.g., 'Bootstrapped founders aged 25-40, cost-conscious but value-driven...'"
            value={customerProfile}
            onChange={(e) => setCustomerProfile(e.target.value)}
            disabled={isPending}
            className="text-base w-full min-h-[160px] p-6 bg-white/[0.02] border border-white/10 rounded-lg focus:outline-none focus:border-white/20 transition-colors duration-200 font-normal antialiased leading-relaxed placeholder:text-muted-foreground/20 shadow-inner mt-4"
          />
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-lg border-destructive/20 bg-destructive/5 py-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-semibold ml-2">{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-6 border-t border-white/5">
          <div className="flex items-center gap-4 text-muted-foreground/60 w-full md:w-auto">
            <Zap className="size-5 text-primary/20 shrink-0" />
            <p className="text-xs font-bold uppercase tracking-widest leading-relaxed max-w-sm">Generate high-fidelity buyer personas</p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[280px]">
            <Button
              onClick={onGenerate}
              disabled={!customerProfile.trim() || isPending}
              variant="premium"
              size="lg"
              className="h-14 rounded-lg px-8 group transition-all"
            >
              {isPending ? (
                <span className="flex items-center gap-3">
                  <Loader className="h-4 w-4 animate-spin" />
                  Processing
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Build Audience
                  <ArrowRight className="size-4 ml-1 opacity-40" />
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground/40 hover:text-foreground font-bold uppercase tracking-widest text-[9px] transition-colors duration-200"
              onClick={onUseExamples}
            >
              <FlaskConical className="h-3 w-3 mr-2" />
              Try with examples
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
