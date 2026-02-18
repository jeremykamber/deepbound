import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from 'lucide-react'

interface ThoughtfulDialogProps {
  isOpen: boolean
  title: string
  description: string
  progress: number
  onCancel: () => void
  children: React.ReactNode
}

export const ThoughtfulDialog: React.FC<ThoughtfulDialogProps> = ({ isOpen, title, description, progress, onCancel, children }) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent showCloseButton={false} className="sm:max-w-2xl w-[95vw] md:w-full max-h-[85vh] rounded-xl border-2 border-white/20 bg-background overflow-hidden flex flex-col p-0 shadow-3xl transform-gpu antialiased cursor-default" onInteractOutside={(e) => e.preventDefault()}>
        <div className="absolute top-0 left-0 w-full h-1 bg-white/[0.05] z-[60]">
          <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
        </div>

        <div className="p-6 md:p-14 pb-8 border-b-2 border-white/10 bg-white/[0.02] relative z-50">
          <DialogHeader className="text-left sm:text-left">
            <div className="flex items-center justify-between mb-3 pr-8 md:pr-0">
              <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{title}</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                className="absolute right-4 top-4 md:right-8 md:top-8 size-8 flex items-center justify-center rounded-lg bg-white/[0.03] border-2 border-white/10 text-muted-foreground/60 transition-colors duration-200 hover:bg-white/10 hover:text-white z-[70]"
              >
                <X className="size-4" />
              </Button>
            </div>
            <DialogDescription className="text-muted-foreground/80 font-medium text-xs md:text-sm tracking-tight leading-relaxed max-w-md">{description}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-14 space-y-12 custom-scrollbar">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
