import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
// import { Params } from '@angular/router';
// import { JwtHelperService } from '@auth0/angular-jwt';
// import { Observable } from 'rxjs';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

import { Application } from 'app/models/application';
import { Comment } from 'app/models/comment';
import { CommentPeriod } from 'app/models/commentperiod';
import { Decision } from 'app/models/decision';
import { Document } from 'app/models/document';
import { Feature } from 'app/models/feature';
import { SearchResults } from 'app/models/search';

/**
 * Supported query param field modifiers used by the api to interpret the query param value.
 *
 * @export
 * @enum {number}
 */
export enum QueryParamModifier {
  Equal = 'eq', // value must be equal to this, for multiple values must match at least one
  Not_Equal = 'ne', // value must not be equal to this, for multiple values must not match any
  Since = 'since', // date must be on or after this date
  Until = 'until', // date must be before this date
  Text = 'text' // value must exist in any text indexed fields.
}

/**
 * A complete set of query param fields used to make a single call to the api.
 *
 * Note: this can contain multiple properties as long as the keys are strings and the values are IQueryParamValue.
 *
 * @export
 * @interface IQueryParamSet
 */
export interface IQueryParamSet {
  [key: string]: IQueryParamValue<any>;
}

/**
 * A single query param field with optional modifier.
 *
 * @export
 * @interface IQueryParamValue
 * @template T
 */
export interface IQueryParamValue<T> {
  value: T;
  modifier?: QueryParamModifier;
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

/**
 * Supported query parameters for application requests.
 *
 * Note: all parameters are optional.
 *
 * @export
 * @interface IApplicationQueryParamSet
 */
export interface IApplicationQueryParamSet {
  pageNum?: number;
  pageSize?: number;
  sortBy?: string;

  isDeleted?: boolean;

  agency?: IQueryParamValue<string>;
  areaHectares?: IQueryParamValue<string>;
  businessUnit?: IQueryParamValue<string>;
  centroid?: IQueryParamValue<string>;
  cl_file?: IQueryParamValue<number>;
  client?: IQueryParamValue<string>;
  cpEnd?: IQueryParamValue<Date>;
  cpStart?: IQueryParamValue<Date>;
  publishDate?: IQueryParamValue<Date>;
  purpose?: IQueryParamValue<string[]>;
  reason?: IQueryParamValue<string[]>;
  status?: IQueryParamValue<string[]>;
  statusHistoryEffectiveDate?: IQueryParamValue<Date>;
  subpurpose?: IQueryParamValue<string[]>;
  subtype?: IQueryParamValue<string>;
  tantalisID?: IQueryParamValue<number>;
  tenureStage?: IQueryParamValue<string>;
}

// /**
//  * Supported query parameters for comment period requests.
//  *
//  * Note: all parameters are optional.
//  *
//  * @export
//  * @interface ICommentPeriodQueryParamSet
//  */
// export interface ICommentPeriodQueryParamSet {
//   pageNum?: number;
//   pageSize?: number;
//   sortBy?: string;

//   isDeleted?: boolean;

//   _application?: IQueryParamValue<string>; // objectId
//   _addedBy?: IQueryParamValue<string>;
//   startDate?: IQueryParamValue<Date>;
//   endDate?: IQueryParamValue<Date>;
// }

@Injectable()
export class ApiService {
  public token: string;
  public isMS: boolean; // IE, Edge, etc
  // private jwtHelper: JwtHelperService;
  pathAPI: string;
  // params: Params;
  env: 'local' | 'dev' | 'test' | 'master' | 'prod';

  constructor(private http: HttpClient) {
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

      case 'nrts-prc-master.pathfinder.gov.bc.ca':
        // Master
        this.pathAPI = 'https://nrts-prc-master.pathfinder.gov.bc.ca/api';
        this.env = 'master';
        break;

      case 'nrts-prc-test.pathfinder.gov.bc.ca':
        // Test
        this.pathAPI = 'https://nrts-prc-test.pathfinder.gov.bc.ca/api';
        this.env = 'test';
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
    return throwError(error);
  }

  //
  // Applications
  //

