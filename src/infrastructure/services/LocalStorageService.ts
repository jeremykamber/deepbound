import { DatabaseServicePort } from '../../domain/ports/DatabaseServicePort'

export class LocalStorageService implements DatabaseServicePort {
  async insert(table: string, data: Record<string, unknown>): Promise<void> {
    const items = JSON.parse(localStorage.getItem(table) || '[]')
    items.push(data)
    localStorage.setItem(table, JSON.stringify(items))
  }
  async update(table: string, id: string, data: Record<string, unknown>): Promise<void> {
    let items = JSON.parse(localStorage.getItem(table) || '[]')
    items = items.map((item: Record<string, unknown>) => item.id === id ? data : item)
    localStorage.setItem(table, JSON.stringify(items))
  }
  async find(table: string, query: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const items = JSON.parse(localStorage.getItem(table) || '[]')
    if (query.email) {
      return items.find((item: Record<string, unknown>) => item.email === query.email) || null
    }
    if (query.id) {
      return items.find((item: Record<string, unknown>) => item.id === query.id) || null
    }
    return null
  }
  async findAll(table: string): Promise<Record<string, unknown>[]> {
    return JSON.parse(localStorage.getItem(table) || '[]')
  }
  async delete(table: string, id: string): Promise<void> {
    let items = JSON.parse(localStorage.getItem(table) || '[]')
    items = items.filter((item: Record<string, unknown>) => item.id !== id)
    localStorage.setItem(table, JSON.stringify(items))
  }
}
