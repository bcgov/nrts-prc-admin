import { Injectable } from '@angular/core';
import { Observable, of, combineLatest, forkJoin } from 'rxjs';
import { mergeMap, map, catchError } from 'rxjs/operators';
import * as moment from 'moment';
import * as _ from 'lodash';

import { ApiService, IApplicationQueryParamSet } from './api';
import { DocumentService } from './document.service';
import { CommentPeriodService } from './commentperiod.service';
import { CommentService } from './comment.service';
import { DecisionService } from './decision.service';
import { FeatureService } from './feature.service';

import { Application } from 'app/models/application';

import { StatusCodes, ReasonCodes } from 'app/utils/constants/application';
import { ConstantUtils, CodeType } from 'app/utils/constants/constantUtils';

/**
 * Used by _getExtraAppData() to determine what related data to fetch when fetching applications.
 *
 * @interface IGetParameters
 */
interface IGetParameters {
  getFeatures?: boolean;
  getDocuments?: boolean;
  getCurrentPeriod?: boolean;
  getDecision?: boolean;
}

/**
 * Provides methods for working with Applications.
 *
 * @export
 * @class ApplicationService
 */
@Injectable()
export class ApplicationService {
  constructor(
    private api: ApiService,
    private documentService: DocumentService,
    private commentPeriodService: CommentPeriodService,
    private commentService: CommentService,
    private decisionService: DecisionService,
    private featureService: FeatureService
  ) {}

  /**
   * Get applications count.
   *
   * @param {IApplicationQueryParamSet} [queryParams={ isDeleted: false }]
   * @memberof ApplicationService
   */
  getCount(queryParamSets: IApplicationQueryParamSet[] = null): Observable<number> {
    if (!queryParamSets || !queryParamSets.length) {
      queryParamSets = [{ isDeleted: false }];
    }

    const observables: Array<Observable<number>> = queryParamSets.map(queryParamSet =>
      this.api.getCountApplications(queryParamSet).pipe(catchError(this.api.handleError))
    );

    return combineLatest(observables, (...args: number[]) => args.reduce((sum, arg) => (sum += arg))).pipe(
      catchError(this.api.handleError)
    );
  }

  /**
   * Get all applications.
   *
   * @param {IGetParameters} [dataParams=null]
   * @param {IApplicationQueryParamSet[]} [queryParamSets=null]
   * @returns {Observable<Application[]>}
   * @memberof ApplicationService
   */
  getAll(
    dataParams: IGetParameters = null,
    queryParamSets: IApplicationQueryParamSet[] = null
  ): Observable<Application[]> {
    // first get just the applications
    // return this.api.getApplications(queryParamSets).pipe(
    //   mergeMap(apps => {
    //     if (!apps || apps.length === 0) {
    //       // NB: forkJoin([]) will complete immediately
    //       // so return empty observable instead
    //       return of([] as Application[]);
    //     }
    //     const observables: Array<Observable<Application>> = [];
    //     apps.forEach(app => {
    //       // now get the rest of the data for each application
    //       observables.push(this._getExtraAppData(new Application(app), dataParams || {}));
    //     });
    //     return forkJoin(observables);
    //   }),
    //   catchError(error => this.api.handleError(error))
    // );

    let observables: Array<Observable<Application[]>>;

    if (queryParamSets) {
      observables = queryParamSets.map(queryParamSet => this.api.getApplications(queryParamSet));
    } else {
      observables = [this.api.getApplications()];
    }

    return combineLatest(...observables).pipe(
      mergeMap((res: Application[]) => {
        const resApps = _.flatten(res);
        if (!resApps || resApps.length === 0) {
          return of([] as Application[]);
        }

        const dataObservables: Array<Observable<Application>> = [];
        resApps.forEach(app => {
          // now get the rest of the data for each application
          dataObservables.push(this._getExtraAppData(new Application(app), dataParams || {}));
        });
        return forkJoin(dataObservables);
      }),
      catchError(this.api.handleError)
    );
  }

  /**
   * Get applications by their Crown Land ID.
   *
   * @param {string} clid
   * @param {IGetParameters} [params=null]
   * @returns {Observable<Application[]>}
   * @memberof ApplicationService
   */
  getByCrownLandID(clid: string, params: IGetParameters = null): Observable<Application[]> {
    // first get just the applications
    return this.api.getApplicationsByCrownLandID(clid).pipe(
      mergeMap(apps => {
        if (!apps || apps.length === 0) {
          // NB: forkJoin([]) will complete immediately
          // so return empty observable instead
          return of([] as Application[]);
        }
        const observables: Array<Observable<Application>> = [];
        apps.forEach(app => {
          // now get the rest of the data for each application
          observables.push(this._getExtraAppData(new Application(app), params || {}));
        });
        return forkJoin(observables);
      }),
      catchError(error => this.api.handleError(error))
    );
  }

