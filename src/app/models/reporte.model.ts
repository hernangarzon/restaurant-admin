export interface VentasDia {
  fecha: string; // "2026-10-06"
  pedidos: number;
  ventas: number;
}

export interface ProductoVendido {
  nombre: string;
  cantidad: number;
  ventas: number;
}

export interface Reporte {
  dias: number;
  ventasHoy: number;
  pedidosHoy: number;
  ventasPeriodo: number;
  pedidosPeriodo: number;
  ticketPromedio: number;
  clientesUnicos: number;
  clientesRecurrentes: number;
  porDia: VentasDia[];
  topProductos: ProductoVendido[];
}
