import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
// import { Params } from '@angular/router';
// import { JwtHelperService } from '@auth0/angular-jwt';
// import { Observable } from 'rxjs';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

import { KeycloakService } from 'app/services/keycloak.service';

import { Application } from 'app/models/application';
import { Comment } from 'app/models/comment';
import { CommentPeriod } from 'app/models/commentperiod';
import { Decision } from 'app/models/decision';
import { Document } from 'app/models/document';
import { Feature } from 'app/models/feature';
import { SearchResults } from 'app/models/search';
import { User } from 'app/models/user';

interface ILocalLoginResponse {
  _id: string;
  title: string;
  created_at: string;
  startTime: string;
  endTime: string;
  state: boolean;
  accessToken: string;
}

/**
 * refreshApplication response type.
 *
 * @interface IRefreshApplicationResponse
 */
interface IRefreshApplicationResponse {
  application: Application;
  features: Feature[];
}

@Injectable()
export class ApiService {
  public token: string;
  public isMS: boolean; // IE, Edge, etc
  // private jwtHelper: JwtHelperService;
  pathAPI: string;
  // params: Params;
  env: 'local' | 'dev' | 'test' | 'demo' | 'scale' | 'beta' | 'master' | 'prod';

  constructor(private http: HttpClient, private keycloakService: KeycloakService) {
    // this.jwtHelper = new JwtHelperService();
    const currentUser = JSON.parse(window.localStorage.getItem('currentUser'));
    this.token = currentUser && currentUser.token;
    this.isMS = window.navigator.msSaveOrOpenBlob ? true : false;

    const { hostname } = window.location;
    switch (hostname) {
      case 'localhost':
        // Local
        this.pathAPI = 'http://localhost:3000/api';
        this.env = 'local';
        break;

      case 'nrts-prc-dev.pathfinder.gov.bc.ca':
        // Dev
        this.pathAPI = 'https://nrts-prc-dev.pathfinder.gov.bc.ca/api';
        this.env = 'dev';
        break;

      case 'nrts-prc-test.pathfinder.gov.bc.ca':
        // Test
        this.pathAPI = 'https://nrts-prc-test.pathfinder.gov.bc.ca/api';
        this.env = 'test';
        break;

      case 'nrts-prc-demo.pathfinder.gov.bc.ca':
        // Demo
        this.pathAPI = 'https://nrts-prc-demo.pathfinder.gov.bc.ca/api';
        this.env = 'demo';
        break;

      case 'nrts-prc-scale.pathfinder.gov.bc.ca':
        // Scale
        this.pathAPI = 'https://nrts-prc-scale.pathfinder.gov.bc.ca/api';
        this.env = 'scale';
        break;

      case 'nrts-prc-beta.pathfinder.gov.bc.ca':
        // Beta
        this.pathAPI = 'https://nrts-prc-beta.pathfinder.gov.bc.ca/api';
        this.env = 'beta';
        break;

      case 'nrts-prc-master.pathfinder.gov.bc.ca':
        // Master
        this.pathAPI = 'https://nrts-prc-master.pathfinder.gov.bc.ca/api';
        this.env = 'master';
        break;

      default:
        // Prod
        this.pathAPI = 'https://comment.nrs.gov.bc.ca/api';
        this.env = 'prod';
    }
  }

  handleError(error: any): Observable<never> {
    const reason = error.message
      ? error.error
        ? `${error.message} - ${error.error.message}`
        : error.message
      : error.status
      ? `${error.status} - ${error.statusText}`
      : 'Server error';
    console.log('API error =', reason);
    if (error && error.status === 403 && !this.keycloakService.isKeyCloakEnabled()) {
      window.location.href = '/admin/login';
    }
    return throwError(error);
  }

  login(username: string, password: string): Observable<boolean> {
    return this.http
      .post<ILocalLoginResponse>(`${this.pathAPI}/login/token`, { username: username, password: password })
      .pipe(
        map(res => {
          // login successful if there's a jwt token in the response
          if (res && res.accessToken) {
            this.token = res.accessToken;

            // store username and jwt token in local storage to keep user logged in between page refreshes
            window.localStorage.setItem('currentUser', JSON.stringify({ username: username, token: this.token }));

            return true; // successful login
          }
          return false; // failed login
        })
      );
  }

  logout() {
    // clear token + remove user from local storage to log user out
    this.token = null;
    window.localStorage.removeItem('currentUser');
  }

