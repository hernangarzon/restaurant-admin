import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MenuDia } from '../models/menu-dia.model';
import { API_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class MenuDiaService {

  private baseUrl = API_URL;

  constructor(private http: HttpClient) {}

  listar(restauranteId: number) {
    return this.http.get<MenuDia[]>(`${this.baseUrl}/${restauranteId}`);
  }

  guardar(restauranteId: number, menu: MenuDia) {
    return this.http.post<MenuDia>(`${this.baseUrl}/${restauranteId}`, menu);
  }

  cambiarEstado(menuDiaId: number, activo: boolean) {
    return this.http.patch(
      `${this.baseUrl}/${menuDiaId}/estado?activo=${activo}`,
      {}
    );
  }
}
