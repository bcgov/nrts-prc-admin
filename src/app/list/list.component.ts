import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { Application } from 'app/models/application';
import { IApplicationQueryParamSet, QueryParamModifier } from 'app/services/api';
import { ApplicationService } from 'app/services/application.service';
import { RegionCodes, StatusCodes, ReasonCodes, PurposeCodes } from 'app/utils/constants/application';
import { CodeType, ConstantUtils } from 'app/utils/constants/constantUtils';
import * as _ from 'lodash';
import * as moment from 'moment';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ExportService } from 'app/services/export.service';

interface IPaginationParameters {
  totalItems?: number;
  currentPage?: number;
}

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy {
  private ngUnsubscribe: Subject<boolean> = new Subject<boolean>();

  // url parameters, used to set the initial state of the page on load
  public paramMap: ParamMap = null;

  // indicates the page is loading
  public loading = true;
  // indicates a search is in progress
  public searching = false;
  // indicates an export is in progress
  public exporting = false;

  // list of applications to display
  public applications: Application[] = [];

  // drop down filter values
  public purposeCodes = new PurposeCodes().getCodeGroups();
  public regionCodes = new RegionCodes().getCodeGroups();
  public statusCodes = new StatusCodes().getCodeGroups();
  // enforce specific comment filter order for esthetics
  // public commentCodes = [CommentCodes.NOT_STARTED, CommentCodes.OPEN, CommentCodes.CLOSED, CommentCodes.NOT_OPEN];

  // selected drop down filters
  public purposeCodeFilters: string[] = [];
  public regionCodeFilter = '';
  public statusCodeFilters: string[] = [];
  public applicantFilter = '';
  // public commentCodeFilters: string[] = [];

  // need to reset pagination when a filter is changed, as we can't be sure how many pages of results will exist.
  public filterChanged = false;

  // pagination values
  public pagination = {
    totalItems: 0,
    currentPage: 1,
    itemsPerPage: 25,
    pageCount: 1,
    message: ''
  };

  // sorting values
  public sorting = {
    column: null,
    direction: 0
  };

  constructor(
    private location: Location,
    private router: Router,
    private route: ActivatedRoute,
    private applicationService: ApplicationService,
    private exportService: ExportService
  ) {}

  /**
   * Component init.
   *
   * @memberof ListComponent
   */
  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.ngUnsubscribe)).subscribe(paramMap => {
      this.paramMap = paramMap;

      this.setInitialQueryParameters();
      this.getApplications();
    });
  }

  /**
   * Fetches applications from ACRFD based on the current filter and pagination parameters.
   *
   * Makes 2 calls:
   * - get applications (fetches at most pagination.itemsPerPage applications)
   * - get applications count (the total count of matching applications, used when rendering pagination controls)
   *
   * @memberof ListComponent
   */
  public getApplications(): void {
    this.searching = true;

    if (this.filterChanged) {
      this.resetPagination();
    }

    forkJoin(
      this.applicationService.getAll({ getCurrentPeriod: true }, this.getApplicationQueryParamSets()),
      this.applicationService.getCount(this.getApplicationQueryParamSets())
    )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        ([applications, count]) => {
          this.updatePagination({ totalItems: count });
          this.applications = applications;

          this.searching = false;
          this.loading = false;
        },
        error => {
          console.log('error = ', error);
          alert("Uh-oh, couldn't load applications");
          this.router.navigate(['/list']);
        }
      );
  }

  // Export

  /**
   * Fetches all applications that match the filter criteria (ignores pagination) and parses the resulting json into
   * a csv for download.  Includes more fields than are shown on the web-page.
   *
   * @memberof ListComponent
   */
  public export(): void {
    this.exporting = true;
    const queryParamsSet = this.getApplicationQueryParamSets();

    // ignore pagination as we want to export ALL search results
    queryParamsSet.forEach(element => {
      delete element.pageNum;
      delete element.pageSize;
    });

    this.applicationService
      .getAll({ getCurrentPeriod: true }, queryParamsSet)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        applications => {
          // All fields that will be included in the csv, and optionally what the column header text will be.
          // See www.npmjs.com/package/json2csv for details on the format of the fields array.
          const fields: any[] = [
            { label: 'CL File', value: this.getExportPadStartFormatter('cl_file') },
            { label: 'Disposition ID', value: 'tantalisID' },
            { label: 'Applicant (client)', value: 'client' },
            { label: 'Business Unit', value: 'businessUnit' },
            { label: 'Location', value: 'location' },
            { label: 'Area (hectares)', value: 'areaHectares' },
            { label: 'Created Date', value: this.getExportDateFormatter('createdDate') },
            { label: 'Publish Date', value: this.getExportDateFormatter('publishDate') },
            { label: 'Purpose', value: 'purpose' },
            { label: 'Subpurpose', value: 'subpurpose' },
            { label: 'Status', value: this.getExportStatusFormatter('status', 'reason') },
            { label: 'Last Status Update Date', value: this.getExportDateFormatter('statusHistoryEffectiveDate') },
            { label: 'Type', value: 'type' },
            { label: 'Subtype', value: 'subtype' },
            { label: 'Tenure Stage', value: 'tenureStage' },
            { label: 'Description', value: 'description' },
            { label: 'Legal Description', value: 'legalDescription' },
            { label: 'Is Retired', value: 'meta.isRetired' },
            { label: 'Retire Date', value: this.getExportDateFormatter('meta.retireDate') },
            { label: 'Comment Period: Status', value: 'meta.cpStatusStringLong' },
            { label: 'Comment Period: Start Date', value: this.getExportDateFormatter('meta.currentPeriod.startDate') },
            { label: 'Comment Period: End Date', value: this.getExportDateFormatter('meta.currentPeriod.endDate') },
            { label: 'Comment Period: Number of Comments', value: 'meta.numComments' }
          ];
          this.exportService.exportAsCSV(
            applications,
            `ACRFD_Applications_Export_${moment().format('YYYY-MM-DD_HH-mm')}`,
            fields
          );
          this.exporting = false;
        },
        error => {
          this.exporting = false;
          console.log('error = ', error);
          alert("Uh-oh, couldn't export applications");
        }
      );
  }

  /**
   * Convenience method for converting an export date field to a formatted date string that is recognized by Excel as
   * a Date.
   *
   * Note: See www.npmjs.com/package/json2csv for details on what this function is supporting.
   *
   * @param {string} dateProperty the object property for the date (the key path, not the value). Can be the path to a
   *                              nested date field: 'some.nested.date'
   * @returns {(row) => string} a function that takes a row and returns a string
   * @memberof ListComponent
   */
  public getExportDateFormatter(dateProperty: string): (row) => string {
    return row => {
      const dateProp = _.get(row, dateProperty);

      if (!dateProp) {
        return null;
      }

      const date = moment(dateProp);

      if (!date.isValid()) {
        return dateProp;
      }

      return date.format('YYYY-MM-DD');
    };
  }

  /**
   * Convenience method for converting an export Tantalis status code into its ACRFD status code.
   *
   * Note: See www.npmjs.com/package/json2csv for details on what this function is supporting.
   *
   * @param {string} statusProperty the object property for the status (the key path, not the value). Can be the path to
   *                                a nested status field: 'some.nested.status'
   * @param {string} reasonProperty the object property for the reason (the key path, not the value). Can be the path to
   *                                a nested reason field: 'some.nested.reason'
   * @returns {(row) => string} a function that takes a row and returns a string
   * @memberof ListComponent
   */
  public getExportStatusFormatter(statusProperty: string, reasonProperty: string): (row) => string {
    return row => {
      const statusProp = _.get(row, statusProperty);
      const reasonProp = _.get(row, reasonProperty);

      return this.applicationService.getStatusStringLong(new Application({ status: statusProp, reason: reasonProp }));
    };
  }

  /**
   * Convenience method for padding a value with 0's to at least 7 characters.
   * If the string is of length 7 or more to begin with, no padding is performed.
   *
   * Note: See www.npmjs.com/package/json2csv for details on what this function is supporting.
   *
   * @param {string} property the object property for a value (the key path, not the value). Can be the path to a
   *                          nested field: 'some.nested.value'
   * @returns {(row) => string} a function that takes a row and returns a string
   * @memberof ListComponent
   */
  public getExportPadStartFormatter(property: string): (row) => string {
    return row => {
      const prop = _.get(row, property);

      if (!prop) {
        return null;
      }

      return prop.toString().padStart(7, '0');
    };
  }

  // URL Parameters

  /**
   * Set any initial filter, pagination, and sort values that were saved in the URL.
   *
   * @memberof ListComponent
   */
  public setInitialQueryParameters(): void {
    this.pagination.currentPage = +this.paramMap.get('page') || 1;

    this.sorting.column = (this.paramMap.get('sortBy') && this.paramMap.get('sortBy').slice(1)) || null;
    this.sorting.direction =
      (this.paramMap.get('sortBy') && (this.paramMap.get('sortBy').charAt(0) === '-' ? -1 : 1)) || 0;

    this.purposeCodeFilters = (this.paramMap.get('purpose') && this.paramMap.get('purpose').split('|')) || [];
    this.regionCodeFilter = this.paramMap.get('region') || '';
    this.statusCodeFilters = (this.paramMap.get('status') && this.paramMap.get('status').split('|')) || [];
    this.applicantFilter = this.paramMap.get('applicant') || '';
    // this.commentCodeFilters = (this.paramMap.get('comment') && this.paramMap.get('comment').split('|')) || [];
  }

  /**
   * Builds an array of query parameter sets.
   *
   * Each query parameter set in the array will return a distinct set of results.
   *
   * The combined results from all query parameter sets is needed to fully satisfy the filters.
   *
   * @returns {IApplicationQueryParamSet[]} An array of distinct query parameter sets.
   * @memberof ListComponent
   */
  public getApplicationQueryParamSets(): IApplicationQueryParamSet[] {
    let applicationQueryParamSets: IApplicationQueryParamSet[] = [];

    // None of these filters require manipulation or unique considerations

    const basicQueryParams: IApplicationQueryParamSet = {
      isDeleted: false,
      pageNum: this.pagination.currentPage - 1, // API starts at 0, while this component starts at 1
      pageSize: this.pagination.itemsPerPage,
      purpose: {
        value: _.flatMap(
          this.purposeCodeFilters.map(purposeCode => ConstantUtils.getCode(CodeType.PURPOSE, purposeCode))
        ),
        modifier: QueryParamModifier.Equal
      },
      businessUnit: {
        value: ConstantUtils.getCode(CodeType.REGION, this.regionCodeFilter),
        modifier: QueryParamModifier.Equal
      },
      client: {
        value: this.applicantFilter,
        modifier: QueryParamModifier.Text
      }
    };

    if (this.sorting.column && this.sorting.direction) {
      basicQueryParams.sortBy = `${this.sorting.direction === -1 ? '-' : '+'}${this.sorting.column}`;
    }

    // Certain Statuses require unique considerations, which are accounted for here

    // convert the array of statusCodeFilters into a flattened array of non-null/undefined status (ICodeGroup) objects
    const appStatusCodeGroups =
      (this.statusCodeFilters &&
        _.flatMap(this.statusCodeFilters, statusParam =>
          ConstantUtils.getCodeGroup(CodeType.STATUS, statusParam)
        ).filter(Boolean)) ||
      [];

    appStatusCodeGroups.forEach(statusCodeGroup => {
      if (statusCodeGroup === StatusCodes.ABANDONED) {
        // Fetch applications with Abandoned Status that don't have a Reason indicating an amendment.
        applicationQueryParamSets.push({
          ...basicQueryParams,
          status: { value: StatusCodes.ABANDONED.mappedCodes, modifier: QueryParamModifier.Equal },
          reason: {
            value: [ReasonCodes.AMENDMENT_APPROVED.code, ReasonCodes.AMENDMENT_NOT_APPROVED.code],
            modifier: QueryParamModifier.Not_Equal
          }
        });
      } else if (statusCodeGroup === StatusCodes.DECISION_APPROVED) {
        // Fetch applications with Approved status
        applicationQueryParamSets.push({
          ...basicQueryParams,
          status: { value: statusCodeGroup.mappedCodes, modifier: QueryParamModifier.Equal }
        });

        // Also fetch applications with an Abandoned status that also have a Reason indicating an approved amendment.
        applicationQueryParamSets.push({
          ...basicQueryParams,
          status: { value: StatusCodes.ABANDONED.mappedCodes, modifier: QueryParamModifier.Equal },
          reason: {
            value: [ReasonCodes.AMENDMENT_APPROVED.code],
            modifier: QueryParamModifier.Equal
          }
        });
      } else if (statusCodeGroup === StatusCodes.DECISION_NOT_APPROVED) {
        // Fetch applications with Not Approved status
        applicationQueryParamSets.push({
          ...basicQueryParams,
          status: { value: statusCodeGroup.mappedCodes, modifier: QueryParamModifier.Equal }
        });

        // Also fetch applications with an Abandoned status that also have a Reason indicating a not approved amendment.
        applicationQueryParamSets.push({
          ...basicQueryParams,
          status: { value: StatusCodes.ABANDONED.mappedCodes, modifier: QueryParamModifier.Equal },
          reason: {
            value: [ReasonCodes.AMENDMENT_NOT_APPROVED.code],
            modifier: QueryParamModifier.Equal
          }
        });
      } else {
        // This status requires no special treatment, fetch as normal
        applicationQueryParamSets.push({
          ...basicQueryParams,
          status: { value: statusCodeGroup.mappedCodes, modifier: QueryParamModifier.Equal }
        });
      }
    });

    // if no status filters selected, still add the basic query filters
    if (applicationQueryParamSets.length === 0) {
      applicationQueryParamSets = [{ ...basicQueryParams }];
    }

    return applicationQueryParamSets;
  }

  /**
   * Save filter, pagination, and sort values as params in the URL.
   *
   * @memberof ListComponent
   */
  public saveQueryParameters(): void {
    const params: Params = {};

    params['page'] = this.pagination.currentPage;

    if (this.sorting.column && this.sorting.direction) {
      params['sortBy'] = `${this.sorting.direction === -1 ? '-' : '+'}${this.sorting.column}`;
    }

    if (this.purposeCodeFilters && this.purposeCodeFilters.length) {
      params['purpose'] = this.convertArrayIntoPipeString(this.purposeCodeFilters);
    }
    if (this.regionCodeFilter) {
      params['region'] = this.regionCodeFilter;
    }
    if (this.statusCodeFilters && this.statusCodeFilters.length) {
      params['status'] = this.convertArrayIntoPipeString(this.statusCodeFilters);
    }
    if (this.applicantFilter) {
      params['applicant'] = this.applicantFilter;
    }
    // if (this.commentCodeFilters && this.commentCodeFilters.length) {
    //   params['comment'] = this.convertArrayIntoPipeString(this.commentCodeFilters);
    // }

    // change browser URL without reloading page (so any query params are saved in history)
    this.location.go(this.router.createUrlTree([], { relativeTo: this.route, queryParams: params }).toString());
  }

  /**
   * Reset filter, pagination, and sort values to their defaults.
   *
   * @memberof ListComponent
   */
  public clearQueryParameters(): void {
    this.pagination.currentPage = 1;
    this.pagination.totalItems = 0;

    this.sorting.column = null;
    this.sorting.direction = 0;

    this.purposeCodeFilters = [];
    this.regionCodeFilter = '';
    this.statusCodeFilters = [];
    this.applicantFilter = '';
    // this.commentCodeFilters = [];

    this.location.go(this.router.createUrlTree([], { relativeTo: this.route }).toString());
  }

  // Filters

  /**
   * Set application purpose filter.
   *
   * @param {string} purposeCode
   * @memberof ListComponent
   */
  public setPurposeFilter(purposeCode: string): void {
    this.purposeCodeFilters = purposeCode ? [purposeCode] : [];
    this.filterChanged = true;
    this.saveQueryParameters();
  }

  /**
   * Set application status filter.
   *
   * @param {string} statusCode
   * @memberof ListComponent
   */
  public setStatusFilter(statusCode: string): void {
    this.statusCodeFilters = statusCode ? [statusCode] : [];
    this.filterChanged = true;
    this.saveQueryParameters();
  }

  /**
   * Set application region filter.
   *
   * @param {string} regionCode
   * @memberof ListComponent
   */
  public setRegionFilter(regionCode: string): void {
    this.regionCodeFilter = regionCode || '';
    this.filterChanged = true;
    this.saveQueryParameters();
  }

  public setApplicantFilter(applicantString: string): void {
    this.applicantFilter = applicantString || '';
    this.filterChanged = true;
    this.saveQueryParameters();
  }

  // /**
  //  * Set comment period status filter.
  //  *
  //  * @param {string} commentCode
  //  * @memberof ListComponent
  //  */
  // public setCommentFilter(commentCode: string): void {
  //   this.commentCodeFilters = commentCode ? [commentCode] : [];
  //   this.filterChanged = true;
  //   this.saveQueryParameters();
  // }

  // /**
  //  * Given an array of Applications, filter out comment periods that don't match the comment period status filter.
  //  *
  //  * @param {Application[]} applications
  //  * @returns
  //  * @memberof ListComponent
  //  */
  // public applyCommentPeriodFilter(applications: Application[]): Application[] {
  //   if (!applications || !this.commentCodeFilters || !this.commentCodeFilters.length) {
  //     return applications;
  //   }

  //   return applications.filter(application => {
  //     return _.flatMap(
  //       this.commentCodeFilters.map(commentCode => ConstantUtils.getTextLong(CodeType.COMMENT, commentCode))
  //     ).includes(application.meta.cpStatusStringLong);
  //   });
  // }

  // Sorting

  /**
   * Sets the sort properties (column, direction) used by the OrderBy pipe.
   *
   * @param {string} sortBy
   * @memberof DocumentsComponent
   */
  public sort(sortBy: string): void {
    if (!sortBy) {
      return;
    }

    if (this.sorting.column === sortBy) {
      // when sorting on the same column, toggle sorting
      this.sorting.direction = this.sorting.direction > 0 ? -1 : 1;
    } else {
      // when sorting on a new column, sort descending
      this.sorting.column = sortBy;
      this.sorting.direction = 1;
    }

    this.saveQueryParameters();
    this.getApplications();
  }

  // Pagination

  /**
   * Updates the pagination variables.
   *
   * Note: some variables can be passed in, while others are always calculated based on other variables, and so can't
   * be set manually.
   *
   * @param {IPaginationParameters} [paginationParams=null]
   * @returns {void}
   * @memberof ListComponent
   */
  public updatePagination(paginationParams: IPaginationParameters = null): void {
    if (!paginationParams) {
      // nothing to update
      return;
    }

    if (paginationParams.totalItems >= 0) {
      this.pagination.totalItems = paginationParams.totalItems;
    }

    if (paginationParams.currentPage >= 0) {
      this.pagination.currentPage = paginationParams.currentPage;
    }

    this.pagination.pageCount = Math.max(1, Math.ceil(this.pagination.totalItems / this.pagination.itemsPerPage));

    if (this.pagination.totalItems <= 0) {
      this.pagination.message = 'No applications found';
    } else if (this.pagination.currentPage > this.pagination.pageCount) {
      // This check is necessary due to a rare edge-case where the user has manually incremented the page parameter in
      // the URL beyond what would normally be allowed. As a result when applications are fetched, there aren't enough
      // to reach this page, and so the total applications found is > 0, but the applications displayed for this page
      // is 0, which may confuse users.  Tell them to press clear button which will reset the pagination url parameter.
      this.pagination.message = 'Unable to display results, please clear and re-try';
    } else {
      const low = Math.max((this.pagination.currentPage - 1) * this.pagination.itemsPerPage + 1, 1);
      const high = Math.min(this.pagination.totalItems, this.pagination.currentPage * this.pagination.itemsPerPage);
      this.pagination.message = `Displaying ${low} - ${high} of ${this.pagination.totalItems} applications`;
    }
  }

  /**
   * Resets the pagination.currentPage variable locally and in the URL.
   *
   * This is necessary due to a rare edge-case where the user has manually incremented the page parameter in the URL
   * beyond what would normally be allowed. As a result when applications are fetched, there aren't enough to reach
   * this page, and so the total applications found is > 0, but the applications displayed for this page is 0.
   *
   * @memberof ListComponent
   */
  public resetPagination(): void {
    // Minor UI improvement: don't call updatePagination here directly, as it will change the message briefly, before
    // it is updated by the getApplications call.
    this.pagination.currentPage = 1;
    this.saveQueryParameters();
    this.filterChanged = false;
  }

  /**
   * Increments or decrements the pagination.currentPage by 1.
   *
   * @param {number} [page=0] either 1 or -1
   * @memberof ListComponent
   */
  public updatePage(page: number = 0): void {
    if (
      (page === -1 && this.pagination.currentPage + page >= 1) ||
      (page === 1 && this.pagination.pageCount >= this.pagination.currentPage + page)
    ) {
      this.updatePagination({ currentPage: this.pagination.currentPage += page });
      this.saveQueryParameters();
      this.getApplications();
    }
  }

  /**
   * Jumps the pagination to the specified page.  Won't allow changes to pages that have no results.
   *
   * @param {number} [page=0] a number > 0
   * @memberof ListComponent
   */
  public setPage(page: number = 0): void {
    if (page >= 1 && this.pagination.pageCount >= page) {
      this.updatePagination({ currentPage: page });
      this.saveQueryParameters();
      this.getApplications();
    }
  }

  // Other

  /**
   * Turns an array of strings into a single string where each element is deliminited with a pipe character.
   *
   * Example: ['dog', 'cat', 'bird'] => 'dog|cat|bird|'
   *
   * @param {any[]} collection an array of strings to concatenate.
   * @returns {string}
   * @memberof ApiService
   */
  public convertArrayIntoPipeString(collection: string[]): string {
    let values = '';
    _.each(collection, a => {
      values += a + '|';
    });
    // trim the last |
    return values.replace(/\|$/, '');
  }

  /**
   * Returns true if the application has an abandoned status AND an amendment reason.
   *
   * @param {Application} application
   * @returns {boolean} true if the application has an abandoned status AND an amendment reason, false otherwise.
   * @memberof ListComponent
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
   * Given an application, returns a long user-friendly status string.
   *
   * @param {Application} application
   * @returns {string}
   * @memberof ListComponent
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

  isApplicationRetired(application: Application): boolean {
    if (
      application.statusHistoryEffectiveDate &&
      [StatusCodes.DECISION_APPROVED.code, StatusCodes.DECISION_NOT_APPROVED.code, StatusCodes.ABANDONED.code].includes(
        ConstantUtils.getCode(CodeType.STATUS, application.status)
      )
    ) {
      return moment(application.statusHistoryEffectiveDate)
        .endOf('day')
        .add(6, 'months')
        .isBefore();
    }

    return false;
  }

  getFormattedDate(date: Date = null): string {
    if (!Date) {
      return null;
    }

    return moment(date).format('YYYY-MM-DD');
  }

  /**
   * Cleanup on component destroy.
   *
   * @memberof ListComponent
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
