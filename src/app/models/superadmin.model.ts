export interface ResumenRestaurante {
  id: number;
  nombre: string;
  slug: string;
  telefonoWhatsapp: string | null;
  whatsappPhoneId: string;
  activo: boolean;
  admins: number;
  pedidosUltimos30Dias: number;
  ultimoPedido: string | null;
}

export interface NuevoRestaurante {
  nombre: string;
  slug: string;
  telefonoWhatsapp: string;
  whatsappPhoneId: string;
  adminTelefono: string;
  adminEmail: string;
}

export interface ResumenAdmin {
  id: number;
  telefono: string;
  email: string | null;
  rol: 'ADMIN' | 'SUPERADMIN';
  activo: boolean;
  debeCambiarPassword: boolean;
}

/** La contraseña temporal solo llega una vez */
export interface Credenciales {
  restauranteId: number;
  adminId: number;
  telefono: string;
  passwordTemporal: string;
}