  /**
   * Fetch all applications that match the provided parameters.
   *
   * @param {IApplicationQueryParamSet} [queryParams=null] optional query parameters to filter results
   * @returns {Observable<Application[]>}
   * @memberof ApiService
   */
  getApplications(queryParams: IApplicationQueryParamSet = null): Observable<Application[]> {
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
      'createdDate',
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

    const queryString =
      'application?' +
      `${this.buildApplicationQueryParametersString(queryParams)}&` +
      `fields=${this.convertArrayIntoPipeString(fields)}`;

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
      'createdDate',
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
    const queryString = `application/${id}?isDeleted=false&fields=${this.convertArrayIntoPipeString(fields)}`;
    return this.http.get<Application[]>(`${this.pathAPI}/${queryString}`, {});
  }

  /**
   * Gets the number of applications that match the provided parameters.
   *
   * @param {IApplicationQueryParamSet} [queryParams=null]
   * @returns {Observable<number>}
   * @memberof ApiService
   */
  getCountApplications(queryParams: IApplicationQueryParamSet = null): Observable<number> {
    const queryString = 'application?' + this.buildApplicationQueryParametersString(queryParams);

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
      'createdDate',
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
    const queryString = `application?isDeleted=false&cl_file=${clid}&fields=${this.convertArrayIntoPipeString(fields)}`;
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
      'createdDate',
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
    const queryString = `application?isDeleted=false&tantalisId=${tantalisId}&fields=${this.convertArrayIntoPipeString(
      fields
    )}`;
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
    const queryString = `feature?isDeleted=false&tantalisId=${tantalisId}&fields=${this.convertArrayIntoPipeString(
      fields
    )}`;
    return this.http.get<Feature[]>(`${this.pathAPI}/${queryString}`, {});
  }

