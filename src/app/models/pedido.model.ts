import { EstadoPedido } from './estado-pedido';

export interface Pedido {
  id: number;
  descripcion: string;
  direccion: string | null;
  estado: EstadoPedido;
  fecha: string;
  cliente: {
    id: number;
    telefono: string;
    estado: string;
  };
  restaurante?: {
    id: number;
    nombre: string;
    slug: string;
  };
  telefonoCliente?: string;
  nombreCliente?: string;
}