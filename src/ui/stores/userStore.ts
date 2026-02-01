import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { RegisterUserUseCase } from '../../application/usecases/RegisterUserUseCase'
import { LoginUserUseCase } from '../../application/usecases/LoginUserUseCase'
import { EditUserUseCase } from '../../application/usecases/EditUserUseCase'
import { DeleteUserUseCase } from '../../application/usecases/DeleteUserUseCase'
import { UserRepositoryImpl } from '../../infrastructure/adapters/UserRepositoryImpl'
import { BrowserDatabaseService } from '../../infrastructure/services/BrowserDatabaseService'
import { UserDTO } from '../../domain/dtos/UserDTO'
import { User } from '../../domain/entities/User'

const db = new BrowserDatabaseService()
const repo = new UserRepositoryImpl(db)
const registerUser = new RegisterUserUseCase(repo)
const loginUser = new LoginUserUseCase(repo)
const editUser = new EditUserUseCase(repo)
const deleteUser = new DeleteUserUseCase(repo)

interface UserState {
  user: User | null
  loading: boolean
  error: string | null
  register: (dto: UserDTO) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  edit: (user: User) => Promise<void>
  logout: () => void
  remove: (id: string) => Promise<void>
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,
      register: async (dto) => {
        set({ loading: true, error: null })
        try {
          await registerUser.execute(dto)
        } catch (e) {
          set({ error: (e as Error).message })
        } finally {
          set({ loading: false })
        }
      },
      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          await loginUser.execute(email, password)
          // For demo, just set user to found user
          const user = await repo.findUserByEmail(email)
          set({ user })
        } catch (e) {
          set({ error: (e as Error).message })
        } finally {
          set({ loading: false })
        }
      },
      edit: async (user) => {
        set({ loading: true, error: null })
        try {
          await editUser.execute(user)
          set({ user })
        } catch (e) {
          set({ error: (e as Error).message })
        } finally {
          set({ loading: false })
        }
      },
      logout: () => set({ user: null }),
      remove: async (id) => {
        set({ loading: true, error: null })
        try {
          await deleteUser.execute(id)
          set({ user: null })
        } catch (e) {
          set({ error: (e as Error).message })
        } finally {
          set({ loading: false })
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
