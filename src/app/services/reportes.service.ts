import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';
import { Reporte } from '../models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);

  /** Últimos `dias` días incluido hoy (7 a 90) */
  obtener(dias: number): Observable<Reporte> {
    return this.http.get<Reporte>(`${API_URL}/admin/reportes`, { params: { dias } });
  }
}
