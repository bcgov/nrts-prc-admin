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

  public application: Application = null;
  public startDate: string = null;
  public endDate: string = null;
  public delta = 30; // default # days (including today)
  private snackBarRef: MatSnackBarRef<SimpleSnackBar> = null;
  private ngUnsubscribe: Subject<boolean> = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private _location: Location,
    public snackBar: MatSnackBar,
    public api: ApiService, // also also used in template
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
    if (this.applicationForm.dirty) {
      event.returnValue = true;
    }
  }

  // check for unsaved changes before navigating away from current route (ie, this page)
  canDeactivate(): Observable<boolean> | boolean {
    // allow synchronous navigation if everything is OK
    if (this.applicationForm.pristine) {
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
            this.application = data.application;

            // add comment period if there isn't one already (not just on create but also on edit --
            // this will fix the situation where existing applications don't have a comment period)
            if (!this.application.currentPeriod) {
              this.application.currentPeriod = new CommentPeriod();
            } else {
              // set date inputs
              this.startDate = this.formatDate(new Date(this.application.currentPeriod.startDate));
              this.endDate = this.formatDate(new Date(this.application.currentPeriod.endDate));
              this.delta = moment(this.application.currentPeriod.endDate).diff(moment(this.application.currentPeriod.startDate), 'days') + 1;
            }
          } else {
            alert('Uh-oh, couldn\'t load application');
            // application not found --> navigate back to search
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

  // see 'canDeactivate' for the UI notification / form reset functionality
  public cancelChanges() {
    this._location.back();
  }

  // returns yyyy-mm-dd for use by date input
  private formatDate(date: Date): string {
    return date ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : null;
  }

  public onStartDateChg(startDate: string) {
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

  public onEndDateChg(endDate: string) {
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

      // add application
      this.applicationService.add(this.application)
        .takeUntil(this.ngUnsubscribe)
        .subscribe(
          application => { // onNext
            this.snackBarRef = this.snackBar.open('Application created...', null, { duration: 2000 }); // not displayed due to navigate below
            this.application._id = application._id; // save new id - must be done before adding documents

            // add all application documents
            if (this.application.documents) {
              for (const doc of this.application.documents) {
                doc['formData'].append('_application', application._id); // set back-reference
                this.internalAddDocument(doc);
              }
            }

            // add commentperiod
            this.application.currentPeriod._application = application._id; // set back-reference
            this.commentPeriodService.add(this.application.currentPeriod)
              .takeUntil(this.ngUnsubscribe)
              .subscribe(
                commentPeriod => {
                  this.snackBarRef = this.snackBar.open('Comment period created...', null, { duration: 2000 }); // not displayed due to navigate below
                  this.application.currentPeriod = commentPeriod; // save updated comment period

                  // add decision (if any)
                  if (this.application.decision) {
                    this.application.decision._application = application._id; // set back-reference
                    this.decisionService.add(this.application.decision)
                      .takeUntil(this.ngUnsubscribe)
                      .subscribe(
                        decision => {
                          this.snackBarRef = this.snackBar.open('Decision created...', null, { duration: 2000 }); // not displayed due to navigate below

                          // add all decision documents
                          if (this.application.decision.documents) {
                            for (const doc of this.application.decision.documents) {
                              doc['formData'].append('_decision', decision._id); // set back-reference
                              this.internalAddDocument(doc);
                            }
                          }

                          this.application.decision = decision; // save updated decision - must be done after adding decision documents
                        },
                        error => {
                          console.log('error =', error);
                          alert('Uh-oh, couldn\'t create decision');
                        }
                      );
                  }
                },
                error => {
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
            // add succeeded --> navigate to details page
            // TODO: must not navigate before document are added !!!
            this.router.navigate(['/a', this.application._id]);
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

      // TODO: delete staged application documents

      // add/save commentperiod (if any)
      if (this.application.currentPeriod) {
        if (!this.application.currentPeriod._id) {
          this.application.currentPeriod._application = this.application._id; // set back-reference
          observables = observables.concat(this.commentPeriodService.add(this.application.currentPeriod));
          // auto-publish new comment period
          // TODO: this doesn't work because we haven't set the comment period ID
          // if (this.application.isPublished) {
          //   observables = observables.concat(this.commentPeriodService.publish(this.application.currentPeriod));
          // }
        } else {
          observables = observables.concat(this.commentPeriodService.save(this.application.currentPeriod));
        }
      }

      // add/save decision (if any)
      if (this.application.decision) {
        if (!this.application.decision._id) {
          this.application.decision._application = this.application._id; // set back-reference
          observables = observables.concat(this.decisionService.add(this.application.decision));
          // auto-publish new decision
          // TODO: this doesn't work because we haven't set the decision ID
          // if (this.application.isPublished) {
          //   observables = observables.concat(this.decisionService.publish(this.application.decision));
          // }
        } else {
          observables = observables.concat(this.decisionService.save(this.application.decision));
        }
      }

      // TODO: delete staged decision documents

      // save application
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
            // add (and auto-publish) any new application documents
            if (this.application.documents) {
              for (const doc of this.application.documents) {
                if (!doc._id) {
                  doc._application = this.application._id; // set back-reference
                  this.internalAddDocument(doc);
                }
              }
            }

            // add (and auto-publish) any new decision documents
            if (this.application.decision && this.application.decision.documents) {
              for (const doc of this.application.decision.documents) {
                if (!doc._id) {
                  doc._decision = this.application.decision._id; // set back-reference
                  this.internalAddDocument(doc);
                }
              }
            }

            this.snackBarRef = this.snackBar.open('Application saved...', null, { duration: 2000 }); // not displayed due to navigate below
            this.applicationForm.form.markAsPristine();
            // save succeeded --> navigate to details page
            // TODO: must not navigate before document are added !!!
            this.router.navigate(['/a', this.application._id]);
          }
        );
    }
  }

  // add application or decision documents
  // NB: they will be uploaded to db when application is added or saved
  // TODO: ensure pristine/dirty works for documents
  public addDocuments(fileList: FileList, documents: Document[]) {
    for (let i = 0; i < fileList.length; i++) {
      if (fileList[i]) {
        console.log('fileList =', fileList[i]);

        const formData = new FormData();
        formData.append('displayName', fileList[i].name);
        formData.append('upfile', fileList[i]);

        const document = new Document();
        document['formData'] = formData; // temporary (for later use)
        document.documentFileName = fileList[i].name;

        documents.push(document);
      }
    }
  }

  private internalAddDocument(document: Document) {
    this.documentService.add(document['formData'])
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        addedDocument => {
          this.snackBarRef = this.snackBar.open('Document added...', null, { duration: 2000 }); // not displayed due to forthcoming navigate
          document = addedDocument; // save updated document

          // auto-publish
          if (this.application.isPublished) {
            this.documentService.publish(document).
              takeUntil(this.ngUnsubscribe)
              .subscribe(
                publishedDocument => {
                  this.snackBarRef = this.snackBar.open('Document published...', null, { duration: 2000 }); // not displayed due to forthcoming navigate
                  document = publishedDocument; // save updated document
                },
                error => {
                  console.log('error =', error);
                  alert('Uh-oh, couldn\'t publish document');
                }
              );
          }
        },
        error => {
          console.log('error =', error);
          alert('Uh-oh, couldn\'t upload file');
        }
      );
  }

  // delete application or decision documents
  // NB: they will be removed from db when application is saved
  // TODO: ensure pristine/dirty works for documents
  public deleteDocument(document: Document, documents: Document[]) {
    // TODO: if no document id (ie, not yet uploaded to db), just remove doc from list
    if (!document._id) {
      console.log('delete document =', document);

      // remove the first document with the same name (not perfect)
      // TODO: test whether this removes all documents with the same name
      documents = _.remove(documents, item => (item.documentFileName === document.documentFileName));
    } else {
      // TODO: stage it for deletion from db
    }
  }

  private internalDeleteDocument(document: Document) {
    this.documentService.delete(document)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        () => {
          this.snackBarRef = this.snackBar.open('File deleted...', null, { duration: 2000 }); // not displayed due to forthcoming navigate
          document = null;
        },
        error => {
          console.log('error =', error);
          alert('Uh-oh, couldn\'t delete document');
        }
      );
  }

}
