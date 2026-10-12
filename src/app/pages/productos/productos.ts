import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductosService } from '../../services/productos.service';
import {
  MAX_DESCRIPCION_PRODUCTO,
  MAX_NOMBRE_PRODUCTO,
  Producto,
} from '../../models/producto.model';
import { DiaSemana } from '../../models/menu-dia.model';
import { Adicion, MAX_ADICIONES_POR_PRODUCTO } from '../../models/adicion.model';
import { AdicionesService } from '../../services/adiciones.service';
import { PesosPipe } from '../../pipes/pesos.pipe';

const DIAS: { valor: DiaSemana; corto: string }[] = [
  { valor: 'LUNES', corto: 'Lun' },
  { valor: 'MARTES', corto: 'Mar' },
  { valor: 'MIERCOLES', corto: 'Mié' },
  { valor: 'JUEVES', corto: 'Jue' },
  { valor: 'VIERNES', corto: 'Vie' },
  { valor: 'SABADO', corto: 'Sáb' },
  { valor: 'DOMINGO', corto: 'Dom' },
];

/**
 * Catálogo que el bot ofrece en WhatsApp. Si no hay productos disponibles hoy,
 * el bot sigue recibiendo pedidos en texto libre.
 */
@Component({
  selector: 'app-productos',
  imports: [ReactiveFormsModule, PesosPipe],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductosComponent implements OnInit {
  private readonly servicio = inject(ProductosService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly dias = DIAS;
  readonly maxNombre = MAX_NOMBRE_PRODUCTO;
  readonly maxDescripcion = MAX_DESCRIPCION_PRODUCTO;

  readonly productos = signal<Producto[]>([]);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');

  /** null = formulario cerrado; 0 = nuevo; >0 = editando ese id */
  readonly editando = signal<number | null>(null);
  readonly diasSeleccionados = signal<Set<DiaSemana>>(new Set());
  readonly adicionesSeleccionadas = signal<Set<number>>(new Set());

  readonly activos = computed(() => this.productos().filter((p) => p.activo).length);

  // ===== Adiciones =====
  private readonly adicionesService = inject(AdicionesService);
  readonly maxAdiciones = MAX_ADICIONES_POR_PRODUCTO;
  readonly adiciones = signal<Adicion[]>([]);
  /** null = sin editar; 0 = nueva; >0 = editando esa adición */
  readonly editandoAdicion = signal<number | null>(null);
  readonly formAdicion = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(MAX_NOMBRE_PRODUCTO)]],
    precio: [0, [Validators.required, Validators.min(0)]],
    activo: [true],
  });
  private readonly nombresAdiciones = computed(
    () => new Map(this.adiciones().map((a) => [a.id!, a.nombre] as const)),
  );

  readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(MAX_NOMBRE_PRODUCTO)]],
    descripcion: ['', [Validators.maxLength(MAX_DESCRIPCION_PRODUCTO)]],
    precio: [0, [Validators.required, Validators.min(1)]],
    orden: [0, [Validators.min(0)]],
    activo: [true],
  });

  ngOnInit(): void {
    this.cargar();
    this.cargarAdiciones();
  }

  nuevo(): void {
    this.form.reset({ nombre: '', descripcion: '', precio: 0, orden: this.productos().length, activo: true });
    this.diasSeleccionados.set(new Set());
    this.adicionesSeleccionadas.set(new Set());
    this.editando.set(0);
    this.limpiarMensajes();
  }

  editar(p: Producto): void {
    this.form.reset({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: p.precio,
      orden: p.orden,
      activo: p.activo,
    });
    this.diasSeleccionados.set(new Set(p.dias));
    this.adicionesSeleccionadas.set(new Set(p.adicionIds ?? []));
    this.editando.set(p.id ?? null);
    this.limpiarMensajes();
  }

  cancelar(): void {
    this.editando.set(null);
  }

  alternarDia(dia: DiaSemana): void {
    const dias = new Set(this.diasSeleccionados());
    if (dias.has(dia)) {
      dias.delete(dia);
    } else {
      dias.add(dia);
    }
    this.diasSeleccionados.set(dias);
  }

  guardar(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const producto: Producto = {
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim() || null,
      precio: Math.round(Number(v.precio)),
      orden: Math.round(Number(v.orden)) || 0,
      activo: v.activo,
      dias: [...this.diasSeleccionados()],
      adicionIds: [...this.adicionesSeleccionadas()],
    };
    const id = this.editando();

    this.guardando.set(true);
    this.limpiarMensajes();
    const peticion = id ? this.servicio.actualizar(id, producto) : this.servicio.crear(producto);
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.editando.set(null);
        this.mensaje.set(id ? 'Producto actualizado.' : 'Producto creado. Ya aparece en el bot.');
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(err.error?.mensaje ?? 'No se pudo guardar el producto.');
      },
    });
  }

  alternarActivo(p: Producto): void {
    if (!p.id) return;
    this.servicio.actualizar(p.id, { ...p, activo: !p.activo }).subscribe({
      next: () => this.cargar(),
      error: (err: HttpErrorResponse) => this.error.set(err.error?.mensaje ?? 'No se pudo cambiar el estado.'),
    });
  }

  eliminar(p: Producto): void {
    if (!p.id || !confirm(`¿Eliminar "${p.nombre}"? Los pedidos anteriores no se modifican.`)) return;
    this.servicio.eliminar(p.id).subscribe({
      next: () => this.cargar(),
      error: (err: HttpErrorResponse) => this.error.set(err.error?.mensaje ?? 'No se pudo eliminar.'),
    });
  }

  alternarAdicionDelProducto(id: number): void {
    const elegidas = new Set(this.adicionesSeleccionadas());
    if (elegidas.has(id)) {
      elegidas.delete(id);
    } else if (elegidas.size < MAX_ADICIONES_POR_PRODUCTO) {
      elegidas.add(id);
    }
    this.adicionesSeleccionadas.set(elegidas);
  }

  textoAdiciones(p: Producto): string {
    const nombres = (p.adicionIds ?? []).map((id) => this.nombresAdiciones().get(id)).filter(Boolean);
    return nombres.length ? nombres.join(', ') : '—';
  }

  // ===== Adiciones =====

  nuevaAdicion(): void {
    this.formAdicion.reset({ nombre: '', precio: 0, activo: true });
    this.editandoAdicion.set(0);
    this.limpiarMensajes();
  }

  editarAdicion(a: Adicion): void {
    this.formAdicion.reset({ nombre: a.nombre, precio: a.precio, activo: a.activo });
    this.editandoAdicion.set(a.id ?? null);
    this.limpiarMensajes();
  }

  cancelarAdicion(): void {
    this.editandoAdicion.set(null);
  }

  guardarAdicion(): void {
    if (this.formAdicion.invalid) return;
    const v = this.formAdicion.getRawValue();
    const id = this.editandoAdicion();
    const actual = this.adiciones().find((a) => a.id === id);
    const adicion: Adicion = {
      nombre: v.nombre.trim(),
      precio: Math.round(Number(v.precio)),
      activo: v.activo,
      orden: actual?.orden ?? this.adiciones().length,
    };

    this.limpiarMensajes();
    const peticion = id ? this.adicionesService.actualizar(id, adicion) : this.adicionesService.crear(adicion);
    peticion.subscribe({
      next: () => {
        this.editandoAdicion.set(null);
        this.mensaje.set(id ? 'Adición actualizada.' : 'Adición creada. Márcala en los productos que la admiten.');
        this.cargarAdiciones();
      },
      error: (err: HttpErrorResponse) => this.error.set(err.error?.mensaje ?? 'No se pudo guardar la adición.'),
    });
  }

  eliminarAdicion(a: Adicion): void {
    if (!a.id || !confirm(`¿Eliminar la adición "${a.nombre}"? Se quitará de los productos que la tenían.`)) return;
    this.adicionesService.eliminar(a.id).subscribe({
      next: () => {
        this.cargarAdiciones();
        this.cargar(); // los productos pierden esa adición
      },
      error: (err: HttpErrorResponse) => this.error.set(err.error?.mensaje ?? 'No se pudo eliminar la adición.'),
    });
  }

  private cargarAdiciones(): void {
    this.adicionesService.listar().subscribe({
      next: (lista) => this.adiciones.set(lista),
      error: () => this.error.set('No se pudieron cargar las adiciones.'),
    });
  }

  textoDias(p: Producto): string {
    if (!p.dias.length || p.dias.length === 7) return 'Todos los días';
    return DIAS.filter((d) => p.dias.includes(d.valor)).map((d) => d.corto).join(', ');
  }

  private cargar(): void {
    this.servicio.listar().subscribe({
      next: (lista) => {
        this.productos.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('No se pudieron cargar los productos.');
      },
    });
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
