import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClienteAdmin } from '../../models/cliente-admin.model';
import { ClienteService } from '../../services/clientes.service';
import { RestauranteService } from '../../services/restaurante.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.html',
  styleUrls: ['./clientes.css'],
})
export class ClientesComponent implements OnInit {

  clientes: ClienteAdmin[] = [];
  mostrarFormulario = false;

  nuevoCliente: Partial<ClienteAdmin> = {
    nombre: '',
    telefono: '',
    email: '',
    activo: true
  }; 

  constructor(
    private clienteService: ClienteService,
    private restauranteService: RestauranteService
  ) {}

  ngOnInit(): void {
    const restaurante = this.restauranteService.getRestaurante();
    if (!restaurante) {
      console.error('No hay restaurante activo');
      return;
    }

    this.clientes = this.clienteService.getClientes(restaurante.id);
  }

  crearCliente() {
    const restaurante = this.restauranteService.getRestaurante();
    if (!restaurante) {
      console.error('No hay restaurante activo');
      return;
    }

    this.clienteService.crearCliente(
      restaurante.id,
      this.nuevoCliente as ClienteAdmin
    );

    this.clientes = this.clienteService.getClientes(restaurante.id);
    this.cancelar();
  }

  toggleActivo(cliente: ClienteAdmin) {
    const restaurante = this.restauranteService.getRestaurante();
    if (!restaurante) {
      console.error('No hay restaurante activo');
      return;
    }

    cliente.activo = !cliente.activo;
    this.clienteService.actualizarCliente(restaurante.id, cliente);
  }

  cancelar() {
    this.mostrarFormulario = false;
    this.nuevoCliente = {
      nombre: '',
      telefono: '',
      email: '',
      activo: true
    };
  }
}
