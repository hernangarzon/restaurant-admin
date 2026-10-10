import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfiguracionRestauranteService } from '../../services/configuracion-restaurante.service';
import { ConfiguracionRestaurante } from '../../models/configuracion-restaurante.model';

/** '' o 0 → null (sin costo / sin mínimo) */
function aPesos(valor: string | number): number | null {
  const n = Math.round(Number(valor));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Datos del restaurante que usa el bot: horario, aviso, tiempo estimado, datos de pago... */
@Component({
  selector: 'app-configuracion',
  imports: [ReactiveFormsModule],
  templateUrl: './configuracion.html',
  styleUrls: ['./configuracion.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionComponent implements OnInit {
  private readonly servicio = inject(ConfiguracionRestauranteService);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly mensaje = signal('');
  readonly error = signal('');
  readonly telefono = signal<string | null>(null);

  readonly form = inject(NonNullableFormBuilder).group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    direccion: [''],
    horario: [''],
    horaInicio: [''],
    horaFin: [''],
    observacion: [''],
    tiempoEstimado: ['', [Validators.maxLength(60)]],
    datosPago: [''],
    // Texto (input number vacío = ''); se convierte a número o null al guardar
    costoDomicilio: ['', [Validators.min(0)]],
    pedidoMinimo: ['', [Validators.min(0)]],
  });

  ngOnInit(): void {
    this.servicio.obtener().subscribe({
      next: (c) => {
        this.cargar(c);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la configuración del restaurante.');
        this.cargando.set(false);
      },
    });
  }

  guardar(): void {
    this.mensaje.set('');
    this.error.set('');
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    if (!!v.horaInicio !== !!v.horaFin) {
      this.error.set('Indica la hora de apertura y la de cierre, o deja ambas vacías.');
      return;
    }

    this.guardando.set(true);
    this.servicio
      .guardar({
        nombre: v.nombre,
        telefonoWhatsapp: this.telefono(),
        direccion: v.direccion || null,
        horario: v.horario || null,
        horaInicio: v.horaInicio || null,
        horaFin: v.horaFin || null,
        observacion: v.observacion || null,
        tiempoEstimado: v.tiempoEstimado || null,
        datosPago: v.datosPago || null,
        costoDomicilio: aPesos(v.costoDomicilio),
        pedidoMinimo: aPesos(v.pedidoMinimo),
      })
      .subscribe({
        next: (c) => {
          this.cargar(c);
          this.guardando.set(false);
          this.mensaje.set('Cambios guardados. El bot ya usa la nueva información.');
        },
        error: (err: HttpErrorResponse) => {
          this.guardando.set(false);
          this.error.set(err.error?.mensaje ?? 'No se pudieron guardar los cambios.');
        },
      });
  }

  private cargar(c: ConfiguracionRestaurante): void {
    this.telefono.set(c.telefonoWhatsapp);
    this.form.setValue({
      nombre: c.nombre ?? '',
      direccion: c.direccion ?? '',
      horario: c.horario ?? '',
      horaInicio: c.horaInicio?.slice(0, 5) ?? '', // el backend puede enviar "HH:mm:ss"
      horaFin: c.horaFin?.slice(0, 5) ?? '',
      observacion: c.observacion ?? '',
      tiempoEstimado: c.tiempoEstimado ?? '',
      datosPago: c.datosPago ?? '',
      costoDomicilio: c.costoDomicilio != null ? String(c.costoDomicilio) : '',
      pedidoMinimo: c.pedidoMinimo != null ? String(c.pedidoMinimo) : '',
    });
  }
}
