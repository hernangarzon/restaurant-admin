import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';
import { Adicion } from '../models/adicion.model';

@Injectable({ providedIn: 'root' })
export class AdicionesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/admin/adiciones`;

  listar(): Observable<Adicion[]> {
    return this.http.get<Adicion[]>(this.url);
  }

  crear(adicion: Adicion): Observable<Adicion> {
    return this.http.post<Adicion>(this.url, adicion);
  }

  actualizar(id: number, adicion: Adicion): Observable<Adicion> {
    return this.http.put<Adicion>(`${this.url}/${id}`, adicion);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