  //
  // Applications
  //
  getApplications(pageNum: number, pageSize: number): Observable<Application[]> {
    const fields = [
      'agency',
      'areaHectares',
      'businessUnit',
      'centroid',
      'cl_file',
      'client',
      'description',
      'legalDescription',
      'location',
      'name',
      'publishDate',
      'purpose',
      'status',
      'reason',
      'statusHistoryEffectiveDate',
      'subpurpose',
      'subtype',
      'tantalisID',
      'tenureStage',
      'type'
    ];
    let queryString = 'application?isDeleted=false&';
    if (pageNum !== null) {
      queryString += `pageNum=${pageNum}&`;
    }
    if (pageSize !== null) {
      queryString += `pageSize=${pageSize}&`;
    }
    queryString += `fields=${this.buildValues(fields)}`;
    return this.http.get<Application[]>(`${this.pathAPI}/${queryString}`, {});
  }

  // NB: returns array with 1 element
  getApplication(id: string): Observable<Application[]> {
    const fields = [
      'agency',
      'areaHectares',
      'businessUnit',
      'centroid',
      'cl_file',
      'client',
      'description',
      'legalDescription',
      'location',
      'name',
      'publishDate',
      'purpose',
      'status',
      'reason',
      'statusHistoryEffectiveDate',
      'subpurpose',
      'subtype',
      'tantalisID',
      'tenureStage',
      'type'
    ];
    const queryString = `application/${id}?isDeleted=false&fields=${this.buildValues(fields)}`;
    return this.http.get<Application[]>(`${this.pathAPI}/${queryString}`, {});
  }

  getCountApplications(): Observable<number> {
    const queryString = 'application?isDeleted=false';
    return this.http.head<HttpResponse<object>>(`${this.pathAPI}/${queryString}`, { observe: 'response' }).pipe(
      map(res => {
        // retrieve the count from the response headers
        return parseInt(res.headers.get('x-total-count'), 10);
      })
    );
  }

  // NB: returns array
  getApplicationsByCrownLandID(clid: string): Observable<Application[]> {
    const fields = [
      'agency',
      'areaHectares',
      'businessUnit',
      'centroid',
      'cl_file',
      'client',
      'description',
      'internal',
      'legalDescription',
      'location',
      'name',
      'publishDate',
      'purpose',
      'status',
      'reason',
      'statusHistoryEffectiveDate',
      'subpurpose',
      'subtype',
      'tantalisID',
      'tenureStage',
      'type'
    ];
    const queryString = `application?isDeleted=false&cl_file=${clid}&fields=${this.buildValues(fields)}`;
    return this.http.get<Application[]>(`${this.pathAPI}/${queryString}`, {});
  }

  // NB: returns array with 1 element
  getApplicationByTantalisId(tantalisId: number): Observable<Application[]> {
    const fields = [
      'agency',
      'areaHectares',
      'businessUnit',
      'centroid',
      'cl_file',
      'client',
      'description',
      'legalDescription',
      'location',
      'name',
      'publishDate',
      'purpose',
      'status',
      'reason',
      'statusHistoryEffectiveDate',
      'subpurpose',
      'subtype',
      'tantalisID',
      'tenureStage',
      'type'
    ];
    const queryString = `application?isDeleted=false&tantalisId=${tantalisId}&fields=${this.buildValues(fields)}`;
    return this.http.get<Application[]>(`${this.pathAPI}/${queryString}`, {});
  }

  addApplication(app: Application): Observable<Application> {
    const queryString = 'application/';
    return this.http.post<Application>(`${this.pathAPI}/${queryString}`, app, {});
  }

  publishApplication(app: Application): Observable<Application> {
    const queryString = `application/${app._id}/publish`;
    return this.http.put<Application>(`${this.pathAPI}/${queryString}`, app, {});
  }

  unPublishApplication(app: Application): Observable<Application> {
    const queryString = `application/${app._id}/unpublish`;
    return this.http.put<Application>(`${this.pathAPI}/${queryString}`, app, {});
  }

  deleteApplication(app: Application): Observable<Application> {
    const queryString = `application/${app._id}`;
    return this.http.delete<Application>(`${this.pathAPI}/${queryString}`, {});
  }

  refreshApplication(app: Application): Observable<IRefreshApplicationResponse> {
    const queryString = `application/${app._id}/refresh`;
    return this.http.put<IRefreshApplicationResponse>(`${this.pathAPI}/${queryString}`, {});
  }

