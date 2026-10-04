import { EstadoPedido } from '../models/estado-pedido';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Pedido } from '../models/pedido.model';
import { API_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly API_URL = API_URL;

  constructor(private http: HttpClient) { }

  getPedidosByRestaurante(restauranteId: number) {
    return this.http.get<Pedido[]>(`${this.API_URL}/admin/pedidos`, {
      params: { restauranteId },
    });
  }

  actualizarEstado(id: number, estado: EstadoPedido) {
    return this.http.put(`${this.API_URL}/admin/pedidos/${id}/estado`, null, {
      params: { estado },
    });
  }

  actualizarPedido(id: number, data: Partial<Pedido>): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.API_URL}/admin/pedidos/${id}`, data).pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('Error API Pedidos:', error);
    return throwError(() => error);
  }

  cancelarPedido(id: number) {
    return this.http.put(`${this.API_URL}/admin/pedidos/${id}/cancelar`, null);
  }

  getMensajesNoLeidos(restauranteId: number): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.API_URL}/admin/pedidos/mensajes/no-leidos?restauranteId=${restauranteId}`);
  }

  marcarMensajesLeidos(pedidoId: number): Observable<any> {
    return this.http.put(`${this.API_URL}/admin/pedidos/mensajes/${pedidoId}/marcar-leidos`, null);
  }

}
