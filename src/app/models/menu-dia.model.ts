export interface MenuDia {
  id?: number;
  diaSemana: DiaSemana;
  menu: string;
  activo: boolean;
}

export type DiaSemana =
  | 'LUNES'
  | 'MARTES'
  | 'MIERCOLES'
  | 'JUEVES'
  | 'VIERNES'
  | 'SABADO'
  | 'DOMINGO';