  saveApplication(app: Application): Observable<Application> {
    const queryString = `application/${app._id}`;
    return this.http.put<Application>(`${this.pathAPI}/${queryString}`, app, {});
  }

  //
  // Features
  //
  getFeaturesByTantalisId(tantalisId: number): Observable<Feature[]> {
    const fields = ['type', 'tags', 'geometry', 'properties', 'isDeleted', 'applicationID'];
    const queryString = `feature?isDeleted=false&tantalisId=${tantalisId}&fields=${this.buildValues(fields)}`;
    return this.http.get<Feature[]>(`${this.pathAPI}/${queryString}`, {});
  }

  getFeaturesByApplicationId(applicationId: string): Observable<Feature[]> {
    const fields = ['type', 'tags', 'geometry', 'properties', 'isDeleted', 'applicationID'];
    const queryString = `feature?isDeleted=false&applicationId=${applicationId}&fields=${this.buildValues(fields)}`;
    return this.http.get<Feature[]>(`${this.pathAPI}/${queryString}`, {});
  }

  deleteFeaturesByApplicationId(applicationID: string): Observable<object> {
    const queryString = `feature/?applicationID=${applicationID}`;
    return this.http.delete(`${this.pathAPI}/${queryString}`, {});
  }

  addFeature(feature: Feature): Observable<Feature> {
    const queryString = 'feature/';
    return this.http.post<Feature>(`${this.pathAPI}/${queryString}`, feature, {});
  }

  saveFeature(feature: Feature): Observable<Feature> {
    const queryString = `feature/${feature._id}`;
    return this.http.put<Feature>(`${this.pathAPI}/${queryString}`, feature, {});
  }

  //
  // Decisions
  //
  getDecisionsByAppId(appId: string): Observable<Decision[]> {
    const fields = ['_addedBy', '_application', 'name', 'description'];
    const queryString = `decision?_application=${appId}&fields=${this.buildValues(fields)}`;
    return this.http.get<Decision[]>(`${this.pathAPI}/${queryString}`, {});
  }

  // NB: returns array with 1 element
  getDecision(id: string): Observable<Decision[]> {
    const fields = ['_addedBy', '_application', 'name', 'description'];
    const queryString = `decision/${id}?fields=${this.buildValues(fields)}`;
    return this.http.get<Decision[]>(`${this.pathAPI}/${queryString}`, {});
  }

  addDecision(decision: Decision): Observable<Decision> {
    const queryString = 'decision/';
    return this.http.post<Decision>(`${this.pathAPI}/${queryString}`, decision, {});
  }

  saveDecision(decision: Decision): Observable<Decision> {
    const queryString = `decision/${decision._id}`;
    return this.http.put<Decision>(`${this.pathAPI}/${queryString}`, decision, {});
  }

  deleteDecision(decision: Decision): Observable<Decision> {
    const queryString = `decision/${decision._id}`;
    return this.http.delete<Decision>(`${this.pathAPI}/${queryString}`, {});
  }

  publishDecision(decision: Decision): Observable<Decision> {
    const queryString = `decision/${decision._id}/publish`;
    return this.http.put<Decision>(`${this.pathAPI}/${queryString}`, decision, {});
  }

  unPublishDecision(decision: Decision): Observable<Decision> {
    const queryString = `decision/${decision._id}/unpublish`;
    return this.http.put<Decision>(`${this.pathAPI}/${queryString}`, decision, {});
  }

  //
  // Comment Periods
  //
  getPeriodsByAppId(appId: string): Observable<CommentPeriod[]> {
    const fields = ['_addedBy', '_application', 'startDate', 'endDate'];
    const queryString = `commentperiod?isDeleted=false&_application=${appId}&fields=${this.buildValues(fields)}`;
    return this.http.get<CommentPeriod[]>(`${this.pathAPI}/${queryString}`, {});
  }

  // NB: returns array with 1 element
  getPeriod(id: string): Observable<CommentPeriod[]> {
    const fields = ['_addedBy', '_application', 'startDate', 'endDate'];
    const queryString = `commentperiod/${id}?fields=${this.buildValues(fields)}`;
    return this.http.get<CommentPeriod[]>(`${this.pathAPI}/${queryString}`, {});
  }

