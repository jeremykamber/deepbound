export interface DatabaseServicePort {
  insert(table: string, data: Record<string, unknown>): Promise<void>
  update(table: string, id: string, data: Record<string, unknown>): Promise<void>
  find(table: string, query: Record<string, unknown>): Promise<Record<string, unknown> | null>
  findAll(table: string): Promise<Record<string, unknown>[]>
  delete(table: string, id: string): Promise<void>
}
