import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { SuperadminService } from '../../services/superadmin.service';
import { Credenciales, ResumenAdmin, ResumenRestaurante } from '../../models/superadmin.model';

/** Administración de la plataforma: restaurantes, sus usuarios y suspensiones. */
@Component({
  selector: 'app-superadmin',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './superadmin.html',
  styleUrls: ['./superadmin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminComponent implements OnInit {
  private readonly servicio = inject(SuperadminService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly restaurantes = signal<ResumenRestaurante[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  readonly mostrarFormulario = signal(false);
  readonly creando = signal(false);

  readonly seleccionado = signal<ResumenRestaurante | null>(null);
  readonly admins = signal<ResumenAdmin[]>([]);

  /** Contraseña temporal recién generada: se muestra una sola vez */
  readonly credenciales = signal<(Credenciales & { contexto: string }) | null>(null);
  readonly copiado = signal(false);

  readonly formRestaurante = this.fb.group({
    nombre: ['', Validators.required],
    slug: [''],
    telefonoWhatsapp: [''],
    whatsappPhoneId: ['', Validators.required],
    adminTelefono: ['', Validators.required],
    adminEmail: ['', Validators.email],
  });

  readonly formAdmin = this.fb.group({
    telefono: ['', Validators.required],
    email: ['', Validators.email],
  });

  ngOnInit(): void {
    this.cargarRestaurantes();
  }

  cargarRestaurantes(): void {
    this.servicio.listarRestaurantes().subscribe({
      next: (lista) => {
        this.restaurantes.set(lista);
        this.cargando.set(false);
        // Mantener actualizado el restaurante abierto
        const sel = this.seleccionado();
        if (sel) this.seleccionado.set(lista.find((r) => r.id === sel.id) ?? null);
      },
      error: (err) => this.fallo(err, 'No se pudieron cargar los restaurantes'),
    });
  }

  crearRestaurante(): void {
    if (this.formRestaurante.invalid) return;
    this.error.set('');
    this.creando.set(true);
    const datos = this.formRestaurante.getRawValue();

    this.servicio.crearRestaurante(datos).subscribe({
      next: (cred) => {
        this.creando.set(false);
        this.mostrarFormulario.set(false);
        this.formRestaurante.reset();
        this.mostrarCredenciales(cred, `Restaurante "${datos.nombre}" creado`);
        this.cargarRestaurantes();
      },
      error: (err) => {
        this.creando.set(false);
        this.fallo(err, 'No se pudo crear el restaurante');
      },
    });
  }

  cambiarEstado(r: ResumenRestaurante): void {
    const accion = r.activo ? 'suspender' : 'reactivar';
    const detalle = r.activo
      ? '\n\nSus administradores no podrán entrar y el bot responderá que no está recibiendo pedidos.'
      : '';
    if (!confirm(`¿Seguro que quieres ${accion} "${r.nombre}"?${detalle}`)) return;

    this.servicio.cambiarEstadoRestaurante(r.id, !r.activo).subscribe({
      next: () => this.cargarRestaurantes(),
      error: (err) => this.fallo(err, `No se pudo ${accion} el restaurante`),
    });
  }

  verUsuarios(r: ResumenRestaurante): void {
    if (this.seleccionado()?.id === r.id) {
      this.seleccionado.set(null);
      return;
    }
    this.seleccionado.set(r);
    this.admins.set([]);
    this.formAdmin.reset();
    this.cargarAdmins(r.id);
  }

  agregarAdmin(): void {
    const r = this.seleccionado();
    if (!r || this.formAdmin.invalid) return;
    const { telefono, email } = this.formAdmin.getRawValue();

    this.servicio.agregarAdmin(r.id, telefono, email).subscribe({
      next: (cred) => {
        this.formAdmin.reset();
        this.mostrarCredenciales(cred, `Usuario agregado a "${r.nombre}"`);
        this.cargarAdmins(r.id);
        this.cargarRestaurantes();
      },
      error: (err) => this.fallo(err, 'No se pudo agregar el usuario'),
    });
  }

  restablecerPassword(a: ResumenAdmin): void {
    if (!confirm(`¿Generar una contraseña temporal para ${a.telefono}? La actual dejará de funcionar.`)) return;

    this.servicio.restablecerPassword(a.id).subscribe({
      next: (cred) => {
        this.mostrarCredenciales(cred, 'Contraseña restablecida');
        this.cargarAdmins(cred.restauranteId);
      },
      error: (err) => this.fallo(err, 'No se pudo restablecer la contraseña'),
    });
  }

  cambiarEstadoAdmin(a: ResumenAdmin): void {
    const r = this.seleccionado();
    if (!r) return;
    this.servicio.cambiarEstadoAdmin(a.id, !a.activo).subscribe({
      next: () => this.cargarAdmins(r.id),
      error: (err) => this.fallo(err, 'No se pudo cambiar el estado del usuario'),
    });
  }

  copiarPassword(): void {
    const cred = this.credenciales();
    if (!cred) return;
    navigator.clipboard?.writeText(cred.passwordTemporal).then(() => this.copiado.set(true));
  }

  cerrarCredenciales(): void {
    this.credenciales.set(null);
  }

  private cargarAdmins(restauranteId: number): void {
    this.servicio.listarAdmins(restauranteId).subscribe({
      next: (lista) => this.admins.set(lista),
      error: (err) => this.fallo(err, 'No se pudieron cargar los usuarios'),
    });
  }

  private mostrarCredenciales(cred: Credenciales, contexto: string): void {
    this.copiado.set(false);
    this.credenciales.set({ ...cred, contexto });
  }

  // El backend envía { mensaje } con el motivo (duplicados, datos faltantes...)
  private fallo(err: HttpErrorResponse, porDefecto: string): void {
    this.cargando.set(false);
    this.error.set(err.error?.mensaje ?? porDefecto);
  }
}
