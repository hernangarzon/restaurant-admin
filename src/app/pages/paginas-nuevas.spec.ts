import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { API_URL } from '../services/api.config';
import { ConfiguracionComponent } from './configuracion/configuracion';
import { SuperadminComponent } from './superadmin/superadmin';

describe('Páginas nuevas', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfiguracionComponent, SuperadminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('Mi restaurante carga la configuración y envía horas y textos vacíos como null', async () => {
    const fixture = TestBed.createComponent(ConfiguracionComponent);
    fixture.detectChanges();
    http.expectOne(`${API_URL}/admin/restaurante`).flush({
      nombre: 'La Esquina', telefonoWhatsapp: '573001112233', direccion: null, horario: null,
      horaInicio: '18:00:00', horaFin: '02:00:00', observacion: null, tiempoEstimado: null, datosPago: null,
    });
    await fixture.whenStable();

    const c = fixture.componentInstance;
    expect(c.form.getRawValue().horaInicio).toBe('18:00');

    c.form.patchValue({ datosPago: 'Nequi 300' });
    c.guardar();
    const put = http.expectOne((r) => r.method === 'PUT' && r.url === `${API_URL}/admin/restaurante`);
    expect(put.request.body).toEqual(expect.objectContaining({
      nombre: 'La Esquina', horaInicio: '18:00', horaFin: '02:00', datosPago: 'Nequi 300', direccion: null,
    }));
    put.flush(put.request.body);
    expect(c.mensaje()).toContain('Cambios guardados');
  });

  it('Mi restaurante no envía si falta una de las dos horas', async () => {
    const fixture = TestBed.createComponent(ConfiguracionComponent);
    fixture.detectChanges();
    http.expectOne(`${API_URL}/admin/restaurante`).flush({
      nombre: 'X', telefonoWhatsapp: null, direccion: null, horario: null, horaInicio: null, horaFin: null,
      observacion: null, tiempoEstimado: null, datosPago: null,
    });

    const c = fixture.componentInstance;
    c.form.patchValue({ horaInicio: '08:00' });
    c.guardar();

    expect(c.error()).toContain('apertura y la de cierre');
  });

  it('Superadmin muestra la contraseña temporal al crear un restaurante', async () => {
    const fixture = TestBed.createComponent(SuperadminComponent);
    fixture.detectChanges();
    http.expectOne(`${API_URL}/admin/superadmin/restaurantes`).flush([]);

    const c = fixture.componentInstance;
    c.formRestaurante.setValue({
      nombre: 'Nuevo', slug: '', telefonoWhatsapp: '', whatsappPhoneId: 'PID', adminTelefono: '3001112233', adminEmail: '',
    });
    c.crearRestaurante();
    http.expectOne((r) => r.method === 'POST' && r.url === `${API_URL}/admin/superadmin/restaurantes`)
      .flush({ restauranteId: 5, adminId: 9, telefono: '3001112233', passwordTemporal: 'Abc234xyzQ' });
    http.expectOne(`${API_URL}/admin/superadmin/restaurantes`).flush([]);
    fixture.detectChanges();

    expect(c.credenciales()?.passwordTemporal).toBe('Abc234xyzQ');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Abc234xyzQ');
  });

  it('Superadmin muestra el motivo que envía el backend al fallar', () => {
    const fixture = TestBed.createComponent(SuperadminComponent);
    fixture.detectChanges();
    http.expectOne(`${API_URL}/admin/superadmin/restaurantes`).flush([]);

    const c = fixture.componentInstance;
    c.formRestaurante.setValue({
      nombre: 'Dup', slug: '', telefonoWhatsapp: '', whatsappPhoneId: 'PID', adminTelefono: '3001112233', adminEmail: '',
    });
    c.crearRestaurante();
    http.expectOne((r) => r.method === 'POST')
      .flush({ mensaje: 'Ese Phone Number ID ya está asignado a otro restaurante' }, { status: 409, statusText: 'Conflict' });

    expect(c.error()).toBe('Ese Phone Number ID ya está asignado a otro restaurante');
  });
});
