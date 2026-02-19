import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { PedidosComponent } from './pages/pedidos/pedidos';
import { ClientesComponent } from './pages/clientes/clientes';
import { LoginComponent } from './login/login';
import { AuthGuard } from './auth/auth.guard';
import { MenuDiaComponent } from './pages/menu-dia/menu-dia';
import { ChangePasswordComponent } from './pages/change-password/change-password';
import { LoginGuard } from './auth/login.guard';

export const routes: Routes = [
  // 🔐 Login
  { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },

  // 🛠️ Admin
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'pedidos', component: PedidosComponent },
      { path: 'clientes', component: ClientesComponent },
      { path: 'menu-dia', component: MenuDiaComponent },
      { path: 'change-password', component: ChangePasswordComponent},
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // 🌍 Root
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // 🚨 Fallback
  { path: '**', redirectTo: 'login' },
];
