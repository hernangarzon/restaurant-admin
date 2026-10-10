import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Solo oculta la página; los endpoints /admin/superadmin exigen el rol en el backend
export const superadminGuard: CanActivateFn = () =>
  inject(AuthService).esSuperadmin() || inject(Router).parseUrl('/admin/dashboard');
