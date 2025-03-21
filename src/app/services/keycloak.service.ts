import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as _ from 'lodash';
import Keycloak from 'keycloak-js';

import { JwtUtil } from 'app/jwt-util';

@Injectable()
export class KeycloakService {
  private keycloak: any;

  private keycloakEnabled = true;
  private keycloakUrl: string;
  private keycloakRealm: string;
  private clientId = 'acrfd-4192';

  constructor() {
    const origin = window.location.origin;

    switch (origin) {
      case 'http://localhost:4200':
      case 'https://nrts-prc-dev.pathfinder.gov.bc.ca':
      case 'https://nrts-prc-master.pathfinder.gov.bc.ca':
      case 'https://acrfd-86cabb-dev.apps.silver.devops.gov.bc.ca':
      case 'https://acrfd-admin-86cabb-dev.apps.silver.devops.gov.bc.ca':
        this.keycloakUrl = 'https://dev.oidc.gov.bc.ca/auth';
        this.keycloakRealm = 'prc';
        break;

      case 'https://nrts-prc-test.pathfinder.gov.bc.ca':
      case 'https://acrfd-86cabb-test.apps.silver.devops.gov.bc.ca':
        this.keycloakUrl = 'https://test.loginproxy.gov.bc.ca';
        this.keycloakRealm = 'standard';
        break;

      default:
        this.keycloakUrl = 'https://loginproxy.gov.bc.ca/auth';
        this.keycloakRealm = 'standard';
    }
  }

  isKeyCloakEnabled(): boolean {
    return this.keycloakEnabled;
  }

  init(): Promise<boolean> {
    if (!this.keycloakEnabled) {
      console.warn('[Keycloak] Disabled, skipping init.');
      return Promise.resolve(true);
    }

    this.keycloak = new Keycloak({
      url: this.keycloakUrl,
      realm: this.keycloakRealm,
      clientId: this.clientId
    });

    return this.keycloak
      .init({
        onLoad: 'login-required',
        checkLoginIframe: false,
        pkceMethod: 'S256',
        redirectUri: `${window.location.origin}/admin/`
      })
      .then(authenticated => {
        console.log('[Keycloak] Initialized. Authenticated:', authenticated);

        if (!authenticated) {
          console.warn('[Keycloak] Not authenticated after init.');
          return Promise.reject('Not authenticated');
        }

        if (!this.keycloak.token) {
          console.error('[Keycloak] Token is missing after init.');
          return Promise.reject('Missing token');
        }

        console.log('[Keycloak] Token present:', this.keycloak.token);

        // Clean up Keycloak hash fragments like #iss=
        if (window.location.hash.includes('iss=')) {
          history.replaceState(null, '', window.location.pathname);
          console.log('[Keycloak] Cleaned up hash from URL.');
        }

        return true;
      })
      .catch(err => {
        console.error('[Keycloak] Init error:', err);
        return Promise.reject(err);
      });
  }

  getToken(): string {
    return this.keycloak ? .token || '' ;
  }

  refreshToken(): Observable<void> {
    return new Observable(observer => {
      this.keycloak
        .updateToken(30)
        .then(refreshed => {
          console.log('Token refreshed:', refreshed);
          observer.next();
          observer.complete();
        })
        .catch(err => {
          console.error('Token refresh failed:', err);
          observer.error(err);
        });
    });
  }

  isValidForSite(): boolean {
    const token = this.getToken();
    if (!token) { return false; }

    const jwt = new JwtUtil().decodeToken(token);
    return jwt && jwt.realm_access && _.includes(jwt.realm_access.roles, 'sysadmin');
  }

  logout(): void {
    this.keycloak.logout({
      redirectUri: `${window.location.origin}/admin/not-authorized?loggedout=true`
    });
  }

  getLogoutURL(): string {
    return (
      `${this.keycloakUrl}/realms/${this.keycloakRealm}/protocol/openid-connect/logout` +
      `?redirect_uri=${encodeURIComponent(window.location.origin + '/admin/not-authorized?loggedout=true')}`
    );
  }
}
