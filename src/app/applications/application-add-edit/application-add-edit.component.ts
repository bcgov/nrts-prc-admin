import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Location } from '@angular/common';
import { MatSnackBarRef, SimpleSnackBar, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from 'ng2-bootstrap-modal';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/takeUntil';
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
  @ViewChild('decisionForm') decisionForm: NgForm;
  @ViewChild(ApplicationAsideComponent) applicationAside: ApplicationAsideComponent;

  public application: Application = null;
  public commentPeriod: CommentPeriod = null;
  public startDate: string = null;
  public endDate: string = null;
  public delta = 30; // # days including today
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
  ) { }

  // check for unsaved changes before closing (or reloading) current tab/window
  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event) {
    // display browser alert if needed
    if (!this.allowDeactivate && (this.applicationForm.dirty || this.decisionForm.dirty)) {
      event.returnValue = true;
    }
  }

  // Check for unsaved changes before navigating away from current route (ie, this page)
  canDeactivate(): Observable<boolean> | boolean {
    // allow synchronous navigation if everything is OK
    if (this.allowDeactivate || (this.applicationForm.pristine && this.decisionForm.pristine)) {
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
            // make a local copy of the in-memory (cached) application so we don't change it
            // this allows us to abort editing
            // but forces us to reload cached application properties for certain changes
            this.application = _.cloneDeep(data.application);

            // set publish date
            if (!this.application.publishDate) {
              this.application.publishDate = new Date();
            }
            // TODO: why do we need to do this on an existing application?
            this.application.publishDate = moment(this.application.publishDate).format();

            // create new comment period and set initial start date (which also sets end date)
            this.commentPeriod = new CommentPeriod({ _application: this.application._id });
            this.onDate1Chg(this.formatDate(new Date())); // today

            // TODO: handle new vs existing comment period
            // if (!this.application.commentPeriod) {
            //   this.isNew = true;
            //   // create new comment period
            //   this.cp = new CommentPeriod();
            //   this.cp._application = this.appId;

            //   // set initial start date and duration
            //   const n = new Date();
            //   this.onDate1Chg({ 'year': n.getFullYear(), 'month': n.getMonth() + 1, 'day': n.getDate() });
            //   this.onDeltaChg(this.delta);
            // } else {
            //   this.isNew = false;
            //   // make a **deep copy** of the passed-in comment period so we don't change it
            //   this.cp = _.cloneDeep(this.commentPeriod);
            //   this.cp._application = this.appId;

            //   // set start and end dates
            //   const s = new Date(this.cp.startDate);
            //   const e = new Date(this.cp.endDate); // NB: must save e before setting s
            //   this.onDate1Chg({ 'year': s.getFullYear(), 'month': s.getMonth() + 1, 'day': s.getDate() });
            //   this.onDate2Chg({ 'year': e.getFullYear(), 'month': e.getMonth() + 1, 'day': e.getDate() });
            // }

          } else {
            // application not found --> navigate back to search
            alert('Uh-oh, couldn\'t load application');
            this.router.navigate(['/search']);
          }
        }
      );
  }

  ngOnDestroy() {
    // dismiss any open snackbar
    if (this.snackBarRef) { this.snackBarRef.dismiss(); }

    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  // returns yyyy-mm-dd for use by date input
  private formatDate(date: Date): string {
    return date ? `${date.getUTCFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : null;
  }

  public onDate1Chg(startDate: string) {
    this.commentPeriod.startDate = moment(startDate).toDate();
    this.setDates(true, false, false);
  }

  public onDeltaChg(delta: number) {
    this.delta = delta;
    this.setDates(false, true, false);
  }

  public onDate2Chg(endDate: string) {
    this.commentPeriod.endDate = moment(endDate).toDate();
    this.setDates(false, false, true);
  }

  private setDates(start?: boolean, delta?: boolean, end?: boolean) {
    if (start) {
      // when start changes, adjust end accordingly
      this.commentPeriod.endDate = new Date(this.commentPeriod.startDate);
      this.commentPeriod.endDate.setDate(this.commentPeriod.startDate.getDate() + this.delta - 1);

    } else if (delta) {
      // when delta changes, adjust end accordingly
      this.commentPeriod.endDate = new Date(this.commentPeriod.startDate);
      this.commentPeriod.endDate.setDate(this.commentPeriod.startDate.getDate() + this.delta - 1);

    } else if (end) {
      // when end changes, adjust delta accordingly
      // use moment to handle Daylight Saving Time changes
      this.delta = moment(this.commentPeriod.endDate).diff(moment(this.commentPeriod.startDate), 'days') + 1;
    }

    // update date pickers
    this.startDate = this.formatDate(this.commentPeriod.startDate);
    this.endDate = this.formatDate(this.commentPeriod.endDate);
  }

  public selectClient() {
    let dispId: number = null;

    if (this.application && this.application.tantalisID) {
      dispId = this.application.tantalisID;
    }

    this.dialogService.addDialog(SelectOrganizationComponent,
      {
        dispositionId: dispId
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
        },
        error => {
          console.log('error =', error);
        }
      );
  }

  // Cancel
  // See 'canDeactivate' for the UI notification / form reset functionality
  public cancelChanges() {
    this._location.back();
  }

  private reloadData(id: string) {
    // force-reload cached app data
    this.applicationService.getById(id, true)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        application => {
          // make a local copy of the in-memory (cached) application so we don't change it
          // this allows us to abort editing
          // but forces us to reload cached application properties for certain changes
          this.application = _.cloneDeep(application);

          if (!this.application.publishDate) {
            this.application.publishDate = new Date();
          }
          this.application.publishDate = moment(this.application.publishDate).format();

          this.applicationForm.form.markAsPristine();
          this.decisionForm.form.markAsPristine();
        }
      );
  }

  // Create New Application
  public createApplication() {
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
      // adjust for current tz
      this.application.publishDate = moment(this.application.publishDate).format();

      this.applicationService.add(this.application)
        .takeUntil(this.ngUnsubscribe)
        .subscribe(
          application => {
            // TODO: update URL with new app id
            // reload cached app and local copy
            this.reloadData(application._id);
            this.snackBarRef = this.snackBar.open('Application created...', null, { duration: 3000 });

            // also create comment period
            // TODO: also need to publish it
            // TODO: these adds should all succeed or all fail
            this.commentPeriodService.add(this.commentPeriod)
              .subscribe(
                value => {
                  this.snackBarRef = this.snackBar.open('Comment period created...', null, { duration: 3000 });
                },
                error => {
                  console.log('error =', error);
                  this.snackBarRef = this.snackBar.open('Error creating comment period...', null, { duration: 3000 });
                }
              );
          },
          error => {
            console.log('error =', error);
            this.snackBarRef = this.snackBar.open('Error creating application...', null, { duration: 3000 });
          }
        );
    }
  }

  // Save Changes to Application
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
      // adjust for current tz
      this.application.publishDate = moment(this.application.publishDate).format();

      this.applicationService.save(this.application)
        .takeUntil(this.ngUnsubscribe)
        .subscribe(
          application => {
            // reload cached app only so we don't lose other local data
            this.applicationService.getById(this.application._id, true).takeUntil(this.ngUnsubscribe).subscribe();
            this.applicationForm.form.markAsPristine();
            this.snackBarRef = this.snackBar.open('Application saved...', null, { duration: 3000 });

            // also save comment period
            // TODO: these saves should all succeed or all fail
            this.commentPeriodService.save(this.commentPeriod)
              .subscribe(
                value => {
                  this.snackBarRef = this.snackBar.open('Comment period saved...', null, { duration: 3000 });
                },
                error => {
                  console.log('error =', error);
                  this.snackBarRef = this.snackBar.open('Error saving comment period...', null, { duration: 3000 });
                }
              );
          },
          error => {
            console.log('error =', error);
            this.snackBarRef = this.snackBar.open('Error saving application...', null, { duration: 3000 });
          }
        );
    }
  }

  private publishCommentPeriod(commentPeriod: CommentPeriod) {
    return this.commentPeriodService.publish(commentPeriod)
      .toPromise()
      .then(
        value => {
          this.snackBarRef = this.snackBar.open('Comment period published...', null, { duration: 3000 });
        },
        error => {
          console.log('error =', error);
          this.snackBarRef = this.snackBar.open('Error publishing comment period...', null, { duration: 3000 });
        }
      );
  }

  private unPublishCommentPeriod(commentPeriod: CommentPeriod) {
    return this.commentPeriodService.unPublish(commentPeriod)
      .toPromise()
      .then(
        value => {
          this.snackBarRef = this.snackBar.open('Comment period unpublished...', null, { duration: 3000 });
        },
        error => {
          console.log('error =', error);
          this.snackBarRef = this.snackBar.open('Error unpublishing comment period...', null, { duration: 3000 });
        }
      );
  }

  // Upload Application Documents
  public uploadFiles(fileList: FileList, documents: Document[]) {
    for (let i = 0; i < fileList.length; i++) {
      if (fileList[i]) {
        const formData = new FormData();
        formData.append('_application', this.application._id);
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
              this.snackBarRef = this.snackBar.open('File uploaded...', null, { duration: 3000 });
            },
            error => {
              console.log('error =', error);
              this.snackBarRef = this.snackBar.open('Error uploading file...', null, { duration: 3000 });
            }
          );
      }
    }
  }

  public deleteDocument(document: Document, documents: Document[]) {
    this.documentService.delete(document)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        doc => {
          // delete succeeded
          // reload cached app and update local data separately so we don't lose other local data
          this.applicationService.getById(this.application._id, true).takeUntil(this.ngUnsubscribe).subscribe();
          _.remove(documents, function (item) {
            return (item._id === doc._id);
          });
          this.snackBarRef = this.snackBar.open('Document deleted...', null, { duration: 3000 });
        },
        error => {
          console.log('error =', error);
          this.snackBarRef = this.snackBar.open('Error deleting document...', null, { duration: 3000 });
        }
      );
  }

  public publishDocument(document: Document, documents: Document[]) {
    this.documentService.publish(document)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        () => {
          // publish succeeded
          // reload cached app and update local data separately so we don't lose other local data
          this.applicationService.getById(this.application._id, true).takeUntil(this.ngUnsubscribe).subscribe();
          document.isPublished = true;
          this.snackBarRef = this.snackBar.open('Document published...', null, { duration: 3000 });
        },
        error => {
          console.log('error =', error);
          this.snackBarRef = this.snackBar.open('Error publishing document...', null, { duration: 3000 });
        }
      );
  }

  public unPublishDocument(document: Document, documents: Document[]) {
    this.documentService.unPublish(document)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        () => {
          // unpublish succeeded
          // reload cached app and update local data separately so we don't lose other local data
          this.applicationService.getById(this.application._id, true).takeUntil(this.ngUnsubscribe).subscribe();
          document.isPublished = false;
          this.snackBarRef = this.snackBar.open('Document unpublished...', null, { duration: 3000 });
        },
        error => {
          console.log('error =', error);
          this.snackBarRef = this.snackBar.open('Error unpublishing document...', null, { duration: 3000 });
        }
      );
  }

  addDecision() {
    const decision = new Decision();
    decision._application = this.application._id;

    this.decisionService.add(decision)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        decsn => {
          // add succeeded
          // reload cached app and update local data separately so we don't lose other local data
          this.applicationService.getById(this.application._id, true).takeUntil(this.ngUnsubscribe).subscribe();
          this.application.decision = decsn;
          this.snackBarRef = this.snackBar.open('Decision added...', null, { duration: 3000 });
        },
        error => {
          console.log('error =', error);
          this.snackBarRef = this.snackBar.open('Error adding decision...', null, { duration: 3000 });
        }
      );
  }

  saveDecision() {
    this.decisionService.save(this.application.decision)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        () => {
          // save succeeded
          // reload cached app only so we don't lose other local data
          this.applicationService.getById(this.application._id, true).takeUntil(this.ngUnsubscribe).subscribe();
          this.decisionForm.form.markAsPristine();
          this.snackBarRef = this.snackBar.open('Decision saved...', null, { duration: 3000 });
        },
        error => {
          console.log('error =', error);
          this.snackBarRef = this.snackBar.open('Error saving decision...', null, { duration: 3000 });
        }
      );
  }

  deleteDecision() {
    this.dialogService.addDialog(ConfirmComponent,
      {
        title: 'Confirm Deletion',
        message: 'Do you really want to delete this decision?'
      }, {
        backdropColor: 'rgba(0, 0, 0, 0.5)'
      })
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        isConfirmed => {
          if (isConfirmed) {
            this.decisionService.delete(this.application.decision)
              .takeUntil(this.ngUnsubscribe)
              .subscribe(
                () => {
                  // delete succeeded
                  // reload cached app and update local data separately so we don't lose other local data
                  this.applicationService.getById(this.application._id, true).takeUntil(this.ngUnsubscribe).subscribe();
                  this.application.decision = null;
                  this.snackBarRef = this.snackBar.open('Decision deleted...', null, { duration: 3000 });
                },
                error => {
                  console.log('error =', error);
                  this.snackBarRef = this.snackBar.open('Error deleting decision...', null, { duration: 3000 });
                }
              );
          }
        }
      );
  }

  publishDecision() {
    if (this.decisionForm.dirty) {
      this.dialogService.addDialog(ConfirmComponent,
        {
          title: 'Cannot Publish Decision',
          message: 'Please save pending decision changes first.',
          okOnly: true
        }, {
          backdropColor: 'rgba(0, 0, 0, 0.5)'
        })
        .takeUntil(this.ngUnsubscribe);
    } else {
      this.decisionService.publish(this.application.decision)
        .takeUntil(this.ngUnsubscribe)
        .subscribe(
          () => {
            // publish succeeded
            // reload cached app and update local data separately so we don't lose other local data
            this.applicationService.getById(this.application._id, true).takeUntil(this.ngUnsubscribe).subscribe();
            this.application.decision.isPublished = true;
            this.snackBarRef = this.snackBar.open('Decision published...', null, { duration: 3000 });
          },
          error => {
            console.log('error =', error);
            this.snackBarRef = this.snackBar.open('Error publishing decision...', null, { duration: 3000 });
          }
        );
    }
  }

  unPublishDecision() {
    this.decisionService.unPublish(this.application.decision)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        () => {
          // unpublish succeeded
          // reload cached app and update local data separately so we don't lose other local data
          this.applicationService.getById(this.application._id, true).takeUntil(this.ngUnsubscribe).subscribe();
          this.application.decision.isPublished = false;
          this.snackBarRef = this.snackBar.open('Decision unpublished...', null, { duration: 3000 });
        },
        error => {
          console.log('error =', error);
          this.snackBarRef = this.snackBar.open('Error unpublishing decision...', null, { duration: 3000 });
        }
      );
  }

}
