"use client"

import { useState } from "react"
import { Persona } from '@/domain/entities/Persona'
import { useAnalysisFlow } from '@/ui/hooks/useAnalysisFlow'
import { PersonaProfilePanel } from '@/components/custom/PersonaProfilePanel'
import { PersonaChat } from "../chat/PersonaChat"

interface AudienceViewProps {
  personas: Persona[]
  analysisFlow: ReturnType<typeof useAnalysisFlow>
}

export function AudienceView({ personas, analysisFlow }: AudienceViewProps) {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null)
  
  const getPersona = (id: string) => personas.find(p => p.id === id)
  const selectedPersona = selectedPersonaId ? getPersona(selectedPersonaId) : null

  return (
    <div className="flex flex-col gap-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2 border-b border-border/40 pb-6">
        <h2 className="text-2xl font-bold tracking-tight">Generated Audience</h2>
        <p className="text-muted-foreground text-sm">
          Review the personas synthesized from your target market description. You can also chat with them before running the simulation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {personas.map((persona) => (
          <PersonaProfilePanel 
            key={persona.id} 
            persona={{
              id: persona.id,
              name: persona.name,
              title: persona.occupation,
              description: persona.backstory || `A ${persona.age}-year-old ${persona.occupation} interested in ${persona.interests?.join(', ')}.`,
              traits: persona.personalityTraits
            }} 
            onChatClick={() => setSelectedPersonaId(persona.id)}
          />
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          disabled={analysisFlow.isPending || (!analysisFlow.pricingUrl && !analysisFlow.pricingImageBase64)}
          onClick={() => analysisFlow.handleAnalyzePricing(personas)}
          className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          {analysisFlow.isPending ? "Simulating Feedback..." : "Run Pricing Simulation"}
        </button>
      </div>
      
      {analysisFlow.error && (
        <div className="bg-destructive/10 text-destructive text-sm font-medium p-4 rounded-lg border border-destructive/20 mt-4">
          {analysisFlow.error}
        </div>
      )}

      {/* Chat Slide-Out */}
      {selectedPersona && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <button 
            type="button"
            className="absolute inset-0 w-full h-full cursor-default focus:outline-none" 
            onClick={() => setSelectedPersonaId(null)} 
            aria-label="Close Chat Overlay"
          />
          <PersonaChat 
            persona={selectedPersona} 
            onClose={() => setSelectedPersonaId(null)} 
          />
        </div>
      )}
    </div>
  )
}
