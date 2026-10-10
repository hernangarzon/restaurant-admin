import { Component, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, LoginResponse } from '../auth/auth.service';
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
    private router: Router,
    private cdr: ChangeDetectorRef, // AÑADIR ESTO
    route: ActivatedRoute,
  ) {
    // El interceptor redirige aquí con ?suspendido=1 cuando el restaurante fue suspendido
    if (route.snapshot.queryParamMap.has('suspendido')) {
      this.error = 'Este restaurante está suspendido. Comunícate con soporte.';
    }
  }

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

    this.auth.login(this.username.trim(), this.password.trim()).subscribe({
      next: (res: LoginResponse) => {
        this.loading = false;
        this.cdr.detectChanges(); // Forzar actualización
        
        if (res && res.token) {
          this.auth.iniciarSesion(res, this.username.trim());
          // Con contraseña temporal, primero debe cambiarla
          this.router.navigate([res.debeCambiarPassword ? '/admin/change-password' : '/admin/dashboard']);
        } 
        else {
          this.error = 'Respuesta inesperada del servidor';
          this.cdr.detectChanges(); // Forzar actualización del error
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false; // Esto debería funcionar
        
        if (err.status === 401) {
          this.error = err.error || 'Usuario o contraseña incorrectos';
        } 
        else if (err.status === 403 && err.error?.mensaje) {
          this.error = err.error.mensaje; // p. ej. restaurante suspendido
        }
        else if (err.status === 0) {
          this.error = 'No se pudo conectar al servidor';
        }
        else {
          this.error = `Error: ${err.status}`;
        }
        
        // FORZAR ACTUALIZACIÓN DE LA UI
        this.cdr.detectChanges();
      }
    });
  }
}