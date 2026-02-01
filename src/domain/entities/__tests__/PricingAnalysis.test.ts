import { describe, it, expect } from 'vitest'
import { validatePricingAnalysis } from '../PricingAnalysis'

describe('PricingAnalysis entity', () => {
  const mockAnalysis = {
    id: '1',
    url: 'https://example.com/pricing',
    screenshotBase64: 'base64data',
    thoughts: 'Some thoughts',
    scores: {
      clarity: 8,
      valuePerception: 7,
      trust: 9,
      likelihoodToBuy: 6
    },
    risks: ['Risk 1']
  }

  it('should validate a correct analysis', () => {
    expect(validatePricingAnalysis(mockAnalysis)).toBe(true)
  })

  it('should fail validation for missing fields', () => {
    const invalid = { id: '1' } as any
    expect(validatePricingAnalysis(invalid)).toBe(false)
  })
})
