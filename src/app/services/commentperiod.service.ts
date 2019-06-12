import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import * as _ from 'lodash';

import { ApiService } from './api';
import { CommentPeriod } from 'app/models/commentperiod';

import { CommentCodes } from 'app/utils/constants/comment';

@Injectable()
export class CommentPeriodService {
  constructor(private api: ApiService) {}

  // /**
  //  * Get all comment periods.
  //  *
  //  * @param {ICommentPeriodQueryParamSet[]} [queryParamSets=null]
  //  * @returns {Observable<CommentPeriod[]>}
  //  * @memberof CommentPeriodService
  //  */
  // getAll(queryParamSets: ICommentPeriodQueryParamSet[] = null): Observable<CommentPeriod[]> {
  //   let observables: Array<Observable<CommentPeriod[]>>;

  //   if (queryParamSets) {
  //     observables = queryParamSets.map(queryParamSet => this.api.getCommentPeriods(queryParamSet));
  //   } else {
  //     observables = [this.api.getCommentPeriods()];
  //   }

  //   return combineLatest(...observables).pipe(
  //     mergeMap((res: CommentPeriod[]) => {
  //       const resCommentPeriods = _.flatten(res);
  //       if (!resCommentPeriods || resCommentPeriods.length === 0) {
  //         return of([] as CommentPeriod[]);
  //       }

  //       return of(resCommentPeriods);
  //     }),
  //     catchError(this.api.handleError)
  //   );
  // }

  /**
   * Get all comment periods for the specified application id
   *
   * @param {string} appId
   * @returns {Observable<CommentPeriod[]>}
   * @memberof CommentPeriodService
   */
  getAllByApplicationId(appId: string): Observable<CommentPeriod[]> {
    return this.api.getCommentPeriodsByApplicationId(appId).pipe(
      map(res => {
        if (res && res.length > 0) {
          const periods: CommentPeriod[] = [];
          res.forEach(cp => {
            periods.push(new CommentPeriod(cp));
          });
          return periods;
        }
        return [];
      }),
      catchError(error => this.api.handleError(error))
    );
  }

  /**
   * get a specific comment period by its id
   *
   * @param {string} periodId
   * @returns {Observable<CommentPeriod>}
   * @memberof CommentPeriodService
   */
  getById(periodId: string): Observable<CommentPeriod> {
    return this.api.getCommentPeriod(periodId).pipe(
      map(res => {
        if (res && res.length > 0) {
          // return the first (only) comment period
          return new CommentPeriod(res[0]);
        }
        return null;
      }),
      catchError(error => this.api.handleError(error))
    );
  }

  add(orig: CommentPeriod): Observable<CommentPeriod> {
    // make a (deep) copy of the passed-in comment period so we don't change it
    const period = _.cloneDeep(orig);

    // ID must not exist on POST
    delete period._id;

    return this.api.addCommentPeriod(period).pipe(catchError(error => this.api.handleError(error)));
  }

  save(orig: CommentPeriod): Observable<CommentPeriod> {
    // make a (deep) copy of the passed-in comment period so we don't change it
    const period = _.cloneDeep(orig);

    return this.api.saveCommentPeriod(period).pipe(catchError(error => this.api.handleError(error)));
  }

  delete(period: CommentPeriod): Observable<CommentPeriod> {
    return this.api.deleteCommentPeriod(period).pipe(catchError(error => this.api.handleError(error)));
  }

  publish(period: CommentPeriod): Observable<CommentPeriod> {
    return this.api.publishCommentPeriod(period).pipe(catchError(error => this.api.handleError(error)));
  }

  unPublish(period: CommentPeriod): Observable<CommentPeriod> {
    return this.api.unPublishCommentPeriod(period).pipe(catchError(error => this.api.handleError(error)));
  }

  /**
   * Returns the first period in the array.
   *
   * Note: multiple comment periods are not supported.
   *
   * @param {CommentPeriod[]} periods
   * @returns {CommentPeriod}
   * @memberof CommentPeriodService
   */
  getCurrent(periods: CommentPeriod[]): CommentPeriod {
    return periods.length > 0 ? periods[0] : null;
  }

  /**
   * Given a comment period, returns status code.
   */
  getCode(period: CommentPeriod): string {
    if (!period || !period.startDate || !period.endDate) {
      return CommentCodes.NOT_OPEN.code;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);

    if (endDate < today) {
      return CommentCodes.CLOSED.code;
    } else if (startDate > today) {
      return CommentCodes.NOT_STARTED.code;
    } else {
      return CommentCodes.OPEN.code;
    }
  }

  isNotStarted(statusCode: string): boolean {
    return statusCode === CommentCodes.NOT_STARTED.code;
  }

  isNotOpen(statusCode: string): boolean {
    return statusCode === CommentCodes.NOT_OPEN.code;
  }

  isClosed(statusCode: string): boolean {
    return statusCode === CommentCodes.CLOSED.code;
  }

  isOpen(statusCode: string): boolean {
    return statusCode === CommentCodes.OPEN.code;
  }
}
