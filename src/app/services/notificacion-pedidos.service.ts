import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { API_URL } from './api.config';

interface ResumenPedidos {
  nuevos: number;
  ultimoPedidoId: number;
}

const CLAVE_SONIDO = 'sonido_pedidos';
const TITULO_BASE = 'Restaurant Admin';

/**
 * Avisa cuando entra un pedido nuevo: sonido, notificación del navegador y contador en la pestaña.
 * El layout llama a consultar() periódicamente.
 *
 * Los navegadores solo permiten sonar después de una interacción del usuario, por eso el sonido
 * se activa con un clic (activarSonido) y tras recargar puede quedar "bloqueado" hasta otro clic.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionPedidosService {
  private readonly http = inject(HttpClient);
  private readonly title = inject(Title);

  /** Pedidos en estado NUEVO */
  readonly nuevos = signal(0);
  /** Id del último pedido; cambia cuando entra uno nuevo (las páginas lo usan para recargar) */
  readonly ultimoPedidoId = signal(0);
  /** Texto del último aviso, para el toast del layout */
  readonly ultimoAviso = signal<{ texto: string; momento: number } | null>(null);

  private readonly sonidoPreferido = signal(this.leerPreferencia());
  private readonly audioListo = signal(false);
  /** El usuario quiere sonido pero el navegador aún no lo permite: hay que pedir un clic */
  readonly sonidoBloqueado = computed(() => this.sonidoPreferido() && !this.audioListo());
  readonly sonidoActivo = computed(() => this.sonidoPreferido() && this.audioListo());

  private audio?: AudioContext;
  private referencia: number | null = null; // null = aún no hubo primera consulta

  constructor() {
    if (this.sonidoPreferido()) {
      this.prepararAudio();
    }
  }

  consultar(): void {
    this.http.get<ResumenPedidos>(`${API_URL}/admin/pedidos/resumen`).subscribe({
      next: (r) => {
        this.nuevos.set(r.nuevos);
        this.title.setTitle(r.nuevos > 0 ? `(${r.nuevos}) ${TITULO_BASE}` : TITULO_BASE);

        // La primera consulta solo fija la referencia: no avisar de pedidos que ya existían
        if (this.referencia !== null && r.ultimoPedidoId > this.referencia) {
          this.avisar(r.ultimoPedidoId - this.referencia);
        }
        this.referencia = r.ultimoPedidoId;
        this.ultimoPedidoId.set(r.ultimoPedidoId);
      },
      error: () => {
        // Silencioso: el siguiente ciclo vuelve a intentar (el interceptor maneja 401/403)
      },
    });
  }

  /** Debe llamarse desde un clic del usuario */
  activarSonido(): void {
    this.sonidoPreferido.set(true);
    this.guardarPreferencia(true);
    this.prepararAudio();
    this.beep(1);

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  desactivarSonido(): void {
    this.sonidoPreferido.set(false);
    this.guardarPreferencia(false);
  }

  /** Limpia el estado al salir del panel */
  reiniciar(): void {
    this.referencia = null;
    this.nuevos.set(0);
    this.title.setTitle(TITULO_BASE);
  }

  private avisar(cantidad: number): void {
    const texto = cantidad === 1 ? '🛎️ ¡Nuevo pedido!' : `🛎️ ¡${cantidad} pedidos nuevos!`;
    this.ultimoAviso.set({ texto, momento: Date.now() });

    if (this.sonidoActivo()) {
      this.beep(3);
    }

    // Notificación del sistema solo si la pestaña no está a la vista
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
      new Notification(texto, { body: 'Revisa la sección Pedidos', tag: 'pedido-nuevo' });
    }
  }

  private prepararAudio(): void {
    try {
      this.audio ??= new AudioContext();
      this.audio.onstatechange = () => this.audioListo.set(this.audio?.state === 'running');
      this.audio.resume().catch(() => undefined);
      this.audioListo.set(this.audio.state === 'running');
    } catch {
      this.audioListo.set(false); // navegador sin Web Audio
    }
  }

  // Tonos cortos generados con Web Audio (no requiere archivo de sonido)
  private beep(veces: number): void {
    const ctx = this.audio;
    if (!ctx || ctx.state !== 'running') return;

    for (let i = 0; i < veces; i++) {
      const inicio = ctx.currentTime + i * 0.35;
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      vol.gain.setValueAtTime(0.0001, inicio);
      vol.gain.exponentialRampToValueAtTime(0.4, inicio + 0.02);
      vol.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.25);
      osc.connect(vol).connect(ctx.destination);
      osc.start(inicio);
      osc.stop(inicio + 0.3);
    }
  }

  private leerPreferencia(): boolean {
    try {
      return localStorage.getItem(CLAVE_SONIDO) === 'si';
    } catch {
      return false;
    }
  }

  private guardarPreferencia(activo: boolean): void {
    try {
      localStorage.setItem(CLAVE_SONIDO, activo ? 'si' : 'no');
    } catch {
      // sin almacenamiento: la preferencia dura solo esta sesión
    }
  }
}
