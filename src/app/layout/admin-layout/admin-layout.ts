import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { interval, Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { PedidoService } from '../../services/pedidos.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.css'],
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  username: string | null = '';
  mensajesNoLeidos = 0;
  mostrarToast = false;
  toastMensaje = '';
  private pollingSubscription?: Subscription;
  private anteriorConteo = 0;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private pedidoService: PedidoService
  ) {
    this.username = this.authService.getUsername();
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  ngOnInit() {
    this.consultarMensajes();
    this.pollingSubscription = interval(15000).subscribe(() => {
      this.consultarMensajes();
    });
  }

  ngOnDestroy() {
    this.pollingSubscription?.unsubscribe();
  }

  private consultarMensajes() {
    const restauranteId = this.authService.getRestauranteId();
    if (!restauranteId) return;

    this.pedidoService.getMensajesNoLeidos(restauranteId).subscribe((res: { total: number }) => {
      if (res.total > this.anteriorConteo && this.anteriorConteo > 0) {
        this.mostrarNotificacion(`📩 Tienes ${res.total} pedido(s) con mensajes nuevos`);
      }
      this.anteriorConteo = res.total;
      this.mensajesNoLeidos = res.total;
      this.cdr.detectChanges();
    });
  }

  mostrarNotificacion(mensaje: string) {
    this.toastMensaje = mensaje;
    this.mostrarToast = true;
    setTimeout(() => {
      this.mostrarToast = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  logout() {
    const confirmar = window.confirm('🚪 ¿Estás seguro que deseas cerrar sesión?');
    if (confirmar) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}