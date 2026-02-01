import { TaskRepositoryPort } from '../../domain/ports/TaskRepositoryPort'
import { Task } from '../../domain/entities/Task'
import { DatabaseServicePort } from '../../domain/ports/DatabaseServicePort'

export class TaskRepositoryImpl implements TaskRepositoryPort {
  constructor(private db: DatabaseServicePort) { }

  async saveTask(task: Task): Promise<void> {
    await this.db.insert('tasks', task)
  }
  async getTasks(): Promise<Task[]> {
    return await this.db.findAll('tasks')
  }
  async updateTask(task: Task): Promise<void> {
    await this.db.update('tasks', task.id, task)
  }
  async deleteTask(id: string): Promise<void> {
    await this.db.delete('tasks', id)
  }
}
