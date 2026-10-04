import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { API_URL } from '../services/api.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Adjuntar token solo a nuestra API, nunca a otros dominios
  const clonedReq = token && req.url.startsWith(API_URL)
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo cerrar sesión si es 401 en rutas protegidas
      // NO cerrar sesión en cambiar-password (puede ser password incorrecta)
      if (error.status === 401 && !req.url.includes('/cambiar-password')) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
