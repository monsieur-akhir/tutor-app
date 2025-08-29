import { api } from '../lib/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'parent' | 'tutor' | 'coach' | 'mentor' | 'admin';
  phone?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface Profile {
  id: string;
  userId: string;
  bio?: string;
  skills?: string[];
  languages?: string[];
  hourlyRate?: number;
  rating?: number;
  totalSessions?: number;
  location?: string;
  experience?: number;
  isAvailable?: boolean;
  subjects?: string[];
  education?: string[];
  certifications?: string[];
  createdAt: string;
  updatedAt: string;
}

export class AuthService {
  // Connexion
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  }

  // Inscription
  static async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  // Déconnexion
  static async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Nettoyer le stockage local
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('refresh_token');
    }
  }

  // Rafraîchir le token
  static async refreshToken(): Promise<{ token: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('Aucun refresh token disponible');
    }
    
    const response = await api.post<{ token: string }>('/auth/refresh', {
      refreshToken
    });
    return response.data;
  }

  // Obtenir le profil utilisateur
  static async getProfile(): Promise<Profile> {
    const response = await api.get<Profile>('/auth/profile');
    return response.data;
  }

  // Créer/Mettre à jour le profil
  static async updateProfile(profileData: Partial<Profile>): Promise<Profile> {
    const response = await api.put<Profile>('/auth/profile', profileData);
    return response.data;
  }

  // Vérifier si l'utilisateur est connecté
  static isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  // Obtenir l'utilisateur depuis le stockage local
  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Sauvegarder les données d'authentification
  static saveAuthData(authData: AuthResponse): void {
    localStorage.setItem('auth_token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
    if (authData.refreshToken) {
      localStorage.setItem('refresh_token', authData.refreshToken);
    }
  }

  // Obtenir le token d'authentification
  static getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}
