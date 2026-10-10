// src/app/pages/change-password/change-password.ts
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

export const MIN_LONGITUD_PASSWORD = 8; // igual que el backend

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule],
  templateUrl: './change-password.html',
  styleUrls: ['./change-password.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly minLongitud = MIN_LONGITUD_PASSWORD;
  // Contraseña temporal: el AuthGuard no deja salir de esta página hasta cambiarla
  readonly obligatorio = signal(this.authService.debeCambiarPassword());
  readonly loading = signal(false);
  readonly successMsg = signal('');
  readonly errorMsg = signal('');

  readonly form = inject(NonNullableFormBuilder).group({
    passwordActual: ['', [Validators.required]],
    nuevaPassword: ['', [Validators.required, Validators.minLength(MIN_LONGITUD_PASSWORD)]],
    confirmarPassword: ['', [Validators.required]],
  });

  onSubmit() {
    this.errorMsg.set('');
    this.successMsg.set('');

    if (this.form.invalid) return;

    const { passwordActual, nuevaPassword, confirmarPassword } = this.form.getRawValue();

    if (nuevaPassword !== confirmarPassword) {
      this.errorMsg.set('Las nuevas contraseñas no coinciden');
      return;
    }

    this.loading.set(true);

    // El backend identifica al admin por el token de la sesión
    this.authService.changePassword(passwordActual, nuevaPassword).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.form.reset();
        this.authService.marcarPasswordCambiada();

        if (this.obligatorio()) {
          this.obligatorio.set(false);
          this.router.navigate(['/admin/dashboard']);
          return;
        }
        this.successMsg.set(res || 'Contraseña actualizada correctamente');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 401) {
          this.errorMsg.set('Contraseña actual incorrecta');
        } else if (err.status === 400 && typeof err.error === 'string') {
          this.errorMsg.set(err.error);
        } else {
          this.errorMsg.set('No se pudo cambiar la contraseña. Intenta de nuevo.');
        }
      },
    });
  }
}
