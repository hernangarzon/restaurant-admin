import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';
import { ConfiguracionRestaurante } from '../models/configuracion-restaurante.model';

@Injectable({ providedIn: 'root' })
export class ConfiguracionRestauranteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/admin/restaurante`;

  obtener(): Observable<ConfiguracionRestaurante> {
    return this.http.get<ConfiguracionRestaurante>(this.url);
  }

  guardar(config: ConfiguracionRestaurante): Observable<ConfiguracionRestaurante> {
    return this.http.put<ConfiguracionRestaurante>(this.url, config);
  }
}
