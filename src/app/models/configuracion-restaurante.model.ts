export interface ConfiguracionRestaurante {
  nombre: string;
  telefonoWhatsapp: string | null; // solo lectura
  direccion: string | null;
  horario: string | null;
  horaInicio: string | null; // "HH:mm" o "HH:mm:ss"
  horaFin: string | null;
  observacion: string | null;
  tiempoEstimado: string | null;
  datosPago: string | null;
  costoDomicilio: number | null; // pesos; null = sin costo
  pedidoMinimo: number | null;   // pesos, sin domicilio; null = sin mínimo
}
