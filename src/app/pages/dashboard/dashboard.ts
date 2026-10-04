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
    const restaurante = this.restauranteService.getRestaurante();
    if (!restaurante) return; // el AuthGuard garantiza sesión; sin ella no hay nada que mostrar

    this.pedidoService.getPedidosByRestaurante(restaurante.id).subscribe({
      next: (pedidos) => {
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
