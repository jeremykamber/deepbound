'use client'

import React from 'react'
import { Persona } from '@/domain/entities/Persona'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Info, ChevronDown, MessageSquare } from 'lucide-react'

interface PersonaCardProps {
  persona: Partial<Persona>
  showChatButton?: boolean
}

export const PartialPersonaCard: React.FC<PersonaCardProps> = ({
  persona,
  showChatButton = true
}) => {
  return (
    <Card className="rounded-lg border-white/10 bg-white/[0.03] group transition-colors duration-200 overflow-hidden relative">
      <CardHeader className="px-5 pb-2 pt-5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary/60">
            <Users className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold tracking-tight mb-0.5">{persona.name}</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">{persona.occupation}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4 space-y-4">
        <div
          className="group/about relative border border-white/5 rounded-lg p-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-200 cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 group-hover/about:text-primary transition-colors">
              Backstory
            </span>
            <ChevronDown className="size-3 text-muted-foreground/20 group-hover/about:text-primary transition-colors" />
          </div>

          <div className="grid grid-rows-[0fr] group-hover/about:grid-rows-[1fr] transition-[grid-template-rows] duration-200 ease-out">
            <div className="overflow-hidden">
              <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 line-clamp-2">
                {persona.backstory}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
