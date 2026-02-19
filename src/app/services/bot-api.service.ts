import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from '../models/cliente.model';
import { Pedido } from '../models/pedido.model';

export interface Estadisticas {
  totalPedidos: number;
  pedidosNuevos: number;
  pedidosEnPreparacion: number;
  pedidosListos: number;
  pedidosEntregados: number;
  totalClientes: number;
  ingresosEstimados?: number; // Añade esta línea como opcional
}

@Injectable({
  providedIn: 'root'
})
export class BotApiService {
  private baseUrl = 'http://localhost:8091';

  constructor(private http: HttpClient) {}

  // === DASHBOARD ===
  getEstadisticas(): Observable<Estadisticas> {
    return this.http.get<Estadisticas>(`${this.baseUrl}/api/admin/estadisticas`);
  }

  getPedidosPorRestaurante(slug: string): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.baseUrl}/api/${slug}/admin/pedidos`);
  }

  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.baseUrl}/api/admin/clientes`);
  }

  // === GESTIÓN DE PEDIDOS ===
  getPedidosNuevos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.baseUrl}/admin/pedidos/nuevos`);
  }

  cambiarEstadoPedido(pedidoId: number, estado: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/pedido/estado`, {
      pedidoId,
      estado
    });
  }
}