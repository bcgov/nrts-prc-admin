import { Component } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Router } from '@angular/router';
import { ApiService } from 'app/services/api';
import { JwtUtil } from 'app/jwt-util';
import { KeycloakService } from 'app/services/keycloak.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [
    trigger('toggleNav', [
      state('navClosed', style({
        height: '0',
      })),
      state('navOpen', style({
        height: '*',
      })),
      transition('navOpen => navClosed', [
        animate('0.2s')
      ]),
      transition('navClosed => navOpen', [
        animate('0.2s')
      ]),
    ]),
  ]
})

export class HeaderComponent {
  isNavMenuOpen = false;
  welcomeMsg: String;
  private _api: ApiService;
  private jwt: {
    username: String,
    realm_access: {
      roles: Array<String>
    }
    scopes: Array<String>
  };

  constructor (
    private api: ApiService,
    private keycloakService: KeycloakService,
    public router: Router
  ) {
    this._api = api;
    router.events.subscribe((val) => {
      const token = this.keycloakService.getToken();
      // TODO: Change this to observe the change in the _api.token
      if (token) {
        // console.log("token:", token);
        const jwt = new JwtUtil().decodeToken(token);
        // console.log("jwt:", jwt);
        this.welcomeMsg = jwt ? ('Hello ' + jwt.name) : 'Login';
        // console.log("this:", this.welcomeMsg);
        this.jwt = jwt;
      } else {
        this.welcomeMsg = 'Login';
        this.jwt = null;
      }
      // console.log('val:', val instanceof NavigationEnd);
    });
  }

  renderMenu(route: String) {
    // Sysadmin's get administration.
    if (route === 'administration') {
      return (this.jwt && this.jwt.realm_access.roles.find(x => x === 'sysadmin') && this.jwt.username === 'admin');
    }
  }

  navigateToLogout() {
    // reset login status
    this.api.logout();
    window.location.href = this.keycloakService.getLogoutURL();
  }

  toggleNav() {
    this.isNavMenuOpen = !this.isNavMenuOpen;
  }

  closeNav() {
    this.isNavMenuOpen = false;
  }
}
