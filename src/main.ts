import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import 'hammerjs'; // https://material.angular.io/guide/getting-started#step-5-gesture-support

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

function loadKeycloakScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/keycloak-js@25.0.6/dist/keycloak.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject('Failed to load Keycloak');
    document.head.appendChild(script);
  });
}

loadKeycloakScript().then(() => {
  // Only start Angular app after Keycloak is loaded
  platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch(err => console.error(err));
});

platformBrowserDynamic().bootstrapModule(AppModule);