  /**
   * Get a specific application by its Tantalis ID (Disposition ID).
   *
   * @param {number} tantalisID
   * @param {IGetParameters} [params=null]
   * @returns {Observable<Application>}
   * @memberof ApplicationService
   */
  getByTantalisID(tantalisID: number, params: IGetParameters = null): Observable<Application> {
    // first get just the application
    return this.api.getApplicationByTantalisId(tantalisID).pipe(
      mergeMap(apps => {
        if (!apps || apps.length === 0) {
          return of(null as Application);
        }
        // now get the rest of the data for this application
        return this._getExtraAppData(new Application(apps[0]), params || {});
      }),
      catchError(error => this.api.handleError(error))
    );
  }

  /**
   * Get a specific application by its mongo object id.
   *
   * @param {string} appId
   * @param {IGetParameters} [params=null]
   * @returns {Observable<Application>}
   * @memberof ApplicationService
   */
  getById(appId: string, params: IGetParameters = null): Observable<Application> {
    // first get just the application
    return this.api.getApplication(appId).pipe(
      mergeMap(apps => {
        if (!apps || apps.length === 0) {
          return of(null as Application);
        }
        // now get the rest of the data for this application
        return this._getExtraAppData(new Application(apps[0]), params || {});
      }),
      catchError(error => this.api.handleError(error))
    );
  }

  // /**
  //  * Search by applications auto-complete.
  //  *
  //  * @param {string} appId
  //  * @param {IGetParameters} [params=null]
  //  * @returns {Observable<Application>}
  //  * @memberof ApplicationService
  //  */
  // getByApplicant(searchString: string): Observable<string[]> {
  //   const queryParams: IApplicationQueryParamSet = {
  //     client: { value: searchString, modifier: QueryParamModifier.Text }
  //   };
  //   this.api.getApplications(queryParams, ['applicant']).pipe(
  //     mergeMap(apps => {
  //       if (!apps || apps.length === 0) {
  //         return of(null as Application);
  //       }
  //     }),
  //     catchError(error => this.api.handleError(error))
  //   );
  // }

  /**
   * Fetches comment data.
   *
   * @private
   * @param {Application} application
   * @returns
   * @memberof ApplicationService
   */
  private _getExtraCommentData(application: Application) {
    return this.commentPeriodService.getAllByApplicationId(application._id).pipe(
      mergeMap(periods => {
        application.meta.currentPeriod = this.commentPeriodService.getCurrent(periods);

        // user-friendly comment period long status string
        const commentPeriodCode = this.commentPeriodService.getCode(application.meta.currentPeriod);
        application.meta.cpStatusStringLong = ConstantUtils.getTextLong(CodeType.COMMENT, commentPeriodCode);

        // derive days remaining for display
        // use moment to handle Daylight Saving Time changes
        if (application.meta.currentPeriod && this.commentPeriodService.isOpen(commentPeriodCode)) {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          application.meta.currentPeriod.meta.daysRemaining =
            moment(application.meta.currentPeriod.endDate).diff(moment(today), 'days') + 1; // including today
        }

        // get the number of comments for the current comment period only
        // multiple comment periods are currently not supported
        if (!application.meta.currentPeriod) {
          application.meta.numComments = 0;
          return of(application);
        }

        return forkJoin(
          this.commentService.getCountByPeriodId(application.meta.currentPeriod._id).pipe(
            map(numComments => {
              application.meta.numComments = numComments;
              return of(application);
            })
          )
        );
      })
    );
  }

  /**
   * Fetches application data.
   *
   * @private
   * @param {Application} application
   * @param {IGetParameters} { getFeatures = false, getDocuments = false,
   *                           getCurrentPeriod = false, getDecision = false }
   * @returns {Observable<Application>}
   * @memberof ApplicationService
   */
  private _getExtraAppData(
    application: Application,
    { getFeatures = false, getDocuments = false, getCurrentPeriod = false, getDecision = false }: IGetParameters
  ): Observable<Application> {
    return forkJoin(
      getFeatures ? this.featureService.getByApplicationId(application._id) : of(null),
      getDocuments ? this.documentService.getAllByApplicationId(application._id) : of(null),
      getCurrentPeriod ? this._getExtraCommentData(application) : of(null),
      getDecision ? this.decisionService.getByApplicationId(application._id, { getDocuments: true }) : of(null)
    ).pipe(
      map(payloads => {
        if (getFeatures) {
          application.meta.features = payloads[0];
        }

        if (getDocuments) {
          application.meta.documents = payloads[1];
        }

        if (getDecision) {
          application.meta.decision = payloads[3];
        }

        // 7-digit CL File number for display
        if (application.cl_file) {
          application.meta.clFile = application.cl_file.toString().padStart(7, '0');
        }

        // derive unique applicants
        if (application.client) {
          const clients = application.client.split(', ');
          application.meta.applicants = _.uniq(clients).join(', ');
        }

        // derive retire date
        if (
          application.statusHistoryEffectiveDate &&
          [
            StatusCodes.DECISION_APPROVED.code,
            StatusCodes.DECISION_NOT_APPROVED.code,
            StatusCodes.ABANDONED.code
          ].includes(ConstantUtils.getCode(CodeType.STATUS, application.status))
        ) {
          application.meta.retireDate = moment(application.statusHistoryEffectiveDate)
            .endOf('day')
            .add(6, 'months')
            .toDate();
          // set flag if retire date is in the past
          application.meta.isRetired = moment(application.meta.retireDate).isBefore();
        }

        // finally update the object and return
        return application;
      })
    );
  }

