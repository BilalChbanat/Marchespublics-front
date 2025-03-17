import {ApplicationConfig, importProvidersFrom, provideZoneChangeDetection} from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import {HttpClientModule} from '@angular/common/http';
import {AuthInterceptor} from './interceptors/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), importProvidersFrom(HttpClientModule),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ]
};
