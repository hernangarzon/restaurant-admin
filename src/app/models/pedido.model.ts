import { EstadoPedido } from './estado-pedido';

export interface Pedido {
  id: number;
  descripcion: string;
  direccion: string | null;
  estado: EstadoPedido;
  fecha: string;
  medioPago?: string;  // 👈 NUEVO CAMPO (opcional)
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
  clienteId?: number;
  // Pedido hecho con el catálogo (nulos/vacío en pedidos de texto libre)
  observacion?: string | null;
  subtotal?: number | null;
  costoDomicilio?: number | null;
  total?: number | null;
  items?: ItemPedido[];
}

export interface ItemPedido {
  nombre: string;
  cantidad: number;
  precioUnitario: number; // incluye las adiciones
  subtotal: number;
  adiciones?: string | null; // "Helado, Queso"
}