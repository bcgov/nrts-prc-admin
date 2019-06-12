import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBarRef, SimpleSnackBar, MatSnackBar } from '@angular/material';
import { Router, ActivatedRoute, Params, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as _ from 'lodash';

import { SearchService } from 'app/services/search.service';
import { Application } from 'app/models/application';
import { ConstantUtils, CodeType } from 'app/utils/constants/constantUtils';
import { StatusCodes, ReasonCodes } from 'app/utils/constants/application';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject<boolean>();
  private paramMap: ParamMap = null;

  public keywords: string;
  public applications: Application[] = [];
  public count = 0; // used in template

  private snackBarRef: MatSnackBarRef<SimpleSnackBar> = null;

  public searching = false;
  public ranSearch = false;

  constructor(
    private location: Location,
    public snackBar: MatSnackBar,
    public searchService: SearchService, // used in template
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // get search terms from route
    this.route.queryParamMap.pipe(takeUntil(this.ngUnsubscribe)).subscribe(paramMap => {
      this.paramMap = paramMap;

      this.setInitialQueryParameters();

      if (this.keywords) {
        this.doSearch();
      }
    });
  }

  private doSearch() {
    this.searching = true;

    this.applications = [];
    this.count = 0;

    this.searchService
      .getApplicationsByCLFileAndTantalisID(this.getQueryParameters())
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        applications => {
          applications.forEach(application => {
            // add application if not already in the list (no duplicates allowed)
            if (!_.find(this.applications, app => app.tantalisID === application.tantalisID)) {
              this.applications.push(application);
            }
          });
          this.count = this.applications.length;
        },
        error => {
          console.log('error =', error);

          this.searching = false;
          this.ranSearch = true;

          this.snackBarRef = this.snackBar.open('Error searching applications ...', 'RETRY');
          this.snackBarRef.onAction().subscribe(() => this.onSubmit());
        },
        () => {
          this.searching = false;
          this.ranSearch = true;
        }
      );
  }

  public setInitialQueryParameters() {
    this.keywords = this.paramMap.get('keywords') || '';
  }

  public getQueryParameters() {
    const queryParameters = _.uniq(_.compact(this.keywords.split(',')));
    return queryParameters;
  }

  public saveQueryParameters() {
    const params: Params = {};

    params['keywords'] = this.keywords;

    // change browser URL without reloading page (so any query params are saved in history)
    this.location.go(this.router.createUrlTree([], { relativeTo: this.route, queryParams: params }).toString());
  }

  public onSubmit() {
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }

    this.saveQueryParameters();

    this.doSearch();
  }

  public onImport(application: Application) {
    if (application) {
      // save application data from search results
      const params = {
        // initial data
        purpose: application.purpose,
        subpurpose: application.subpurpose,
        type: application.type,
        subtype: application.subtype,
        status: application.status,
        reason: application.reason,
        tenureStage: application.tenureStage,
        location: application.location,
        businessUnit: application.businessUnit,
        cl_file: application.cl_file,
        tantalisID: application.tantalisID,
        legalDescription: application.legalDescription,
        client: application.client,
        statusHistoryEffectiveDate: application.statusHistoryEffectiveDate
      };
      // go to add-edit page
      this.router.navigate(['/a', 0, 'edit'], { queryParams: params });
    } else {
      console.log('error, invalid application =', application);
      this.snackBarRef = this.snackBar.open('Error creating application ...', null, { duration: 3000 });
    }
  }

  /**
   * Returns true if the application has an abandoned status AND an amendment reason.
   *
   * @param {Application} application
   * @returns {boolean} true if the application has an abandoned status AND an amendment reason, false otherwise.
   * @memberof SearchComponent
   */
  isAmendment(application: Application): boolean {
    return (
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
   * @memberof SearchComponent
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

  ngOnDestroy() {
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }

    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
