import { Injectable } from '@angular/core';
import { Restaurante } from '../models/restaurante.model';
import { AuthService } from '../auth/auth.service';

/**
 * Restaurante del admin con sesión iniciada. Sale siempre de la sesión (token del login):
 * sin sesión devuelve null, nunca un restaurante por defecto.
 */
@Injectable({
  providedIn: 'root',
})
export class RestauranteService {
  constructor(private auth: AuthService) {}

  getRestaurante(): Restaurante | null {
    const id = this.auth.getRestauranteId();
    if (!id) return null;

    return {
      id,
      nombre: this.auth.getRestauranteNombre() ?? 'Restaurante',
      activo: true,
    };
  }
}
