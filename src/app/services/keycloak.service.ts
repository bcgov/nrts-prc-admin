import { Injectable } from '@angular/core';
import { JwtUtil } from 'app/jwt-util';
import { Observable } from 'rxjs';
import * as _ from 'lodash';

declare global {
  /* tslint:disable-next-line:interface-name */
  interface Window {
    Keycloak: any;
  }
}

@Injectable()
export class KeycloakService {
  private keycloakAuth: any;
  private keycloakEnabled: boolean;
  private keycloakUrl: string;
  private keycloakRealm: string;
  private loggedOut: string;

  constructor() {
    switch (window.location.origin) {
      case 'http://localhost:4200':
      case 'https://nrts-prc-dev.pathfinder.gov.bc.ca':
      case 'https://nrts-prc-master.pathfinder.gov.bc.ca':
      case 'https://acrfd-86cabb-dev.apps.silver.devops.gov.bc.ca':
      case 'https://acrfd-admin-86cabb-dev.apps.silver.devops.gov.bc.ca':
        this.keycloakEnabled = true;
        this.keycloakUrl = 'https://dev.loginproxy.gov.bc.ca/auth';
        this.keycloakRealm = 'standard';
        break;

      case 'https://nrts-prc-test.pathfinder.gov.bc.ca':
      case 'https://acrfd-86cabb-test.apps.silver.devops.gov.bc.ca':
        this.keycloakEnabled = true;
        this.keycloakUrl = 'https://test.loginproxy.gov.bc.ca/auth';
        this.keycloakRealm = 'standard';
        break;

      default:
        this.keycloakEnabled = true;
        this.keycloakUrl = 'https://loginproxy.gov.bc.ca/auth';
        this.keycloakRealm = 'standard';
    }
  }

  isKeyCloakEnabled(): boolean {
    return this.keycloakEnabled;
  }

  private getParameterByName(name) {
    const url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) {
      return null;
    }
    if (!results[2]) {
      return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  init(): Promise<any> {
    this.loggedOut = this.getParameterByName('loggedout');

    if (!this.keycloakEnabled) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const config = {
        url: this.keycloakUrl,
        realm: this.keycloakRealm,
        clientId: 'acrfd-4192'
      };

      if (typeof window.Keycloak !== 'function') {
        console.error('❌ Keycloak script not loaded in time');
        return reject('Keycloak not available');
      }

      this.keycloakAuth = new window.Keycloak(config);

      this.keycloakAuth.onAuthSuccess = () => {};
      this.keycloakAuth.onAuthError = () => {
        console.log('onAuthError');
      };
      this.keycloakAuth.onAuthRefreshSuccess = () => {};
      this.keycloakAuth.onAuthRefreshError = () => {
        console.log('onAuthRefreshError');
      };
      this.keycloakAuth.onAuthLogout = () => {};

      this.keycloakAuth.onTokenExpired = () => {
        this.keycloakAuth
          .updateToken(30)
          .then(refreshed => {
            console.log('KC refreshed token?:', refreshed);
          })
          .catch(err => {
            console.log('KC refresh error:', err);
          });
      };

      const initOptions = {
        checkLoginIframe: false,
        pkceMethod: 'S256',
        onLoad: 'login-required'
      };

      this.keycloakAuth
        .init(initOptions)
        .then(auth => {
          console.log('KC Success:', auth);
          if (!auth) {
            if (this.loggedOut === 'true') {
              resolve();
            } else {
              this.keycloakAuth.login({ idpHint: 'idir' });
            }
          } else {
            resolve();
          }
        })
        .catch(err => {
          console.log('KC error:', err);
          reject(err);
        });
    });
  }

  isValidForSite(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    const jwt = new JwtUtil().decodeToken(token);
    if (jwt && jwt.client_roles) {
      return _.includes(jwt.client_roles, 'sysadmin');
    } else {
      return false;
    }
  }

  getToken(): string {
    if (!this.keycloakEnabled) {
      const currentUser = JSON.parse(window.localStorage.getItem('currentUser'));
      return currentUser ? currentUser.token : null;
    }

    return this.keycloakAuth.token;
  }

  refreshToken(): Observable<any> {
    return new Observable(observer => {
      this.keycloakAuth
        .updateToken(30)
        .then(refreshed => {
          console.log('KC refreshed token?:', refreshed);
          observer.next();
          observer.complete();
        })
        .catch(err => {
          console.log('KC refresh error:', err);
          observer.error();
        });

      return { unsubscribe() {} };
    });
  }

  getLogoutURL(): string {
    if (this.keycloakEnabled) {
      return (
        this.keycloakAuth.authServerUrl +
        '/realms/' +
        this.keycloakRealm +
        '/protocol/openid-connect/logout?redirect_uri=' +
        window.location.origin +
        '/admin/not-authorized?loggedout=true'
      );
    } else {
      return window.location.origin + '/admin/login';
    }
  }
}
