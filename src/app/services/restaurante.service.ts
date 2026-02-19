import { Injectable } from '@angular/core';
import { Restaurante } from '../models/restaurante.model';

@Injectable({
  providedIn: 'root',
})
export class RestauranteService {
  private storageKey = 'restaurante_activo';

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  setRestaurante(restaurante: Restaurante) {
    if (!this.isBrowser()) return;

    localStorage.setItem(this.storageKey, JSON.stringify(restaurante));
  }

  getRestaurante(): Restaurante | null {
    // ANTES: if (!this.isBrowser()) return null;
    // AHORA: Solo muestra advertencia pero no retorna null
    if (!this.isBrowser()) {
      console.warn('⚠️ isBrowser() = false, pero continuaremos...');
      // No hacemos return, continuamos
    }

    // 1️⃣ PRIMERO intentar con el objeto completo
    const data = localStorage.getItem(this.storageKey);
    
    if (data) {
      console.log('✅ Usando restaurante_activo completo');
      return JSON.parse(data);
    }

    // 2️⃣ Solo si no existe, usar el ID
    const restauranteId = localStorage.getItem('restaurante_id');
    
    if (restauranteId) {
      console.log('⚠️ Usando solo ID, datos incompletos');
      return {
        id: Number(restauranteId),
        nombre: 'Restaurante Activo',
        direccion: '',
        telefono: '',
        activo: true,
      };
    }

    // 3️⃣ Fallback demo
    console.log('🔧 Creando restaurante demo');
    const restauranteDemo: Restaurante = {
      id: 1,
      nombre: 'Restaurante Demo',
      direccion: 'Calle 123',
      telefono: '3001234567',
      activo: true,
    };

    this.setRestaurante(restauranteDemo);
    return restauranteDemo;
  }
}