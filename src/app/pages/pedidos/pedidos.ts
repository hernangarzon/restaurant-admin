import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';

import { Pedido } from '../../models/pedido.model';
import { ClienteAdmin } from '../../models/cliente-admin.model';
import { Restaurante } from '../../models/restaurante.model';
import { EstadoPedido } from '../../models/estado-pedido';

import { PedidoService } from '../../services/pedidos.service';
import { ClienteService } from '../../services/clientes.service';
import { RestauranteService } from '../../services/restaurante.service';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedidos.html',
  styleUrls: ['./pedidos.css'],
})
export class PedidosComponent implements OnInit, OnDestroy {
  pedidos: Pedido[] = [];
  pedidosOriginales: Pedido[] = [];

  clientes: ClienteAdmin[] = [];

  mostrarFormulario = false;
  autoRefreshSub!: Subscription;
  actualizando = false;
  cargandoInicial = true;

  mostrarModal = false;
  pedidoSeleccionado: Pedido | null = null;

  estadoFiltro: EstadoPedido | null = null;

  fechaFiltro: string = 'TODOS';

  filtroTelefono: string = '';

  nuevoPedido: Partial<Pedido> = {
    descripcion: '',
    estado: EstadoPedido.NUEVO,
  };

  private restaurante!: Restaurante;

  constructor(
    private pedidoService: PedidoService,
    private clienteService: ClienteService,
    private restauranteService: RestauranteService,
    private cdRef: ChangeDetectorRef,
  ) {}

  // =======================
  // CICLO DE VIDA
  // =======================

  ngOnInit(): void {
    this.autoRefreshSub = interval(60000).subscribe(() => {
      if (this.restaurante) {
        this.cargarPedidos();
      }
    });

    const restaurante = this.restauranteService.getRestaurante();

    if (restaurante) {
      this.restaurante = restaurante;
      this.cargarPedidos();
      this.cargarClientes();
    }
  }

  ngOnDestroy(): void {
    this.autoRefreshSub?.unsubscribe();
  }

  // =======================
  // PEDIDOS
  // =======================

  cargarPedidos(): void {
    if (!this.restaurante?.id || this.actualizando) return;

    this.actualizando = true;

    this.pedidoService.getPedidosByRestaurante(this.restaurante.id).subscribe({
      next: (data: Pedido[]) => {
        console.log('📦 DEBUG - Pedidos recibidos del backend:', data);

        // Verifica el primer pedido
        if (data.length > 0) {
          const primerPedido = data[0];
          console.log('🔍 Primer pedido completo:', primerPedido);
          console.log('📱 Teléfono en cliente:', primerPedido.cliente?.telefono);
          console.log('📱 telefonoCliente:', primerPedido.telefonoCliente);
          console.log('📄 Descripción:', primerPedido.descripcion);
        }

        let pedidosProcesados = [...data];

        // 🔹 Guardamos originales para filtros
        this.pedidosOriginales = [...pedidosProcesados];

        // 🔹 Filtro por estado
        if (this.estadoFiltro) {
          pedidosProcesados = pedidosProcesados.filter((p) => p.estado === this.estadoFiltro);
        }

        // 🔹 Ordenar por fecha (más recientes primero)
        pedidosProcesados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        this.pedidos = pedidosProcesados;
        this.cargandoInicial = false;
        this.actualizando = false;

        this.cdRef.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error cargando pedidos:', err);
        this.pedidos = [];
        this.actualizando = false;
        this.cargandoInicial = false;
      },
    });
  }

  cambiarEstado(pedido: Pedido): void {
    const flujo: EstadoPedido[] = [
      EstadoPedido.NUEVO,
      EstadoPedido.EN_PREPARACION,
      EstadoPedido.LISTO,
      EstadoPedido.ENTREGADO,
    ];

    const index = flujo.indexOf(pedido.estado);

    // estado inválido o ya finalizado
    if (index === -1 || index === flujo.length - 1) {
      return;
    }

    const nuevoEstado = flujo[index + 1];

    this.pedidoService.actualizarEstado(pedido.id, nuevoEstado).subscribe({
      next: () => {
        pedido.estado = nuevoEstado;
        this.cdRef.detectChanges();
      },
      error: (err) => console.error(err),
    });
  }

  puedeCambiarEstado(estado: EstadoPedido): boolean {
    return estado !== EstadoPedido.ENTREGADO && estado !== EstadoPedido.CANCELADO;
  }

  // =======================
  // FILTROS
  // =======================

  filtrarEstado(estado: string): void {
    this.estadoFiltro = estado ? (estado as EstadoPedido) : null;
    this.aplicarFiltros(); // ← Cambia esto, NO cargarPedidos()
  }

