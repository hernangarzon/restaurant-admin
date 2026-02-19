// src/app/auth/auth.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { API_URL } from '../services/api.config';

export interface LoginRequest {
  telefonoWhatsapp: string;
  password: string;
}

export interface LoginResponse {
  adminId: number;
  restauranteId: number;
  restauranteNombre: string;
  token: string;
  // Propiedades opcionales para compatibilidad
  success?: boolean;
  message?: string;
}

export interface ChangePasswordRequest {
  adminId: number;
  passwordActual: string;
  nuevaPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = API_URL;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
  ) {}

  // ================= LOGIN =================
  login(telefonoWhatsapp: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { telefonoWhatsapp, password };
    return this.http.post<LoginResponse>(`${this.baseUrl}/admin/auth/login`, body);
  }

  // ================= LOGOUT =================
  logout(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('restaurante_id');

    console.log('🔒 Sesión cerrada');
  }

  // ================= CHECK LOGIN =================
  isLoggedIn(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const token = localStorage.getItem('token');
    return !!token;
  }

  getUsername(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem('username');
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem('token');
  }

  getRestauranteId(): number | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const id = localStorage.getItem('restaurante_id');
    return id ? Number(id) : null;
  }

  saveSessionData(
    username: string,
    token?: string,
    restauranteId?: number,
    adminId?: number,
    restauranteNombre?: string,
  ): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('username', username);

      if (token) localStorage.setItem('token', token);
      if (restauranteId) localStorage.setItem('restaurante_id', restauranteId.toString());

      // Nuevos parámetros opcionales
      if (adminId) localStorage.setItem('admin_id', adminId.toString());
      if (restauranteNombre) localStorage.setItem('restaurante_nombre', restauranteNombre);
    }
  }

  // ================= CAMBIO DE CONTRASEÑA =================
  changePassword(
    adminId: number,
    passwordActual: string,
    nuevaPassword: string,
  ): Observable<ChangePasswordResponse> {
    const body: ChangePasswordRequest = { adminId, passwordActual, nuevaPassword };
    return this.http.post<ChangePasswordResponse>(
      `${this.baseUrl}/admin/auth/cambiar-password`,
      body,
    );
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expMs = payload.exp * 1000;
      return Date.now() > expMs;
    } catch {
      return true;
    }
  }
}
