import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { rotas } from './app.routes';
import { erroHttpInterceptor } from './nucleo/interceptores/erro-http.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(rotas, withComponentInputBinding()),
    provideHttpClient(withInterceptors([erroHttpInterceptor])),
    provideAnimations()
  ]
};
