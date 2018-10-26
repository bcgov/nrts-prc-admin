import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/merge';
import { of } from 'rxjs';
import * as _ from 'lodash';

import { ApiService } from './api';
import { SearchResults } from 'app/models/search';
import { Client } from 'app/models/client';

@Injectable()
export class SearchService {
  private clients: Array<Client> = null;

  constructor(private api: ApiService) { }

  // get clients by Disposition Transaction ID
  getClientsByDTID(dtid: number): Observable<Client[]> {
    this.clients = [];
    const self = this;

    return this.api.getClientsByDTID(dtid)
      .map(res => {
        _.each(res, function (client) {
          self.clients.push(new Client(client));
        });
        this.clients = self.clients;
        return this.clients;
      })
      .catch(error => this.api.handleError(error));
  }

  // get search results by array of CLIDs or DTIDs
  getByClidDtid(keys: string[]): Observable<SearchResults> {
    const observables = keys.map(key => { return this.getByCLID(key); })
      .concat(keys.map(key => { return this.getByDTID(+key); }));
    return of(null).merge(...observables)
      .catch(error => this.api.handleError(error));
  }

  // get search results by CL File #
  getByCLID(clid: string): Observable<SearchResults> {
    return this.api.getAppsByCLID(clid)
      .catch(error => this.api.handleError(error));
  }

  // get search results by Disposition Transaction ID
  getByDTID(dtid: number): Observable<SearchResults> {
    return this.api.getAppsByDTID(dtid)
      .catch(error => this.api.handleError(error));
  }
}
