import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';

import { API_URL } from '../services/api.config';
import { ProductosComponent } from './productos/productos';
import { DashboardComponent } from './dashboard/dashboard';
import { PesosPipe } from '../pipes/pesos.pipe';
import { Reporte } from '../models/reporte.model';

registerLocaleData(localeEsCo);

describe('Catálogo y reportes', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ProductosComponent, DashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'es-CO' },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  it('el pipe pesos usa el formato colombiano', () => {
    const pipe = new PesosPipe();
    expect(pipe.transform(53000)).toBe('$53.000');
    expect(pipe.transform(1250000)).toBe('$1.250.000');
    expect(pipe.transform(null)).toBe('—');
  });

  it('Productos crea un producto con sus días y recarga la lista', () => {
    const fixture = TestBed.createComponent(ProductosComponent);
    fixture.detectChanges();
    http.expectOne(`${API_URL}/admin/productos`).flush([]);
    http.expectOne(`${API_URL}/admin/adiciones`).flush([]);

    const c = fixture.componentInstance;
    c.nuevo();
    c.form.patchValue({ nombre: ' Bandeja paisa ', descripcion: '', precio: 22000 });
    c.alternarDia('LUNES');
    c.alternarDia('MARTES');
    c.alternarDia('MARTES'); // desmarca
    c.guardar();

    const post = http.expectOne((r) => r.method === 'POST' && r.url === `${API_URL}/admin/productos`);
    expect(post.request.body).toEqual({
      nombre: 'Bandeja paisa', descripcion: null, precio: 22000, orden: 0, activo: true, dias: ['LUNES'],
      adicionIds: [],
    });
    post.flush({ id: 1, ...post.request.body });
    http.expectOne(`${API_URL}/admin/productos`).flush([{ id: 1, ...post.request.body }]);

    expect(c.editando()).toBeNull();
    expect(c.productos().length).toBe(1);
    expect(c.textoDias(c.productos()[0])).toBe('Lun');
  });

  it('Productos no deja guardar un nombre de más de 24 caracteres', () => {
    const fixture = TestBed.createComponent(ProductosComponent);
    fixture.detectChanges();
    http.expectOne(`${API_URL}/admin/productos`).flush([]);
    http.expectOne(`${API_URL}/admin/adiciones`).flush([]);

    const c = fixture.componentInstance;
    c.nuevo();
    c.form.patchValue({ nombre: 'x'.repeat(25), precio: 1000 });
    c.guardar();

    expect(c.form.invalid).toBe(true);
    http.expectNone((r) => r.method === 'POST');
  });

  it('Productos marca adiciones (máximo 9) y las envía con el producto', () => {
    const fixture = TestBed.createComponent(ProductosComponent);
    fixture.detectChanges();
    http.expectOne(`${API_URL}/admin/productos`).flush([]);
    const diez = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, nombre: `A${i + 1}`, precio: 1000, activo: true, orden: i }));
    http.expectOne(`${API_URL}/admin/adiciones`).flush(diez);

    const c = fixture.componentInstance;
    c.nuevo();
    c.form.patchValue({ nombre: 'Ensalada especial', precio: 15000 });
    diez.forEach((a) => c.alternarAdicionDelProducto(a.id));
    expect(c.adicionesSeleccionadas().size).toBe(9); // la décima no entra
    c.alternarAdicionDelProducto(1);                   // desmarca una
    c.guardar();

    const post = http.expectOne((r) => r.method === 'POST' && r.url === `${API_URL}/admin/productos`);
    expect(post.request.body.adicionIds).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    post.flush({ id: 1, ...post.request.body });
    http.expectOne(`${API_URL}/admin/productos`).flush([{ id: 1, ...post.request.body }]);
    expect(c.textoAdiciones(c.productos()[0])).toBe('A2, A3, A4, A5, A6, A7, A8, A9');
  });

  it('Productos crea una adición', () => {
    const fixture = TestBed.createComponent(ProductosComponent);
    fixture.detectChanges();
    http.expectOne(`${API_URL}/admin/productos`).flush([]);
    http.expectOne(`${API_URL}/admin/adiciones`).flush([]);

    const c = fixture.componentInstance;
    c.nuevaAdicion();
    c.formAdicion.patchValue({ nombre: ' Helado ', precio: 2500 });
    c.guardarAdicion();

    const post = http.expectOne((r) => r.method === 'POST' && r.url === `${API_URL}/admin/adiciones`);
    expect(post.request.body).toEqual({ nombre: 'Helado', precio: 2500, activo: true, orden: 0 });
    post.flush({ id: 7, ...post.request.body });
    http.expectOne(`${API_URL}/admin/adiciones`).flush([{ id: 7, ...post.request.body }]);
    expect(c.adiciones().length).toBe(1);
    expect(c.editandoAdicion()).toBeNull();
  });

  it('Dashboard dibuja una barra por día con eje legible y muestra el top', () => {
    const reporte: Reporte = {
      dias: 7, ventasHoy: 38000, pedidosHoy: 2, ventasPeriodo: 58000, pedidosPeriodo: 3, ticketPromedio: 29000,
      clientesUnicos: 2, clientesRecurrentes: 1,
      porDia: ['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06']
        .map((fecha, i) => ({ fecha, pedidos: i === 6 ? 2 : 0, ventas: i === 5 ? 20000 : i === 6 ? 38000 : 0 })),
      topProductos: [{ nombre: 'Limonada', cantidad: 5, ventas: 25000 }],
    };

    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const pedido = http.expectOne((r) => r.url === `${API_URL}/admin/reportes`);
    expect(pedido.request.params.get('dias')).toBe('30');
    pedido.flush(reporte);
    fixture.detectChanges();

    const c = fixture.componentInstance;
    expect(c.maximoEje()).toBe(50000);           // 38.000 → eje hasta 50.000
    expect(c.barras().length).toBe(7);
    expect(c.barras()[6].alto).toBeCloseTo(76);  // 38.000 / 50.000
    expect(c.barras()[6].etiqueta).toBe(true);   // siempre se etiqueta el último día

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('$38.000');
    expect(texto).toContain('Limonada');

    c.cambiarPeriodo(7);
    expect(http.expectOne((r) => r.url === `${API_URL}/admin/reportes`).request.params.get('dias')).toBe('7');
  });
});
