import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { LOCALE_ID, importProvidersFrom } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { FormsModule } from '@angular/forms';
import { routes } from './app.routes';
import { authInterceptor } from './auth/auth.interceptor';

// Fechas y números en español de Colombia ("mar 6 oct")
registerLocaleData(localeEsCo);

export const appConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-CO' },
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    importProvidersFrom(FormsModule)
  ]
};