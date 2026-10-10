import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';
import {
  Credenciales,
  NuevoRestaurante,
  ResumenAdmin,
  ResumenRestaurante,
} from '../models/superadmin.model';

@Injectable({ providedIn: 'root' })
export class SuperadminService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/admin/superadmin`;

  listarRestaurantes(): Observable<ResumenRestaurante[]> {
    return this.http.get<ResumenRestaurante[]>(`${this.url}/restaurantes`);
  }

  crearRestaurante(datos: NuevoRestaurante): Observable<Credenciales> {
    return this.http.post<Credenciales>(`${this.url}/restaurantes`, datos);
  }

  cambiarEstadoRestaurante(id: number, activo: boolean): Observable<void> {
    return this.http.put<void>(`${this.url}/restaurantes/${id}/estado`, null, { params: { activo } });
  }

  listarAdmins(restauranteId: number): Observable<ResumenAdmin[]> {
    return this.http.get<ResumenAdmin[]>(`${this.url}/restaurantes/${restauranteId}/admins`);
  }

  agregarAdmin(restauranteId: number, telefono: string, email: string): Observable<Credenciales> {
    return this.http.post<Credenciales>(`${this.url}/restaurantes/${restauranteId}/admins`, { telefono, email });
  }

  restablecerPassword(adminId: number): Observable<Credenciales> {
    return this.http.post<Credenciales>(`${this.url}/admins/${adminId}/restablecer-password`, null);
  }

  cambiarEstadoAdmin(adminId: number, activo: boolean): Observable<void> {
    return this.http.put<void>(`${this.url}/admins/${adminId}/estado`, null, { params: { activo } });
  }
}
