export interface Cliente {
  id: number;
  telefono: string;
  estado: string;
  restaurante?: {
    id: number;
    nombre: string;
    slug: string;
  };
}
