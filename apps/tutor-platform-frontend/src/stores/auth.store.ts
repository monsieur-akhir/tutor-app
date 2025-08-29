import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthService } from '../services';
import type { User, Profile } from '../services';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      profile: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await AuthService.login({ email, password });
          AuthService.saveAuthData(response);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
          // Charger le profil après connexion
          await get().loadProfile();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erreur de connexion',
            isLoading: false,
          });
        }
      },

      register: async (data: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await AuthService.register(data);
          AuthService.saveAuthData(response);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
          // Charger le profil après inscription
          await get().loadProfile();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erreur d\'inscription',
            isLoading: false,
          });
        }
      },

      logout: () => {
        AuthService.logout();
        set({
          user: null,
          profile: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      loadProfile: async () => {
        try {
          const profile = await AuthService.getProfile();
          set({ profile });
        } catch (error) {
          console.error('Erreur lors du chargement du profil:', error);
        }
      },

      updateProfile: async (data: Partial<Profile>) => {
        try {
          const profile = await AuthService.updateProfile(data);
          set({ profile });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erreur de mise à jour du profil',
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
