// src/app/pages/change-password/change-password.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.html',
  styleUrls: ['./change-password.css'],
})
export class ChangePasswordComponent {
  form: FormGroup;
  loading = false;
  successMsg = '';
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {
    this.form = this.fb.group({
      passwordActual: ['', [Validators.required]],
      nuevaPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmarPassword: ['', [Validators.required]],
    });
  }

  onSubmit() {
    this.errorMsg = '';
    this.successMsg = '';

    if (this.form.invalid) return;

    const { passwordActual, nuevaPassword, confirmarPassword } = this.form.value;

    if (nuevaPassword !== confirmarPassword) {
      this.errorMsg = 'Las nuevas contraseñas no coinciden';
      return;
    }

    this.loading = true;

    // El backend identifica al admin por el token de la sesión
    this.authService
      .changePassword(passwordActual, nuevaPassword)
      .subscribe({
        next: (res: string) => {
          this.loading = false;
          // res es el texto que devuelve el backend
          this.successMsg = res || 'Contraseña actualizada correctamente';
          this.form.reset();
        },
        error: (err) => {
          this.loading = false;
          if (err.status === 401) {
            this.errorMsg = 'Contraseña actual incorrecta';
          } else if (err.status === 404) {
            this.errorMsg = 'Ruta no encontrada en el servidor';
          } else {
            this.errorMsg = err.error || 'Error de conexión al servidor';
          }
          console.error('Error cambiar contraseña:', err);
        },
      });
  }
}
