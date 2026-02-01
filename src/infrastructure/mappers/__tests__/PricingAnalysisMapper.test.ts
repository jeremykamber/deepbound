import { describe, it, expect } from 'vitest'
import { dbToPricingAnalysis, pricingAnalysisToDb } from '../PricingAnalysisMapper'

describe('PricingAnalysisMapper', () => {
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

  it('should map db record to entity', () => {
    const db = {
      id: '1',
      url: 'https://example.com/pricing',
      screenshotBase64: 'base64data',
      thoughts: 'Some thoughts',
      clarity: 8,
      valuePerception: 7,
      trust: 9,
      likelihoodToBuy: 6,
      risks: ['Risk 1']
    }
    const entity = dbToPricingAnalysis(db)
    expect(entity.id).toBe('1')
    expect(entity.scores.clarity).toBe(8)
  })

  it('should map entity to db record', () => {
    const db = pricingAnalysisToDb(mockAnalysis)
    expect(db.id).toBe('1')
    expect(db.clarity).toBe(8)
  })
})
