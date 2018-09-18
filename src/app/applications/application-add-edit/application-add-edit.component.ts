import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Location } from '@angular/common';
import { MatSnackBarRef, SimpleSnackBar, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
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
  @ViewChild('decisionForm') decisionForm: NgForm;
  @ViewChild(ApplicationAsideComponent) applicationAside: ApplicationAsideComponent;

  public application: Application = null;
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

  // check for unsaved changes before navigating away from current route (ie, this page)
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
            this.internalLoadData(data.application);
          } else {
            // application not found --> navigate back to search
            alert('Uh-oh, couldn\'t load application');
            this.router.navigate(['/search']);
          }
        }
      );
  }

  private reloadData(id: string) {
    console.log('reloading data');
    // force-reload cached app data (including comment period and decision)
    this.applicationService.getById(id, true)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        application => {
          this.internalLoadData(application);
        },
        error => {
          console.log('error =', error);
          // application not found --> navigate back to search
          alert('Uh-oh, couldn\'t load application');
          this.router.navigate(['/search']);
        }
      );
  }

  private internalLoadData(application: Application) {
    // make a local copy of the in-memory (cached) application so we don't change it
    // this allows us to abort editing
    // but forces us to reload cached application properties for certain changes
    this.application = _.cloneDeep(application);

    // set publish date
    if (!this.application.publishDate) {
      this.application.publishDate = new Date();
    }
    // TODO: why do we need to do this on an existing application?
    this.application.publishDate = moment(this.application.publishDate).format();

    // TODO: handle new vs existing comment period
    // TODO: create comment period if there isn't one already
    //       (not just on create but also on edit)
    //       this will fix the situation of application add succeeded but comment period add failed

    if (!this.application.currentPeriod) {
      // create new comment period and set initial start date (which also sets end date)
      this.application.currentPeriod = new CommentPeriod({ _application: this.application._id });
      this.onDate1Chg(this.formatDate(new Date())); // today
    } else {
      // set start and end dates
      const s = new Date(this.application.currentPeriod.startDate);
      const e = new Date(this.application.currentPeriod.endDate); // NB: must save e before setting s
      this.onDate1Chg(this.formatDate(s));
      this.onDate2Chg(this.formatDate(e));
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
    return date ? `${date.getUTCFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : null;
  }

  public onDate1Chg(startDate: string) {
    this.application.currentPeriod.startDate = moment(startDate).toDate();
    this.setDates(true, false, false);
  }

  public onDeltaChg(delta: number) {
    this.delta = delta;
    this.setDates(false, true, false);
  }

  public onDate2Chg(endDate: string) {
    this.application.currentPeriod.endDate = moment(endDate).toDate();
    this.setDates(false, false, true);
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
        },
        error => {
          console.log('error =', error);
          this.snackBarRef = this.snackBar.open('Error selecting client...', null, { duration: 3000 });
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
      // adjust for current tz
      this.application.publishDate = moment(this.application.publishDate).format();

      // first add application
      // then add commentperiod
      this.applicationService.add(this.application)
        .concat(this.commentPeriodService.add(this.application.currentPeriod))
        .takeUntil(this.ngUnsubscribe)
        .subscribe(
          application => {
            // TODO: update URL with new app id // or navigate to 'new' edit page?
            // reload cached app and local copy
            this.reloadData(application._id);
            this.snackBarRef = this.snackBar.open('Application created...', null, { duration: 3000 });
          },
          error => {
            console.log('error =', error);
            this.snackBarRef = this.snackBar.open('Error creating application...', null, { duration: 3000 });
          }
        );
    }
  }

  public addDecision() {
    this.application.decision = new Decision({ _application: this.application._id });

    //   this.decisionService.add(decision)
    //     .takeUntil(this.ngUnsubscribe)
    //     .subscribe(
    //       decsn => {
    //         // add succeeded
    //         // reload cached app and update local data separately so we don't lose other local data
    //         this.applicationService.getById(this.application._id, true).takeUntil(this.ngUnsubscribe).subscribe();
    //         this.application.decision = decsn;
    //         this.snackBarRef = this.snackBar.open('Decision added...', null, { duration: 3000 });
    //       },
    //       error => {
    //         console.log('error =', error);
    //         this.snackBarRef = this.snackBar.open('Error adding decision...', null, { duration: 3000 });
    //       }
    //     );
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
      // adjust for current tz
      this.application.publishDate = moment(this.application.publishDate).format();

      let observables = Observable.of(null);

      // first add/save commentperiod (if any)
      if (this.application.currentPeriod) {
        if (!this.application.currentPeriod._id) {
          observables = observables.concat(this.commentPeriodService.add(this.application.currentPeriod));
        } else {
          observables = observables.concat(this.commentPeriodService.save(this.application.currentPeriod));
        }
      }

      // then add/save decision (if any)
      if (this.application.decision) {
        if (!this.application.decision._id) {
          observables = observables.concat(this.decisionService.add(this.application.decision));
        } else {
          observables = observables.concat(this.decisionService.save(this.application.decision));
        }
      }

      // finally save application
      observables = observables.concat(this.applicationService.save(this.application));

      observables.takeUntil(this.ngUnsubscribe)
        .subscribe(
          () => {
            // reload cached app only so we don't lose other local data
            // TODO: verify that this reloads new comment period and new decision -- IT DOESN'T // TO FIX
            // TODO: redirect to reload this page?
            // this.applicationService.getById(this.application._id, true).takeUntil(this.ngUnsubscribe).subscribe();
            // this.applicationForm.form.markAsPristine();
            // this.decisionForm.form.markAsPristine();
            this.snackBarRef = this.snackBar.open('Application saved...', null, { duration: 3000 });
            this.router.navigate(['/a', this.application._id, 'edit']);
          },
          error => {
            console.log('error =', error);
            this.snackBarRef = this.snackBar.open('Error saving application...', null, { duration: 3000 });
          }
        );
    }
  }

  // upload application or decision documents
  public uploadFiles(fileList: FileList, documents: Document[]) {
    for (let i = 0; i < fileList.length; i++) {
      if (fileList[i]) {
        const formData = new FormData();
        if (documents === this.application.documents) {
          formData.append('_application', this.application._id);
        } else if (documents === this.application.decision.documents) {
          formData.append('_decision', this.application.decision._id);
        } else {
          break; // error
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
          _.remove(documents, item => (item._id === doc._id));
          this.snackBarRef = this.snackBar.open('Document deleted...', null, { duration: 3000 });
        },
        error => {
          console.log('error =', error);
          this.snackBarRef = this.snackBar.open('Error deleting document...', null, { duration: 3000 });
        }
      );
  }

  public publishDocument(document: Document) {
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

  public unPublishDocument(document: Document) {
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

}
