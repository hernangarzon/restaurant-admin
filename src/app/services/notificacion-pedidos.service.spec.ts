import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Title } from '@angular/platform-browser';

import { NotificacionPedidosService } from './notificacion-pedidos.service';
import { API_URL } from './api.config';

describe('NotificacionPedidosService', () => {
  let servicio: NotificacionPedidosService;
  let http: HttpTestingController;
  let title: Title;

  const responder = (nuevos: number, ultimoPedidoId: number) => {
    servicio.consultar();
    http.expectOne(`${API_URL}/admin/pedidos/resumen`).flush({ nuevos, ultimoPedidoId });
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(NotificacionPedidosService);
    http = TestBed.inject(HttpTestingController);
    title = TestBed.inject(Title);
  });

  afterEach(() => http.verify());

  it('la primera consulta no avisa de pedidos que ya existían', () => {
    responder(3, 40);

    expect(servicio.ultimoAviso()).toBeNull();
    expect(servicio.nuevos()).toBe(3);
    expect(title.getTitle()).toBe('(3) Restaurant Admin');
  });

  it('avisa cuando llega un pedido con id mayor, y cuenta cuántos', () => {
    responder(0, 40);
    responder(1, 41);
    expect(servicio.ultimoAviso()?.texto).toBe('🛎️ ¡Nuevo pedido!');
    expect(servicio.ultimoPedidoId()).toBe(41);

    responder(3, 43);
    expect(servicio.ultimoAviso()?.texto).toBe('🛎️ ¡2 pedidos nuevos!');
  });

  it('sin cambios no vuelve a avisar', () => {
    responder(1, 41);
    responder(1, 41);

    expect(servicio.ultimoAviso()).toBeNull();
  });

  it('reiniciar al cerrar sesión limpia el contador del título', () => {
    responder(2, 10);
    servicio.reiniciar();

    expect(title.getTitle()).toBe('Restaurant Admin');
    expect(servicio.nuevos()).toBe(0);
  });
});
