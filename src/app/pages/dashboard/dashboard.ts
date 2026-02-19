import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // AÑADIDO ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { PedidoService } from '../../services/pedidos.service';
import { RestauranteService } from '../../services/restaurante.service';
import { Pedido } from '../../models/pedido.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit {
  pedidosHoy = 0;
  porEstado: Record<string, number> = {};

  constructor(
    private pedidoService: PedidoService,
    private restauranteService: RestauranteService,
    private cdRef: ChangeDetectorRef, // AÑADIDO ESTA LÍNEA
  ) {}

  ngOnInit(): void {
    this.intentarCargarRestaurante();
  }

  private intentarCargarRestaurante(intento: number = 1): void {
    const maxIntentos = 3;

    const restaurante = this.restauranteService.getRestaurante();
    console.log(
      `🔄 Dashboard intento ${intento}:`,
      restaurante ? '✅ Hay restaurante' : '❌ No hay restaurante',
    );

    if (!restaurante) {
      if (intento < maxIntentos) {
        console.log(`⏳ Reintentando en 200ms... (${intento}/${maxIntentos})`);
        setTimeout(() => {
          this.intentarCargarRestaurante(intento + 1);
        }, 200);
      } else {
        console.error(
          '❌ Dashboard: No se pudo obtener restaurante después de',
          maxIntentos,
          'intentos',
        );
      }
      return;
    }

    console.log('✅ Dashboard: Restaurante obtenido exitosamente:', restaurante.nombre);

    this.pedidoService.getPedidosByRestaurante(restaurante.id).subscribe({
      next: (pedidos) => {
        console.log('📊 Dashboard: Pedidos recibidos:', pedidos?.length || 0);
        this.calcularDatos(pedidos);
        this.cdRef.detectChanges(); // AÑADIDA ESTA LÍNEA
      },
      error: (err) => {
        console.error('❌ Dashboard: Error cargando pedidos:', err);
        this.cdRef.detectChanges(); // AÑADIDA ESTA LÍNEA
      },
    });
  }

  private calcularDatos(pedidos: Pedido[]) {
    const hoy = new Date().toDateString();

    this.pedidosHoy = pedidos.filter((p) => new Date(p.fecha).toDateString() === hoy).length;

    this.porEstado = pedidos.reduce(
      (acc, p) => {
        acc[p.estado] = (acc[p.estado] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