  filtrarFecha(fecha: string): void {
    this.fechaFiltro = fecha;
    this.aplicarFiltros();
  }

  buscarPorTelefono(telefono: string): void {
    this.filtroTelefono = telefono.trim().toLowerCase();
    this.aplicarFiltros();
  }

  // NUEVO: Limpiar búsqueda de teléfono
  limpiarBusquedaTelefono(): void {
    this.filtroTelefono = '';
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let pedidosFiltrados = [...this.pedidosOriginales];

    // 1. Filtro por teléfono
    if (this.filtroTelefono) {
      pedidosFiltrados = pedidosFiltrados.filter((p) => {
        const telefono = p.telefonoCliente?.toLowerCase() || '';
        return telefono.includes(this.filtroTelefono);
      });
    }

    // 2. Filtro por estado
    if (this.estadoFiltro) {
      pedidosFiltrados = pedidosFiltrados.filter((p) => p.estado === this.estadoFiltro);
    }

    // 3. Filtro por fecha
    if (this.fechaFiltro !== 'TODOS') {
      pedidosFiltrados = this.filtrarPorFecha(pedidosFiltrados);
    }

    // 4. Ordenar por fecha (más recientes primero)
    pedidosFiltrados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    this.pedidos = pedidosFiltrados;
    this.cdRef.detectChanges();
  }

  // NUEVO: Limpiar todos los filtros
  limpiarTodosFiltros(): void {
    this.filtroTelefono = '';
    this.estadoFiltro = null;
    this.fechaFiltro = 'TODOS';
    this.aplicarFiltros();
  }

  // NUEVO: Método para obtener texto del filtro de fecha
  obtenerTextoFiltroFecha(): string {
    switch (this.fechaFiltro) {
      case 'HOY':
        return 'Hoy';
      case 'AYER':
        return 'Ayer';
      case 'ULTIMA_SEMANA':
        return 'Última semana';
      default:
        return '';
    }
  }

  private filtrarPorFecha(pedidos: Pedido[]): Pedido[] {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Inicio del día

    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1); // Inicio del día siguiente

    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1); // Inicio del día de ayer

    const haceUnaSemana = new Date(hoy);
    haceUnaSemana.setDate(haceUnaSemana.getDate() - 7); // Hace 7 días

    return pedidos.filter((pedido) => {
      const fechaPedido = new Date(pedido.fecha);

      switch (this.fechaFiltro) {
        case 'HOY':
          return fechaPedido >= hoy && fechaPedido < mañana;

        case 'AYER':
          return fechaPedido >= ayer && fechaPedido < hoy;

        case 'ULTIMA_SEMANA':
          return fechaPedido >= haceUnaSemana;

        default:
          return true;
      }
    });
  }

  // =======================
  // CLIENTES
  // =======================

  cargarClientes(): void {
    if (!this.restaurante?.id) return;
    this.clientes = this.clienteService.getClientes(this.restaurante.id);
  }

  getTelefonoCliente(cliente?: ClienteAdmin): string {
    return cliente?.telefono ?? '—';
  }

  // =======================
  // CREAR PEDIDO
  // =======================

  crearPedido(): void {
    if (!this.restaurante) return;

    const pedido: Pedido = {
      ...this.nuevoPedido,
      restauranteId: this.restaurante.id,
    } as Pedido;

    this.pedidoService.crearPedido(pedido).subscribe({
      next: () => {
        this.cargarPedidos();
        this.cancelar();
      },
      error: (err) => console.error(err),
    });
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.nuevoPedido = {
      descripcion: '',
      estado: EstadoPedido.NUEVO,
    };
  }

  verDetalle(pedido: Pedido): void {
    console.log('🔍 DEBUG - Pedido seleccionado:', pedido);
    console.log('📅 Fecha:', pedido.fecha);
    console.log('📊 Estado:', pedido.estado);
    console.log('🆔 ID:', pedido.id);
    console.log('📍 Dirección:', pedido.direccion);
    console.log('📄 Descripción:', pedido.descripcion);
    this.pedidoSeleccionado = pedido;
    this.mostrarModal = true;
    this.cdRef.detectChanges();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.pedidoSeleccionado = null;
    this.cdRef.detectChanges();
  }

  cambiarEstadoDesdeModal(): void {
    if (this.pedidoSeleccionado) {
      this.cambiarEstado(this.pedidoSeleccionado);
      this.cerrarModal();
    }
  }

  cancelarPedido(pedido: Pedido): void {
    if (!confirm('¿Cancelar este pedido?')) return;

    this.pedidoService.cancelarPedido(pedido.id).subscribe({
      next: () => {
        pedido.estado = EstadoPedido.CANCELADO;
        this.cdRef.detectChanges();
      },
      error: (err) => console.error(err),
    });
  }
}
