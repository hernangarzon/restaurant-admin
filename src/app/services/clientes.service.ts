import { Injectable } from '@angular/core';
import { ClienteAdmin } from '../models/cliente-admin.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private clientes: ClienteAdmin[] = [];

  getClientes(restauranteId: number): ClienteAdmin[] {
    return this.clientes;
  }

  crearCliente(restauranteId: number, cliente: ClienteAdmin): void {
    cliente.id = Date.now();
    this.clientes.push(cliente);
  }

  actualizarCliente(restauranteId: number, cliente: ClienteAdmin): void {
    const index = this.clientes.findIndex(c => c.id === cliente.id);
    if (index !== -1) {
      this.clientes[index] = cliente;
    }
  }
  
}
