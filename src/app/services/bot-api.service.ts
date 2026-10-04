import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pedido } from '../models/pedido.model';
import { API_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class BotApiService {
  private baseUrl = API_URL;

  constructor(private http: HttpClient) { }

  // Historial de mensajes del pedido (el backend los marca como leídos)
  getChatHistory(pedidoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/pedidos/mensajes/${pedidoId}`);
  }

  actualizarPedido(pedidoId: number, datos: Partial<Pedido>): Observable<any> {
    return this.http.put(`${this.baseUrl}/admin/pedidos/${pedidoId}`, datos);
  }

  // Envía la respuesta por WhatsApp y la guarda en el hilo del pedido
  enviarMensajeManual(clienteId: number, contenido: string, pedidoId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/pedidos/enviar-mensaje`, {
      clienteId: clienteId.toString(),
      contenido: contenido,
      pedidoId: pedidoId.toString()
    });
  }

}
