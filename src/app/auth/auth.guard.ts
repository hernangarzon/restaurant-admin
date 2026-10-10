// src/app/auth/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

const RUTA_CAMBIO_PASSWORD = '/admin/change-password';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(_route: unknown, state: RouterStateSnapshot): boolean | UrlTree {
    return this.verificar(state.url);
  }

  // También en cada navegación entre páginas hijas de /admin
  canActivateChild(_route: unknown, state: RouterStateSnapshot): boolean | UrlTree {
    return this.verificar(state.url);
  }

  private verificar(url: string): boolean | UrlTree {
    if (!this.auth.isLoggedIn()) {
      // Token expirado o no existe — limpiar sesión
      this.auth.logout();
      return this.router.parseUrl('/login');
    }

    // Con contraseña temporal solo se permite la página para cambiarla
    if (this.auth.debeCambiarPassword() && !url.startsWith(RUTA_CAMBIO_PASSWORD)) {
      return this.router.parseUrl(RUTA_CAMBIO_PASSWORD);
    }

    return true;
  }
}