  /**
   * Create a new application.
   *
   * @param {*} item
   * @returns {Observable<Application>}
   * @memberof ApplicationService
   */
  add(item: any): Observable<Application> {
    const app = new Application(item);

    // boilerplate for new application
    app.agency = 'Crown Land Allocation';
    app.name = item.cl_file && item.cl_file.toString();

    // id must not exist on POST
    delete app._id;

    // don't send attached data (features, documents, etc)
    delete app.meta;

    // replace newlines with \\n (JSON format)
    if (app.description) {
      app.description = app.description.replace(/\n/g, '\\n');
    }
    if (app.legalDescription) {
      app.legalDescription = app.legalDescription.replace(/\n/g, '\\n');
    }

    return this.api.addApplication(app).pipe(catchError(error => this.api.handleError(error)));
  }

  /**
   * Update an existing application.
   *
   * @param {Application} orig
   * @returns {Observable<Application>}
   * @memberof ApplicationService
   */
  save(orig: Application): Observable<Application> {
    // make a (deep) copy of the passed-in application so we don't change it
    const app = _.cloneDeep(orig);

    // don't send attached data (features, documents, etc)
    delete app.meta;

    // replace newlines with \\n (JSON format)
    if (app.description) {
      app.description = app.description.replace(/\n/g, '\\n');
    }
    if (app.legalDescription) {
      app.legalDescription = app.legalDescription.replace(/\n/g, '\\n');
    }

    return this.api.saveApplication(app).pipe(catchError(error => this.api.handleError(error)));
  }

  delete(app: Application): Observable<Application> {
    return this.api.deleteApplication(app).pipe(catchError(error => this.api.handleError(error)));
  }

  publish(app: Application): Observable<Application> {
    return this.api.publishApplication(app).pipe(catchError(error => this.api.handleError(error)));
  }

  unPublish(app: Application): Observable<Application> {
    return this.api.unPublishApplication(app).pipe(catchError(error => this.api.handleError(error)));
  }

  /**
   * Returns true if the application has an abandoned status AND an amendment reason.
   *
   * @param {Application} application
   * @returns {boolean} true if the application has an abandoned status AND an amendment reason, false otherwise.
   * @memberof ApplicationService
   */
  isAmendment(application: Application): boolean {
    return !!(
      application &&
      ConstantUtils.getCode(CodeType.STATUS, application.status) === StatusCodes.ABANDONED.code &&
      (ConstantUtils.getCode(CodeType.REASON, application.reason) === ReasonCodes.AMENDMENT_APPROVED.code ||
        ConstantUtils.getCode(CodeType.REASON, application.reason) === ReasonCodes.AMENDMENT_NOT_APPROVED.code)
    );
  }

  /**
   * Given an application, returns a short user-friendly status string.
   *
   * @param {Application} application
   * @returns {string}
   * @memberof ApplicationService
   */
  getStatusStringShort(statusCode: string): string {
    return ConstantUtils.getTextShort(CodeType.STATUS, statusCode) || StatusCodes.UNKNOWN.text.short;
  }

  /**
   * Given an application, returns a long user-friendly status string.
   *
   * @param {Application} application
   * @returns {string}
   * @memberof ApplicationService
   */
  getStatusStringLong(application: Application): string {
    if (!application) {
      return StatusCodes.UNKNOWN.text.long;
    }

    // If the application was abandoned, but the reason is due to an amendment, then return an amendment string instead
    if (this.isAmendment(application)) {
      return ConstantUtils.getTextLong(CodeType.REASON, application.reason);
    }

    return (
      (application && ConstantUtils.getTextLong(CodeType.STATUS, application.status)) || StatusCodes.UNKNOWN.text.long
    );
  }
}
