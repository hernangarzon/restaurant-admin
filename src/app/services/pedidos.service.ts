import { EstadoPedido } from '../models/estado-pedido';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Pedido } from '../models/pedido.model';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly API_URL = 'http://localhost:8091';

  constructor(private http: HttpClient) {}

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

  crearPedido(pedido: Pedido): Observable<Pedido> {
    return this.http.post<Pedido>(this.API_URL, pedido).pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('Error API Pedidos:', error);
    return throwError(() => error);
  }

  getPedidos(params: any) {
    return this.http.get<Pedido[]>(`${this.API_URL}/admin/pedidos`, { params });
  }

  cancelarPedido(id: number) {
    return this.http.put(`${this.API_URL}/admin/pedidos/${id}/cancelar`, null);
  }
}