  addCommentPeriod(period: CommentPeriod): Observable<CommentPeriod> {
    const queryString = 'commentperiod/';
    return this.http.post<CommentPeriod>(`${this.pathAPI}/${queryString}`, period, {});
  }

  saveCommentPeriod(period: CommentPeriod): Observable<CommentPeriod> {
    const queryString = `commentperiod/${period._id}`;
    return this.http.put<CommentPeriod>(`${this.pathAPI}/${queryString}`, period, {});
  }

  deleteCommentPeriod(period: CommentPeriod): Observable<CommentPeriod> {
    const queryString = `commentperiod/${period._id}`;
    return this.http.delete<CommentPeriod>(`${this.pathAPI}/${queryString}`, {});
  }

  publishCommentPeriod(period: CommentPeriod): Observable<CommentPeriod> {
    const queryString = `commentperiod/${period._id}/publish`;
    return this.http.put<CommentPeriod>(`${this.pathAPI}/${queryString}`, period, {});
  }

  unPublishCommentPeriod(period: CommentPeriod): Observable<CommentPeriod> {
    const queryString = `commentperiod/${period._id}/unpublish`;
    return this.http.put<CommentPeriod>(`${this.pathAPI}/${queryString}`, period, {});
  }

  //
  // Comments
  //
  getCountCommentsByPeriodId(periodId: string): Observable<number> {
    // NB: count only pending comments
    const queryString = `comment?isDeleted=false&commentStatus='Pending'&_commentPeriod=${periodId}`;
    return this.http.head<HttpResponse<object>>(`${this.pathAPI}/${queryString}`, { observe: 'response' }).pipe(
      map(res => {
        // retrieve the count from the response headers
        return parseInt(res.headers.get('x-total-count'), 10);
      })
    );
  }

  getCommentsByPeriodId(periodId: string, pageNum: number, pageSize: number, sortBy: string): Observable<Comment[]> {
    const fields = [
      '_addedBy',
      '_commentPeriod',
      'commentNumber',
      'comment',
      'commentAuthor',
      'review',
      'dateAdded',
      'commentStatus'
    ];

    let queryString = `comment?isDeleted=false&_commentPeriod=${periodId}&`;
    if (pageNum !== null) {
      queryString += `pageNum=${pageNum}&`;
    }
    if (pageSize !== null) {
      queryString += `pageSize=${pageSize}&`;
    }
    if (sortBy !== null) {
      queryString += `sortBy=${sortBy}&`;
    }
    queryString += `fields=${this.buildValues(fields)}`;

    return this.http.get<Comment[]>(`${this.pathAPI}/${queryString}`, {});
  }

  // NB: returns array with 1 element
  getComment(id: string): Observable<Comment[]> {
    const fields = [
      '_addedBy',
      '_commentPeriod',
      'commentNumber',
      'comment',
      'commentAuthor',
      'review',
      'dateAdded',
      'commentStatus'
    ];
    const queryString = `comment/${id}?fields=${this.buildValues(fields)}`;
    return this.http.get<Comment[]>(`${this.pathAPI}/${queryString}`, {});
  }

  addComment(comment: Comment): Observable<Comment> {
    const queryString = 'comment/';
    return this.http.post<Comment>(`${this.pathAPI}/${queryString}`, comment, {});
  }

  saveComment(comment: Comment): Observable<Comment> {
    const queryString = `comment/${comment._id}`;
    return this.http.put<Comment>(`${this.pathAPI}/${queryString}`, comment, {});
  }

  publishComment(comment: Comment): Observable<Comment> {
    const queryString = `comment/${comment._id}/publish`;
    return this.http.put<Comment>(`${this.pathAPI}/${queryString}`, null, {});
  }

  unPublishComment(comment: Comment): Observable<Comment> {
    const queryString = `comment/${comment._id}/unpublish`;
    return this.http.put<Comment>(`${this.pathAPI}/${queryString}`, null, {});
  }

  //
  // Documents
  //
  getDocumentsByAppId(appId: string): Observable<Document[]> {
    const fields = ['_application', 'documentFileName', 'displayName', 'internalURL', 'internalMime'];
    const queryString = `document?isDeleted=false&_application=${appId}&fields=${this.buildValues(fields)}`;
    return this.http.get<Document[]>(`${this.pathAPI}/${queryString}`, {});
  }

