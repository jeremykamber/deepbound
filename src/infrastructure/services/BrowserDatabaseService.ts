import { get, set, update, keys } from 'idb-keyval'
import { DatabaseServicePort } from '../../domain/ports/DatabaseServicePort'

/**
 * BrowserDatabaseService implements DatabaseServicePort using IndexedDB
 * via idb-keyval for better reliability and higher storage limits than localStorage.
 * 
 * It also requests persistent storage from the browser to prevent data loss 
 * when the device is low on space.
 */
export class BrowserDatabaseService implements DatabaseServicePort {
  constructor() {
    this.requestPersistence()
  }

  private async requestPersistence() {
    if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        const granted = await navigator.storage.persist();
        console.log(`[BrowserDatabaseService] Storage persistence granted: ${granted}`);
      }
    }
  }

  async insert(table: string, data: any): Promise<void> {
    await update(table, (val: any[] | undefined) => {
      const items = val || []
      return [...items, data]
    })
  }

  async update(table: string, id: string, data: any): Promise<void> {
    await update(table, (val: any[] | undefined) => {
      const items = val || []
      return items.map((item: any) => item.id === id ? data : item)
    })
  }

  async find(table: string, query: any): Promise<any> {
    const items = await get<any[]>(table) || []
    if (query.email) {
      return items.find((item: any) => item.email === query.email) || null
    }
    if (query.id) {
      return items.find((item: any) => item.id === query.id) || null
    }
    return null
  }

  async findAll(table: string): Promise<any[]> {
    return await get<any[]>(table) || []
  }

  async delete(table: string, id: string): Promise<void> {
    await update(table, (val: any[] | undefined) => {
      const items = val || []
      return items.filter((item: any) => item.id !== id)
    })
  }
}
