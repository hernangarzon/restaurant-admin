import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, KeyValuePipe } from '@angular/common';
import { PedidoService } from '../../services/pedidos.service';
import { RestauranteService } from '../../services/restaurante.service';
import { ReportesService } from '../../services/reportes.service';
import { Pedido } from '../../models/pedido.model';
import { Reporte, VentasDia } from '../../models/reporte.model';
import { PesosPipe } from '../../pipes/pesos.pipe';

interface Barra extends VentasDia {
  alto: number;       // % del área del gráfico
  etiqueta: boolean;  // mostrar la fecha bajo la barra
}

/** Redondea hacia arriba a 1, 2 o 5 × 10^n para que el eje tenga valores legibles */
function maximoLegible(valor: number): number {
  if (valor <= 0) return 1;
  const potencia = 10 ** Math.floor(Math.log10(valor));
  const paso = [1, 2, 5, 10].find((m) => m * potencia >= valor) ?? 10;
  return paso * potencia;
}

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, KeyValuePipe, PesosPipe],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly pedidoService = inject(PedidoService);
  private readonly restauranteService = inject(RestauranteService);
  private readonly reportes = inject(ReportesService);

  readonly opcionesPeriodo = [7, 30, 90];
  readonly periodo = signal(30);
  readonly reporte = signal<Reporte | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly porEstado = signal<Record<string, number>>({});
  /** Barra con el tooltip abierto (hover o foco) */
  readonly seleccionada = signal<Barra | null>(null);

  readonly maximoEje = computed(() =>
    maximoLegible(Math.max(0, ...(this.reporte()?.porDia ?? []).map((d) => d.ventas))),
  );

  readonly barras = computed<Barra[]>(() => {
    const dias = this.reporte()?.porDia ?? [];
    const max = this.maximoEje();
    const cada = Math.ceil(dias.length / 5); // ~5 fechas en el eje: caben sin encimarse en el celular
    return dias.map((d, i) => ({
      ...d,
      alto: (d.ventas / max) * 100,
      etiqueta: i === dias.length - 1 || (dias.length - 1 - i) % cada === 0,
    }));
  });

  readonly hayVentas = computed(() => (this.reporte()?.ventasPeriodo ?? 0) > 0);

  ngOnInit(): void {
    this.cargarReporte();

    const restaurante = this.restauranteService.getRestaurante();
    if (!restaurante) return; // el AuthGuard garantiza sesión

    this.pedidoService.getPedidosByRestaurante(restaurante.id).subscribe({
      next: (pedidos) => this.porEstado.set(this.contarPorEstado(pedidos)),
      error: (err) => console.error('❌ Dashboard: Error cargando pedidos:', err),
    });
  }

  cambiarPeriodo(dias: number): void {
    if (dias === this.periodo()) return;
    this.periodo.set(dias);
    this.cargarReporte();
  }

  private cargarReporte(): void {
    this.cargando.set(true);
    this.seleccionada.set(null);
    this.reportes.obtener(this.periodo()).subscribe({
      next: (r) => {
        this.reporte.set(r);
        this.cargando.set(false);
        this.error.set('');
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('No se pudieron cargar las métricas de ventas.');
      },
    });
  }

  private contarPorEstado(pedidos: Pedido[]): Record<string, number> {
    return pedidos.reduce(
      (acc, p) => {
        acc[p.estado] = (acc[p.estado] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
