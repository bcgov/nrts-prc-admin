import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { Application } from 'app/models/application';
import { IApplicationParameters } from 'app/services/api';
import { ApplicationService } from 'app/services/application.service';
import { PurposeCodes, RegionCodes, StatusCodes } from 'app/utils/constants/application';
import { CommentCodes } from 'app/utils/constants/comment';
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
  public commentCodes = [CommentCodes.NOT_STARTED, CommentCodes.OPEN, CommentCodes.CLOSED, CommentCodes.NOT_OPEN];

  // selected drop down filters
  public purposeCodeFilters: string[] = [];
  public regionCodeFilter = '';
  public statusCodeFilters: string[] = [];
  public commentCodeFilters: string[] = [];

  // need to reset pagination when a filter is changed, as we can't be sure how many pages of results will exist.
  public filterChanged = false;

  // pagination values
  public pagination = {
    totalItems: 0,
    currentPage: 1,
    itemsPerPage: 20,
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
      this.applicationService.getAll({ getCurrentPeriod: true }, this.getApplicationQueryParameters()),
      this.applicationService.getCount(this.getApplicationQueryParameters())
    )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        ([applications, count]) => {
          this.applications = this.applyCommentPeriodFilter(applications);
          this.updatePagination({ totalItems: count });

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
    const queryParams = { ...this.getApplicationQueryParameters() };
    // ignore pagination as we want to export ALL search results
    delete queryParams.pageNum;
    delete queryParams.pageSize;

    this.applicationService
      .getAll({ getCurrentPeriod: true }, queryParams)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        applications => {
          // All fields that will be included in the csv, and optionally what the column header text will be.
          const fields: any[] = [
            'cl_file',
            { label: 'dispositionID', value: 'tantalisID' },
            'client',
            'purpose',
            'subpurpose',
            'reason',
            'status',
            'businessUnit',
            'location',
            { label: 'area (hectares)', value: 'areaHectares' },
            'createdDate',
            'publishDate',
            'statusHistoryEffectiveDate',
            'description',
            { label: 'comment period status', value: 'cpStatus' },
            { label: 'comment period start date', value: 'currentPeriod.startDate' },
            { label: 'comment period end date', value: 'currentPeriod.endDate' },
            { label: 'comment period number of comments', value: 'numComments' }
          ];
          this.exportService.exportAsCSV(applications, `ACRFD_Applications_Export_${moment().format()}`, fields);
          this.exporting = false;
        },
        error => {
          this.exporting = false;
          console.log('error = ', error);
          alert("Uh-oh, couldn't export applications");
        }
      );
  }

  // URL Parameters

  /**
   * Set any initial filter, pagination, and sort values that were saved in the URL.
   *
   * @memberof ListComponent
   */
  public setInitialQueryParameters(): void {
    this.pagination.currentPage = +this.paramMap.get('page') || 1;

    this.sorting.column = this.paramMap.get('col') || null;
    this.sorting.direction = +this.paramMap.get('dir') || 0;

    this.purposeCodeFilters = (this.paramMap.get('purpose') && this.paramMap.get('purpose').split('|')) || [];
    this.regionCodeFilter = this.paramMap.get('region') || '';
    this.statusCodeFilters = (this.paramMap.get('status') && this.paramMap.get('status').split('|')) || [];
    this.commentCodeFilters = (this.paramMap.get('comment') && this.paramMap.get('comment').split('|')) || [];
  }

  /**
   * Returns an instance of IApplicationParameters populated with the current filter and pagination values.
   *
   * @returns {IApplicationParameters} instance of IApplicationParameters
   * @memberof ListComponent
   */
  public getApplicationQueryParameters(): IApplicationParameters {
    const queryParams: IApplicationParameters = {
      isDeleted: false,
      pageNum: this.pagination.currentPage - 1, // API starts at 0, while this component starts at 1
      pageSize: this.pagination.itemsPerPage,
      purpose: _.flatMap(
        this.purposeCodeFilters.map(purposeCode => ConstantUtils.getCode(CodeType.PURPOSE, purposeCode))
      ),
      status: _.flatMap(
        this.statusCodeFilters.map(statusCode => ConstantUtils.getMappedCodes(CodeType.STATUS, statusCode))
      ),
      businessUnit: ConstantUtils.getCode(CodeType.REGION, this.regionCodeFilter)
    };

    return queryParams;
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
      params['col'] = this.sorting.column;
      params['dir'] = this.sorting.direction;
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
    if (this.commentCodeFilters && this.commentCodeFilters.length) {
      params['comment'] = this.convertArrayIntoPipeString(this.commentCodeFilters);
    }

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
    this.commentCodeFilters = [];

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

  /**
   * Set comment period status filter.
   *
   * @param {string} commentCode
   * @memberof ListComponent
   */
  public setCommentFilter(commentCode: string): void {
    this.commentCodeFilters = commentCode ? [commentCode] : [];
    this.filterChanged = true;
    this.saveQueryParameters();
  }

  /**
   * Given an array of Applications, filter out those whos comment periods dont match the comment period status filter.
   *
   * @param {Application[]} applications
   * @returns
   * @memberof ListComponent
   */
  public applyCommentPeriodFilter(applications: Application[]): Application[] {
    if (!applications || !this.commentCodeFilters || !this.commentCodeFilters.length) {
      return applications;
    }

    return applications.filter(application => {
      return _.flatMap(
        this.commentCodeFilters.map(commentCode => ConstantUtils.getTextLong(CodeType.COMMENT, commentCode))
      ).includes(application.cpStatus);
    });
  }

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

    this.sorting.column = sortBy;
    this.sorting.direction = this.sorting.direction > 0 ? -1 : 1;
    this.saveQueryParameters();
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
   * Cleanup on component destroy.
   *
   * @memberof ListComponent
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
