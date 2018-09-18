import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Location } from '@angular/common';
import { MatSnackBarRef, SimpleSnackBar, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { DialogService } from 'ng2-bootstrap-modal';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/concat';
import * as moment from 'moment-timezone';
import * as _ from 'lodash';

import { SelectOrganizationComponent } from 'app/applications/select-organization/select-organization.component';
import { ConfirmComponent } from 'app/confirm/confirm.component';
import { ApplicationAsideComponent } from 'app/applications/application-aside/application-aside.component';
import { Application } from 'app/models/application';
import { CommentPeriod } from 'app/models/commentperiod';
import { Document } from 'app/models/document';
import { Decision } from 'app/models/decision';
import { ApiService } from 'app/services/api';
import { ApplicationService } from 'app/services/application.service';
import { CommentPeriodService } from 'app/services/commentperiod.service';
import { DecisionService } from 'app/services/decision.service';
import { DocumentService } from 'app/services/document.service';

@Component({
  selector: 'app-application-add-edit',
  templateUrl: './application-add-edit.component.html',
  styleUrls: ['./application-add-edit.component.scss']
})

export class ApplicationAddEditComponent implements OnInit, OnDestroy {
  @ViewChild('applicationForm') applicationForm: NgForm;
  @ViewChild(ApplicationAsideComponent) applicationAside: ApplicationAsideComponent;

  public application: Application = null;
  public startDate: string = null;
  public endDate: string = null;
  public delta = 30; // default # days (including today)
  private snackBarRef: MatSnackBarRef<SimpleSnackBar> = null;
  private ngUnsubscribe: Subject<boolean> = new Subject<boolean>();
  private allowDeactivate = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private _location: Location,
    public snackBar: MatSnackBar,
    public api: ApiService, // also used in template
    private applicationService: ApplicationService,
    private commentPeriodService: CommentPeriodService,
    private dialogService: DialogService,
    private decisionService: DecisionService,
    private documentService: DocumentService
  ) {
    // if we have URL fragment, scroll to specified section
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = router.parseUrl(router.url);
        if (url.fragment) {
          // ensure element exists
          const element = document.querySelector('#' + url.fragment);
          if (element) {
            document.getElementById(url.fragment).scrollIntoView();
          }
        }
      }
    });
  }

  // check for unsaved changes before closing (or reloading) current tab/window
  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event) {
    // display browser alert if needed
    if (!this.allowDeactivate && (this.applicationForm.dirty)) {
      event.returnValue = true;
    }
  }

  // check for unsaved changes before navigating away from current route (ie, this page)
  canDeactivate(): Observable<boolean> | boolean {
    // allow synchronous navigation if everything is OK
    if (this.allowDeactivate || this.applicationForm.pristine) {
      return true;
    }

    // otherwise prompt the user with observable (asynchronous) dialog
    return this.dialogService.addDialog(ConfirmComponent,
      {
        title: 'Unsaved Changes',
        message: 'Click OK to discard your changes or Cancel to return to the application.'
      }, {
        backdropColor: 'rgba(0, 0, 0, 0.5)'
      })
      .takeUntil(this.ngUnsubscribe);
  }

  ngOnInit() {
    // if we're not logged in, redirect
    if (!this.api.ensureLoggedIn()) {
      return false;
    }

    // get data from route resolver
    this.route.data
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        (data: { application: Application }) => {
          if (data.application) {
            this.internalLoadData(data.application);
          } else {
            alert('Uh-oh, couldn\'t load application');
            // application not found --> navigate back to search
            this.router.navigate(['/search']);
          }
        }
      );
  }

  private internalLoadData(application: Application) {
    // make a local copy of the in-memory (cached) application so we don't change it
    // this allows us to abort editing
    // but forces us to reload cached application properties for certain changes
    this.application = _.cloneDeep(application);

    // add comment period if there isn't one already
    // (not just on create but also on edit -- this will fix the situation where existing
    //  applications don't have a comment period)

    if (!this.application.currentPeriod) {
      this.application.currentPeriod = new CommentPeriod();
    } else {
      // set date inputs
      this.startDate = this.formatDate(new Date(this.application.currentPeriod.startDate));
      this.endDate = this.formatDate(new Date(this.application.currentPeriod.endDate));
      this.delta = moment(this.application.currentPeriod.endDate).diff(moment(this.application.currentPeriod.startDate), 'days') + 1;
    }
  }

  ngOnDestroy() {
    // dismiss any open snackbar
    if (this.snackBarRef) { this.snackBarRef.dismiss(); }

    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  // cancel
  // see 'canDeactivate' for the UI notification / form reset functionality
  public cancelChanges() {
    this._location.back();
  }

  // returns yyyy-mm-dd for use by date input
  private formatDate(date: Date): string {
    return date ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : null;
  }

  public onDate1Chg(startDate: string) {
    if (startDate) {
      this.application.currentPeriod.startDate = moment(startDate).toDate();
      // to set dates, we also need delta
      if (this.delta) {
        this.setDates(true, false, false);
      }
    }
  }

  public onDeltaChg(delta: number) {
    if (delta !== null) {
      this.delta = delta;
      // to set dates, we also need start date
      if (this.application.currentPeriod.startDate) {
        this.setDates(false, true, false);
      }
    }
  }

  public onDate2Chg(endDate: string) {
    if (endDate) {
      this.application.currentPeriod.endDate = moment(endDate).toDate();
      // to set dates, we also need start date
      if (this.application.currentPeriod.startDate) {
        this.setDates(false, false, true);
      }
    }
  }

  private setDates(start?: boolean, delta?: boolean, end?: boolean) {
    if (start) {
      // when start changes, adjust end accordingly
      this.application.currentPeriod.endDate = new Date(this.application.currentPeriod.startDate);
      this.application.currentPeriod.endDate.setDate(this.application.currentPeriod.startDate.getDate() + this.delta - 1);

    } else if (delta) {
      // when delta changes, adjust end accordingly
      this.application.currentPeriod.endDate = new Date(this.application.currentPeriod.startDate);
      this.application.currentPeriod.endDate.setDate(this.application.currentPeriod.startDate.getDate() + this.delta - 1);

    } else if (end) {
      // when end changes, adjust delta accordingly
      // use moment to handle Daylight Saving Time changes
      this.delta = moment(this.application.currentPeriod.endDate).diff(moment(this.application.currentPeriod.startDate), 'days') + 1;
    }

    // update date inputs
    this.startDate = this.formatDate(this.application.currentPeriod.startDate);
    this.endDate = this.formatDate(this.application.currentPeriod.endDate);
  }

  public selectClient() {
    this.dialogService.addDialog(SelectOrganizationComponent,
      {
        dispositionId: this.application.tantalisID
      }, {
        backdropColor: 'rgba(0, 0, 0, 0.5)'
      })
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        clientString => {
          if (clientString && clientString.length > 0) {
            if (clientString !== this.application.client) {
              this.applicationForm.form.markAsDirty();
            }
            this.application.client = clientString;
          }
        }
      );
  }

  // submit new application
  public addApplication() {
    if (this.applicationForm.invalid) {
      this.dialogService.addDialog(ConfirmComponent,
        {
          title: 'Cannot Create Application',
          message: 'Please check for required fields or errors.',
          okOnly: true
        }, {
          backdropColor: 'rgba(0, 0, 0, 0.5)'
        })
        .takeUntil(this.ngUnsubscribe);
    } else {
      // set publish date
      // adjust for current tz
      this.application.publishDate = moment(new Date()).format();

      // first add application
      this.applicationService.add(this.application)
        .takeUntil(this.ngUnsubscribe)
        .subscribe(
          application => { // onNext
            this.application._id = application._id;
            this.snackBarRef = this.snackBar.open('Application created...', null, { duration: 2000 });

            // TODO: upload all application or decision documents

            // then add commentperiod
            this.application.currentPeriod._application = this.application._id;
            this.commentPeriodService.add(this.application.currentPeriod)
              .takeUntil(this.ngUnsubscribe)
              .subscribe(
                commentPeriod => {
                  this.application.currentPeriod._id = commentPeriod._id;
                  this.snackBarRef = this.snackBar.open('Comment period created...', null, { duration: 2000 });

                  // then add decision (if any)
                  if (this.application.decision) {
                    this.application.decision._application = application._id;
                    this.decisionService.add(this.application.decision)
                      .takeUntil(this.ngUnsubscribe)
                      .subscribe(
                        decision => {
                          this.application.decision._id = decision._id;
                          this.snackBarRef = this.snackBar.open('Decision created...', null, { duration: 2000 });
                        },
                        error => {
                          // TODO: throw new error for outer observable to catch
                          console.log('error =', error);
                          alert('Uh-oh, couldn\'t create decision');
                        }
                      );
                  }
                },
                error => {
                  // TODO: throw new error for outer observable to catch
                  console.log('error =', error);
                  alert('Uh-oh, couldn\'t create comment period');
                }
              );
          },
          error => {
            console.log('error =', error);
            alert('Uh-oh, couldn\'t create application');
          },
          () => { // onCompleted
            this.applicationForm.form.markAsPristine();

            // finally force-reload all app data
            this.applicationService.getById(this.application._id, true)
              .takeUntil(this.ngUnsubscribe)
              .subscribe(
                application2 => {
                  this.internalLoadData(application2);
                },
                error => {
                  console.log('error =', error);
                  alert('Uh-oh, couldn\'t reload application');
                  // application not found --> navigate back to search
                  this.router.navigate(['/search']);
                }
              );
          }
        );
    }
  }

  public addDecision() {
    this.application.decision = new Decision();
  }

  public saveApplication() {
    if (this.applicationForm.invalid) {
      this.dialogService.addDialog(ConfirmComponent,
        {
          title: 'Cannot Save Application',
          message: 'Please check for required fields or errors.',
          okOnly: true
        }, {
          backdropColor: 'rgba(0, 0, 0, 0.5)'
        })
        .takeUntil(this.ngUnsubscribe);
    } else {
      // update publish date
      // adjust for current tz
      this.application.publishDate = moment(this.application.publishDate).format();

      let observables = Observable.of(null);

      // TODO: upload (and auto-publish) any new application or decision documents

      // first add/save commentperiod (if any)
      if (this.application.currentPeriod) {
        if (!this.application.currentPeriod._id) {
          this.application.currentPeriod._application = this.application._id;
          observables = observables.concat(this.commentPeriodService.add(this.application.currentPeriod));
          // auto-publish new comment period
          if (this.application.isPublished) {
            observables = observables.concat(this.commentPeriodService.publish(this.application.currentPeriod));
          }
        } else {
          observables = observables.concat(this.commentPeriodService.save(this.application.currentPeriod));
        }
      }

      // then add/save decision (if any)
      if (this.application.decision) {
        if (!this.application.decision._id) {
          this.application.decision._application = this.application._id;
          observables = observables.concat(this.decisionService.add(this.application.decision));
          // auto-publish new decision
          if (this.application.isPublished) {
            observables = observables.concat(this.decisionService.publish(this.application.decision));
          }
        } else {
          observables = observables.concat(this.decisionService.save(this.application.decision));
        }
      }

      // finally save application
      observables = observables.concat(this.applicationService.save(this.application));

      observables.takeUntil(this.ngUnsubscribe)
        .subscribe(
          () => { // onNext
            // do nothing here - see onCompleted() function below
          },
          error => {
            console.log('error =', error);
            alert('Uh-oh, couldn\'t save application');
          },
          () => { // onCompleted
            // reload cached app only so we don't lose other local data
            // TODO: verify that this reloads new comment period and new decision -- IT DOESN'T // TO FIX
            // TODO: redirect to reload this page?
            // this.applicationService.getById(this.application._id, true).takeUntil(this.ngUnsubscribe).subscribe();
            this.applicationForm.form.markAsPristine();
            this.snackBarRef = this.snackBar.open('Application saved...', null, { duration: 2000 });
            this.router.navigate(['/a', this.application._id, 'edit']);
          }
        );
    }
  }

  // upload application or decision documents
  private uploadFiles(fileList: FileList, documents: Document[]) {
    for (let i = 0; i < fileList.length; i++) {
      if (fileList[i]) {
        const formData = new FormData();
        if (documents === this.application.documents) {
          formData.append('_application', this.application._id);
        } else if (documents === this.application.decision.documents) {
          formData.append('_decision', this.application.decision._id);
        } else {
          break; // unknown error
        }
        formData.append('displayName', fileList[i].name);
        formData.append('upfile', fileList[i]);
        this.documentService.add(formData)
          .takeUntil(this.ngUnsubscribe)
          .subscribe(
            doc => {
              // upload succeeded
              // reload cached app and update local data separately so we don't lose other local data
              this.applicationService.getById(this.application._id, true).takeUntil(this.ngUnsubscribe).subscribe();
              documents.push(doc);
              this.snackBarRef = this.snackBar.open('File uploaded...', null, { duration: 2000 });
            },
            error => {
              console.log('error =', error);
              alert('Uh-oh, couldn\'t upload file');
            }
          );
      }
    }
  }

  public deleteDocument(document: Document, documents: Document[]) {
    // TODO: if no document id, just remove doc from list
    if (document._id) {
      this.documentService.delete(document)
        .takeUntil(this.ngUnsubscribe)
        .subscribe(
          doc => {
            // delete succeeded
            // reload cached app and update local data separately so we don't lose other local data
            this.applicationService.getById(this.application._id, true).takeUntil(this.ngUnsubscribe).subscribe();
            _.remove(documents, item => (item._id === doc._id));
            this.snackBarRef = this.snackBar.open('Document deleted...', null, { duration: 2000 });
          },
          error => {
            console.log('error =', error);
            alert('Uh-oh, couldn\'t delete document');
          }
        );
    }
  }

}
