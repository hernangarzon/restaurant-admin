// src/app/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}

// Claves de la sesión en localStorage. AuthService es el único que las lee o escribe.
const CLAVES = {
  token: 'token',
  username: 'username',
  adminId: 'admin_id',
  restauranteId: 'restaurante_id',
  restauranteNombre: 'restaurante_nombre',
} as const;

// Claves de versiones anteriores; se borran al cerrar sesión
const CLAVES_ANTIGUAS = ['loggedIn', 'restaurante_activo'];

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = API_URL;

  constructor(private http: HttpClient) {}

  // ================= LOGIN =================
  login(telefonoWhatsapp: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { telefonoWhatsapp, password };
    return this.http.post<LoginResponse>(`${this.baseUrl}/admin/auth/login`, body);
  }

  iniciarSesion(res: LoginResponse, username: string): void {
    this.logout(); // nunca mezclar datos de una sesión anterior
    localStorage.setItem(CLAVES.token, res.token);
    localStorage.setItem(CLAVES.username, username);
    localStorage.setItem(CLAVES.adminId, String(res.adminId));
    localStorage.setItem(CLAVES.restauranteId, String(res.restauranteId));
    localStorage.setItem(CLAVES.restauranteNombre, res.restauranteNombre ?? '');
  }

  // ================= LOGOUT =================
  logout(): void {
    [...Object.values(CLAVES), ...CLAVES_ANTIGUAS].forEach((k) => localStorage.removeItem(k));
  }

  // ================= SESIÓN =================
  isLoggedIn(): boolean {
    return !!this.getToken() && !this.isTokenExpired();
  }

  getToken(): string | null {
    return localStorage.getItem(CLAVES.token);
  }

  getUsername(): string | null {
    return localStorage.getItem(CLAVES.username);
  }

  getRestauranteId(): number | null {
    const id = Number(localStorage.getItem(CLAVES.restauranteId));
    return id > 0 ? id : null;
  }

  getRestauranteNombre(): string | null {
    return localStorage.getItem(CLAVES.restauranteNombre) || null;
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // El payload del JWT es base64url (usa - y _ y no trae relleno); atob solo acepta base64
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
      return typeof payload.exp !== 'number' || Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  // ================= CAMBIO DE CONTRASEÑA =================
  // El backend identifica al admin por el token; responde texto plano
  changePassword(passwordActual: string, nuevaPassword: string): Observable<string> {
    return this.http.post(
      `${this.baseUrl}/admin/auth/cambiar-password`,
      { passwordActual, nuevaPassword },
      { responseType: 'text' },
    );
  }
}
