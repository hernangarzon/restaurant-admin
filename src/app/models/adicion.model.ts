export interface Adicion {
  id?: number;
  nombre: string; // máx. 24 (título de fila en WhatsApp)
  precio: number; // pesos que se suman a cada unidad del producto
  activo: boolean;
  orden: number;
}

export const MAX_ADICIONES_POR_PRODUCTO = 9; // lista de WhatsApp: 9 adiciones + "Listo"