  getDocumentsByCommentId(commentId: string): Observable<Document[]> {
    const fields = ['_comment', 'documentFileName', 'displayName', 'internalURL', 'internalMime'];
    const queryString = `document?isDeleted=false&_comment=${commentId}&fields=${this.buildValues(fields)}`;
    return this.http.get<Document[]>(`${this.pathAPI}/${queryString}`, {});
  }

  getDocumentsByDecisionId(decisionId: string): Observable<Document[]> {
    const fields = ['_decision', 'documentFileName', 'displayName', 'internalURL', 'internalMime'];
    const queryString = `document?isDeleted=false&_decision=${decisionId}&fields=${this.buildValues(fields)}`;
    return this.http.get<Document[]>(`${this.pathAPI}/${queryString}`, {});
  }

  // NB: returns array with 1 element
  getDocument(id: string): Observable<Document[]> {
    const queryString = `document/${id}`;
    return this.http.get<Document[]>(`${this.pathAPI}/${queryString}`, {});
  }

  deleteDocument(doc: Document): Observable<Document> {
    const queryString = `document/${doc._id}`;
    return this.http.delete<Document>(`${this.pathAPI}/${queryString}`, {});
  }

  publishDocument(doc: Document): Observable<Document> {
    const queryString = `document/${doc._id}/publish`;
    return this.http.put<Document>(`${this.pathAPI}/${queryString}`, doc, {});
  }

  unPublishDocument(doc: Document): Observable<Document> {
    const queryString = `document/${doc._id}/unpublish`;
    return this.http.put<Document>(`${this.pathAPI}/${queryString}`, doc, {});
  }

  uploadDocument(formData: FormData): Observable<Document> {
    const fields = ['documentFileName', 'displayName', 'internalURL', 'internalMime'];
    const queryString = `document/?fields=${this.buildValues(fields)}`;
    return this.http.post<Document>(`${this.pathAPI}/${queryString}`, formData, {});
  }

  private downloadResource(id: string): Promise<Blob> {
    const queryString = `document/${id}/download`;
    return this.http.get<Blob>(this.pathAPI + '/' + queryString, { responseType: 'blob' as 'json' }).toPromise();
  }

  public async downloadDocument(document: Document): Promise<void> {
    const blob = await this.downloadResource(document._id);
    const filename = document.documentFileName;

    if (this.isMS) {
      window.navigator.msSaveBlob(blob, filename);
    } else {
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      window.document.body.appendChild(a);
      a.setAttribute('style', 'display: none');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    }
  }

  public async openDocument(document: Document): Promise<void> {
    const blob = await this.downloadResource(document._id);
    const filename = document.documentFileName;

    if (this.isMS) {
      window.navigator.msSaveBlob(blob, filename);
    } else {
      const tab = window.open();
      const fileURL = URL.createObjectURL(blob);
      tab.location.href = fileURL;
    }
  }

  //
  // Searching
  //
  searchAppsByCLID(clid: string): Observable<SearchResults[]> {
    const queryString = `ttlsapi/crownLandFileNumber/${clid}`;
    return this.http.get<SearchResults[]>(`${this.pathAPI}/${queryString}`, {});
  }

  searchAppsByDTID(dtid: number): Observable<SearchResults> {
    const queryString = `ttlsapi/dispositionTransactionId/${dtid}`;
    return this.http.get<SearchResults>(`${this.pathAPI}/${queryString}`, {});
  }

  //
  // Users
  //
  getUsers(): Observable<User[]> {
    const fields = ['displayName', 'username', 'firstName', 'lastName'];
    const queryString = `user?fields=${this.buildValues(fields)}`;
    return this.http.get<User[]>(`${this.pathAPI}/${queryString}`, {});
  }

  saveUser(user: User): Observable<User> {
    const queryString = `user/${user._id}`;
    return this.http.put<User>(`${this.pathAPI}/${queryString}`, user, {});
  }

  addUser(user: User): Observable<User> {
    const queryString = 'user/';
    return this.http.post<User>(`${this.pathAPI}/${queryString}`, user, {});
  }

  /**
   * Converts an array of strings into a single string whose values are separated by a pipe '|' symbol.
   *
   * Example: ['bird','dog','cat'] -> 'bird|dog|cat'
   *
   * @private
   * @param {string[]} collection
   * @returns {string}
   * @memberof ApiService
   */
  private buildValues(collection: string[]): string {
    if (!collection || collection.length <= 0) {
      return '';
    }

    return collection.join('|');
  }
}
