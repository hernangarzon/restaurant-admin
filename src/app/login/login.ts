import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { RestauranteService } from '../services/restaurante.service';
import { Restaurante } from '../models/restaurante.model';
import { HttpErrorResponse } from '@angular/common/http';


@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private auth: AuthService,
    private restauranteService: RestauranteService,
    private router: Router,
    private cdr: ChangeDetectorRef // AÑADIR ESTO
  ) {}

  onLogin() {
    // Validación básica
    if (!this.username.trim() || !this.password.trim()) {
      this.error = 'Por favor, completa todos los campos';
      this.cdr.detectChanges(); // Forzar actualización
      return;
    }

    // Resetear estado
    this.error = '';
    this.loading = true;
    this.cdr.detectChanges(); // Forzar actualización del loading

    console.log('🔐 Intentando login con:', this.username);

    this.auth.login(this.username.trim(), this.password.trim()).subscribe({
      next: (res: any) => {
        console.log('✅ Respuesta exitosa:', res);
        this.loading = false;
        this.cdr.detectChanges(); // Forzar actualización
        
        if (res && res.token) {
          this.auth.saveSessionData(this.username, res.token, res.restauranteId);
          
          if (typeof window !== 'undefined') {
            if (res.adminId) localStorage.setItem('admin_id', res.adminId.toString());
            if (res.restauranteNombre) localStorage.setItem('restaurante_nombre', res.restauranteNombre);
          }

          const restaurante: Restaurante = {
            id: res.restauranteId,
            nombre: res.restauranteNombre || 'Restaurante',
            direccion: '',
            telefono: '',
            activo: true,
          };
          this.restauranteService.setRestaurante(restaurante);

          this.router.navigate(['/admin/dashboard']);
        } 
        else {
          this.error = 'Respuesta inesperada del servidor';
          this.cdr.detectChanges(); // Forzar actualización del error
        }
      },
      error: (err: HttpErrorResponse) => {
        console.log('❌ Error HTTP:', err.status, err.error);
        
        this.loading = false; // Esto debería funcionar
        
        if (err.status === 401) {
          this.error = err.error || 'Usuario o contraseña incorrectos';
        } 
        else if (err.status === 0) {
          this.error = 'No se pudo conectar al servidor';
        }
        else {
          this.error = `Error: ${err.status}`;
        }
        
        // FORZAR ACTUALIZACIÓN DE LA UI
        this.cdr.detectChanges();
        console.log('🔄 UI actualizada, loading:', this.loading, 'error:', this.error);
      }
    });
  }
}