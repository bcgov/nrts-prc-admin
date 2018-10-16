import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api';
import { KeycloakService } from 'app/services/keycloak.service';

@Component({
  selector: 'app-login',
  moduleId: module.id,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
  model: any = {};
  loading = false;
  error = '';

  constructor(
    private router: Router,
    private api: ApiService,
    private keycloakService: KeycloakService
  ) { }

  ngOnInit() {
    // Redir to the main index page if they try to get here.
    if (this.keycloakService.isKeyCloakEnabled()) {
      this.router.navigate(['/']);
    }
  }

  login() {
    this.loading = true;

    this.api.login(this.model.username, this.model.password).subscribe(
      result => {
        if (result === true) {
          // login successful
          this.router.navigate(['/']);
        }
      },
      error => {
        this.error = 'Username or password is incorrect';
        this.loading = false;
      }
    );
  }
}
