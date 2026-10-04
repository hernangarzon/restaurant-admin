import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService, LoginResponse } from './auth.service';
import { RestauranteService } from '../services/restaurante.service';

// JWT con payload en base64url (sin firma: el front solo lee exp)
function jwt(payload: object): string {
  const b64url = (s: string) =>
    btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64url('{"alg":"HS256"}')}.${b64url(JSON.stringify(payload))}.firma`;
}

const enUnaHora = () => Math.floor(Date.now() / 1000) + 3600;

const login = (token: string, restauranteId = 7): LoginResponse => ({
  adminId: 3,
  restauranteId,
  restauranteNombre: 'La Esquina',
  token,
});

describe('AuthService', () => {
  let auth: AuthService;
  let restaurantes: RestauranteService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    restaurantes = TestBed.inject(RestauranteService);
  });

  it('acepta un token vigente cuyo payload base64url trae "-" o "_"', () => {
    // "~~~" codifica a "fn5-" en base64url ("fn5+" en base64): atob solo fallaba con esto
    const token = jwt({ sub: '~~~', exp: enUnaHora() });
    expect(token.split('.')[1]).toMatch(/[-_]/);

    auth.iniciarSesion(login(token), '3001234567');

    expect(auth.isTokenExpired()).toBe(false);
    expect(auth.isLoggedIn()).toBe(true);
  });

  it('considera vencido un token expirado, mal formado o sin exp', () => {
    for (const token of [jwt({ exp: 1 }), 'basura', jwt({ sub: 'x' })]) {
      auth.iniciarSesion(login(token), 'u');
      expect(auth.isLoggedIn()).toBe(false);
    }
  });

  it('el restaurante sale de la sesión y sin sesión no hay restaurante demo', () => {
    expect(restaurantes.getRestaurante()).toBeNull();

    auth.iniciarSesion(login(jwt({ exp: enUnaHora() }), 42), 'u');
    expect(restaurantes.getRestaurante()).toEqual({ id: 42, nombre: 'La Esquina', activo: true });

    auth.logout();
    expect(restaurantes.getRestaurante()).toBeNull();
  });

  it('logout borra también las claves de versiones anteriores', () => {
    localStorage.setItem('restaurante_activo', '{"id":1,"nombre":"Restaurante Demo"}');
    localStorage.setItem('loggedIn', 'true');
    auth.iniciarSesion(login(jwt({ exp: enUnaHora() })), 'u');

    auth.logout();

    expect(localStorage.length).toBe(0);
  });

  it('un nuevo login reemplaza por completo la sesión anterior', () => {
    auth.iniciarSesion(login(jwt({ exp: enUnaHora() }), 1), 'admin-a');
    auth.iniciarSesion(login(jwt({ exp: enUnaHora() }), 2), 'admin-b');

    expect(auth.getRestauranteId()).toBe(2);
    expect(auth.getUsername()).toBe('admin-b');
  });
});
