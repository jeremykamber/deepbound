import { describe, it, expect } from 'vitest'
import { validatePersona, stringifyPersona } from '../Persona'

describe('Persona entity', () => {
  const mockPersona = {
    id: '1',
    name: 'Test Persona',
    age: 30,
    occupation: 'Software Engineer',
    educationLevel: 'Bachelors',
    interests: ['coding'],
    goals: ['learning'],
    personalityTraits: ['logical'],
    backstory: 'A test backstory'
  }

  it('should validate a correct persona', () => {
    expect(validatePersona(mockPersona)).toBe(true)
  })

  it('should stringify a persona correctly', () => {
    const str = stringifyPersona(mockPersona)
    expect(str).toContain('Name: Test Persona')
    expect(str).toContain('Age: 30')
    expect(str).toContain('A test backstory')
  })
})