  getFeaturesByApplicationId(applicationId: string): Observable<Feature[]> {
    const fields = ['type', 'tags', 'geometry', 'properties', 'isDeleted', 'applicationID'];
    const queryString =
      'feature?isDeleted=false&' +
      `applicationId=${applicationId}&` +
      `fields=${this.convertArrayIntoPipeString(fields)}`;
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

  getDecisionsByApplicationId(appId: string): Observable<Decision[]> {
    const fields = ['_addedBy', '_application', 'description'];
    const queryString = `decision?_application=${appId}&fields=${this.convertArrayIntoPipeString(fields)}`;
    return this.http.get<Decision[]>(`${this.pathAPI}/${queryString}`, {});
  }

  // NB: returns array with 1 element
  getDecision(id: string): Observable<Decision[]> {
    const fields = ['_addedBy', '_application', 'description'];
    const queryString = `decision/${id}?fields=${this.convertArrayIntoPipeString(fields)}`;
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

  // getCommentPeriods(queryParams: ICommentPeriodQueryParamSet = null): Observable<CommentPeriod[]> {
  //   const fields = ['_addedBy', '_application', 'description', 'startDate', 'endDate'];

  //   const queryString =
  //     'commentperiod?' +
  //     `${this.buildCommentPeriodQueryParametersString(queryParams)}&` +
  //     `fields=${this.convertArrayIntoPipeString(fields)}`;

  //   return this.http.get<CommentPeriod[]>(`${this.pathAPI}/${queryString}`, {});
  // }

  getCommentPeriodsByApplicationId(appId: string): Observable<CommentPeriod[]> {
    const fields = ['_addedBy', '_application', 'startDate', 'endDate'];
    const queryString = `commentperiod?isDeleted=false&_application=${appId}&fields=${this.convertArrayIntoPipeString(
      fields
    )}`;
    return this.http.get<CommentPeriod[]>(`${this.pathAPI}/${queryString}`, {});
  }

  // NB: returns array with 1 element
  getCommentPeriod(id: string): Observable<CommentPeriod[]> {
    const fields = ['_addedBy', '_application', 'startDate', 'endDate'];
    const queryString = `commentperiod/${id}?fields=${this.convertArrayIntoPipeString(fields)}`;
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

  getCountCommentsByCommentPeriodId(periodId: string): Observable<number> {
    // NB: count only pending comments
    const queryString = `comment?isDeleted=false&_commentPeriod=${periodId}`;
    return this.http.head<HttpResponse<object>>(`${this.pathAPI}/${queryString}`, { observe: 'response' }).pipe(
      map(res => {
        // retrieve the count from the response headers
        return parseInt(res.headers.get('x-total-count'), 10);
      })
    );
  }

  getCommentsByCommentPeriodId(
    periodId: string,
    pageNum: number,
    pageSize: number,
    sortBy: string
  ): Observable<Comment[]> {
    const fields = ['_addedBy', '_commentPeriod', 'comment', 'commentAuthor', 'dateAdded'];

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
    queryString += `fields=${this.convertArrayIntoPipeString(fields)}`;

    return this.http.get<Comment[]>(`${this.pathAPI}/${queryString}`, {});
  }

  // NB: returns array with 1 element
  getComment(id: string): Observable<Comment[]> {
    const fields = ['_addedBy', '_commentPeriod', 'comment', 'commentAuthor', 'dateAdded'];
    const queryString = `comment/${id}?fields=${this.convertArrayIntoPipeString(fields)}`;
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

  getDocumentsByApplicationId(appId: string): Observable<Document[]> {
    const fields = ['_application', 'documentFileName', 'displayName', 'internalURL', 'internalMime'];
    const queryString = `document?isDeleted=false&_application=${appId}&fields=${this.convertArrayIntoPipeString(
      fields
    )}`;
    return this.http.get<Document[]>(`${this.pathAPI}/${queryString}`, {});
  }

  getDocumentsByCommentId(commentId: string): Observable<Document[]> {
    const fields = ['_comment', 'documentFileName', 'displayName', 'internalURL', 'internalMime'];
    const queryString = `document?isDeleted=false&_comment=${commentId}&fields=${this.convertArrayIntoPipeString(
      fields
    )}`;
    return this.http.get<Document[]>(`${this.pathAPI}/${queryString}`, {});
  }

  getDocumentsByDecisionId(decisionId: string): Observable<Document[]> {
    const fields = ['_decision', 'documentFileName', 'displayName', 'internalURL', 'internalMime'];
    const queryString = `document?isDeleted=false&_decision=${decisionId}&fields=${this.convertArrayIntoPipeString(
      fields
    )}`;
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
    const queryString = `document/?fields=${this.convertArrayIntoPipeString(fields)}`;
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

  searchAppsByCLFile(clid: string): Observable<SearchResults[]> {
    const queryString = `ttlsapi/crownLandFileNumber/${clid}`;
    return this.http.get<SearchResults[]>(`${this.pathAPI}/${queryString}`, {});
  }

  searchAppsByDispositionID(dtid: number): Observable<SearchResults> {
    const queryString = `ttlsapi/dispositionTransactionId/${dtid}`;
    return this.http.get<SearchResults>(`${this.pathAPI}/${queryString}`, {});
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
  public convertArrayIntoPipeString(collection: string[]): string {
    if (!collection || collection.length <= 0) {
      return '';
    }

    return collection.join('|');
  }

  /**
   * Checks each application query parameter of the given queryParams and builds a single query string.
   *
   * @param {IApplicationQueryParamSet} queryParams
   * @returns {string}
   * @memberof ApiService
   */
  public buildApplicationQueryParametersString(params: IApplicationQueryParamSet): string {
    if (!params) {
      return '';
    }

    let queryString = '';

    if ([true, false].includes(params.isDeleted)) {
      queryString += `isDeleted=${params.isDeleted}&`;
    }

    if (params.sortBy) {
      queryString += `sortBy=${params.sortBy}&`;
    }

    if (params.pageNum >= 0) {
      queryString += `pageNum=${params.pageNum}&`;
    }

    if (params.pageSize >= 0) {
      queryString += `pageSize=${params.pageSize}&`;
    }

    if (params.cpStart && params.cpStart.value) {
      queryString += `cpStart=${params.cpStart.value.toISOString()}&`;
    }

    if (params.cpEnd && params.cpEnd.value) {
      queryString += `cpEnd=${params.cpEnd.value.toISOString()}&`;
    }

    if (params.tantalisID && params.tantalisID.value >= 0) {
      queryString += `tantalisID=${params.tantalisID.value}&`;
    }

    if (params.cl_file && params.cl_file.value >= 0) {
      queryString += `cl_file=${params.cl_file.value}&`;
    }

    if (params.purpose && params.purpose.value && params.purpose.value.length) {
      params.purpose.value.forEach((purpose: string) => (queryString += `purpose[eq]=${encodeURIComponent(purpose)}&`));
    }

    if (params.subpurpose && params.subpurpose.value && params.subpurpose.value.length) {
      params.subpurpose.value.forEach(
        (subpurpose: string) => (queryString += `subpurpose[eq]=${encodeURIComponent(subpurpose)}&`)
      );
    }

    if (params.status && params.status.value && params.status.value.length) {
      params.status.value.forEach((status: string) => (queryString += `status[eq]=${encodeURIComponent(status)}&`));
    }

    if (params.reason && params.reason.value && params.reason.value.length) {
      params.reason.value.forEach(
        (reason: string) => (queryString += `reason[${params.reason.modifier}]=${encodeURIComponent(reason)}&`)
      );
    }

    if (params.subtype && params.subtype.value) {
      queryString += `subtype=${encodeURIComponent(params.subtype.value)}&`;
    }

    if (params.agency && params.agency.value) {
      queryString += `agency=${encodeURIComponent(params.agency.value)}&`;
    }

    if (params.businessUnit && params.businessUnit.value) {
      queryString += `businessUnit[eq]=${encodeURIComponent(params.businessUnit.value)}&`;
    }

    if (params.client && params.client.value) {
      queryString += `client[${params.client.modifier}]=${encodeURIComponent(params.client.value)}&`;
    }

    if (params.tenureStage && params.tenureStage.value) {
      queryString += `tenureStage=${encodeURIComponent(params.tenureStage.value)}&`;
    }

    if (params.areaHectares && params.areaHectares.value) {
      queryString += `areaHectares=${encodeURIComponent(params.areaHectares.value)}&`;
    }

    if (params.statusHistoryEffectiveDate && params.statusHistoryEffectiveDate.value) {
      queryString += `statusHistoryEffectiveDate=${params.statusHistoryEffectiveDate.value.toISOString()}&`;
    }

    if (params.centroid && params.centroid.value) {
      queryString += `centroid=${params.centroid.value}&`;
    }

    if (params.publishDate && params.publishDate.value) {
      queryString += `publishDate=${params.publishDate.value.toISOString()}&`;
    }

    // trim the last &
    return queryString.replace(/\&$/, '');
  }

  // /**
  //  * Checks each comment period query parameter of the given queryParams and builds a single query string.
  //  *
  //  * @param {ICommentPeriodQueryParamSet} queryParams
  //  * @returns {string}
  //  * @memberof ApiService
  //  */
  // public buildCommentPeriodQueryParametersString(params: ICommentPeriodQueryParamSet): string {
  //   if (!params) {
  //     return '';
  //   }

  //   let queryString = '';

  //   if (params.pageNum >= 0) {
  //     queryString += `pageNum=${params.pageNum}&`;
  //   }

  //   if (params.pageSize >= 0) {
  //     queryString += `pageSize=${params.pageSize}&`;
  //   }

  //   if (params.sortBy) {
  //     queryString += `sortBy=${params.sortBy}&`;
  //   }

  //   if ([true, false].includes(params.isDeleted)) {
  //     queryString += `isDeleted=${params.isDeleted}&`;
  //   }

  //   if (params._application && params._application.value) {
  //     queryString += `_application=${params._application.value}&`;
  //   }

  //   if (params._addedBy && params._addedBy.value) {
  //     queryString += `_addedBy=${params._addedBy}&`;
  //   }

  //   if (params.startDate && params.startDate.value) {
  //     queryString += `startDate=${params.startDate}&`;
  //   }

  //   if (params.endDate && params.endDate.value) {
  //     queryString += `endDate=${params.endDate}&`;
  //   }

  //   console.log('queryString', queryString);

  //   // trim the last &
  //   return queryString.replace(/\&$/, '');
  // }
}
