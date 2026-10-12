import { DiaSemana } from './menu-dia.model';

export interface Producto {
  id?: number;
  nombre: string;      // máx. 24 caracteres (título de fila en WhatsApp)
  descripcion: string | null; // máx. 60
  precio: number;      // pesos
  activo: boolean;
  orden: number;
  dias: DiaSemana[];   // vacío = todos los días
  adicionIds: number[]; // adiciones que admite (máx. 9)
}

export const MAX_NOMBRE_PRODUCTO = 24;
export const MAX_DESCRIPCION_PRODUCTO = 60;
