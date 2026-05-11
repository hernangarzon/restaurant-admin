import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from '../models/cliente.model';
import { Pedido } from '../models/pedido.model';
import { API_URL } from './api.config';

export interface Estadisticas {
  totalPedidos: number;
  pedidosNuevos: number;
  pedidosEnPreparacion: number;
  pedidosListos: number;
  pedidosEntregados: number;
  totalClientes: number;
  ingresosEstimados?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BotApiService {
  private baseUrl = API_URL;

  constructor(private http: HttpClient) { }

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

  // ✅ NUEVO: Obtener historial de mensajes de Supabase/PostgreSQL
  getChatHistory(pedidoId: string | number): Observable<any[]> {
    // Ahora la variable dentro del ${} coincide con el parámetro de arriba
    // return this.http.get<any[]>(`${this.baseUrl}/admin/pedidos/mensajes/pedido/${pedidoId}`);
    return this.http.get<any[]>(`${this.baseUrl}/admin/pedidos/mensajes/${pedidoId}`);
  }


  // ✅ NUEVO: Enviar respuesta a través de la WhatsApp Cloud API
  enviarMensajeWhatsapp(payload: { clienteId: number, contenido: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/pedidos/enviar-mensaje`, payload);
  }

  actualizarPedido(pedidoId: number, datos: Partial<Pedido>): Observable<any> {
    // Usamos PATCH para actualizaciones parciales (solo descripción/dirección)
    // o POST según como tengas configurado tu backend en Spring Boot
    return this.http.put(`${this.baseUrl}/admin/pedidos/${pedidoId}`, datos);
  }

  getHistorialChat(clienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/pedidos/mensajes/${clienteId}`);
  }

  enviarMensajeManual(clienteId: number, contenido: string, pedidoId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/pedidos/enviar-mensaje`, {
      clienteId: clienteId.toString(),
      contenido: contenido,
      pedidoId: pedidoId.toString() // <--- Importante para el Backend
    });
  }

}