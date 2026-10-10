import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';

import { AuthGuard } from './auth.guard';
import { AuthService, LoginResponse } from './auth.service';
import { superadminGuard } from './superadmin.guard';

function jwtVigente(): string {
  const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${b64url('{"alg":"HS256"}')}.${b64url(JSON.stringify({ exp }))}.firma`;
}

const sesion = (extra: Partial<LoginResponse> = {}): LoginResponse => ({
  adminId: 1,
  restauranteId: 1,
  restauranteNombre: 'Demo',
  token: jwtVigente(),
  ...extra,
});

describe('Guards', () => {
  let auth: AuthService;
  let guard: AuthGuard;
  let router: Router;

  const estado = (url: string) => ({ url }) as RouterStateSnapshot;
  const destino = (r: boolean | UrlTree) => (r instanceof UrlTree ? router.serializeUrl(r) : r);

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    auth = TestBed.inject(AuthService);
    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
  });

  it('sin sesión manda al login', () => {
    expect(destino(guard.canActivate(null, estado('/admin/pedidos')))).toBe('/login');
  });

  it('con contraseña temporal solo deja entrar a cambiarla, también entre páginas hijas', () => {
    auth.iniciarSesion(sesion({ debeCambiarPassword: true }), 'u');

    expect(destino(guard.canActivate(null, estado('/admin/dashboard')))).toBe('/admin/change-password');
    expect(destino(guard.canActivateChild(null, estado('/admin/pedidos')))).toBe('/admin/change-password');
    expect(guard.canActivateChild(null, estado('/admin/change-password'))).toBe(true);

    auth.marcarPasswordCambiada();
    expect(guard.canActivateChild(null, estado('/admin/pedidos'))).toBe(true);
  });

  it('la página de superadmin solo se abre con ese rol', () => {
    const correr = () => TestBed.runInInjectionContext(() => superadminGuard({} as never, {} as never));

    auth.iniciarSesion(sesion({ rol: 'ADMIN' }), 'u');
    expect(destino(correr() as boolean | UrlTree)).toBe('/admin/dashboard');

    auth.iniciarSesion(sesion({ rol: 'SUPERADMIN' }), 'u');
    expect(correr()).toBe(true);
  });

  it('una sesión anterior a los roles se trata como admin normal', () => {
    auth.iniciarSesion(sesion(), 'u');
    expect(auth.esSuperadmin()).toBe(false);
    expect(auth.debeCambiarPassword()).toBe(false);
  });
});
