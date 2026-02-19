import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    // Configura con TUS credenciales de Supabase
    const supabaseUrl = 'https://tu-proyecto.supabase.co';  // REEMPLAZA con tu URL
    const supabaseKey = 'tu-clave-publica-anon';           // REEMPLAZA con tu anon key
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}