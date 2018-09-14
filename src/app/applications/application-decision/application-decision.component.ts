import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from 'ng2-bootstrap-modal';
import { Location } from '@angular/common';
import { MatSnackBarRef, SimpleSnackBar, MatSnackBar } from '@angular/material';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import * as moment from 'moment-timezone';
import * as _ from 'lodash';

import { ApiService } from 'app/services/api';
import { Application } from 'app/models/application';
import { ApplicationService } from 'app/services/application.service';
import { ConfirmComponent } from 'app/confirm/confirm.component';
import { Decision } from 'app/models/decision';
import { DecisionService } from 'app/services/decision.service';
import { Document } from 'app/models/document';
import { DocumentService } from 'app/services/document.service';

@Component({
  selector: 'app-application-decision',
  templateUrl: './application-decision.component.html',
  styleUrls: ['./application-decision.component.scss']
})

export class ApplicationDecisionComponent implements OnInit, OnDestroy {
  @ViewChild('decisionForm') decisionForm: NgForm;

  public application: Application = null;
  public clFile: number = null;
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
    private decisionService: DecisionService,
    private dialogService: DialogService,
    private documentService: DocumentService
  ) { }

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

            if (!this.application.publishDate) {
              this.application.publishDate = new Date();
            }
            this.application.publishDate = moment(this.application.publishDate).format();
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

  // check for unsaved changes before closing (or reloading) current tab/window
  @HostListener('window:beforeunload', ['$event'])

  handleBeforeUnload(event) {
    // display browser alert if needed
    if (!this.allowDeactivate && (this.decisionForm.dirty)) {
      event.returnValue = true;
    }
  }

  // Check for unsaved changes before navigating away from current route (ie, this page)
  canDeactivate(): Observable<boolean> | boolean {
    // allow synchronous navigation if everything is OK
    if (this.allowDeactivate || (this.decisionForm.pristine)) {
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

  // Cancel Changes
  // See 'canDeactivate' for the UI notification / form reset functionality
  public cancelChanges() {
    this._location.back();
  }

  // Upload Decision Documents
  uploadFiles(fileList: FileList, documents: Document[]) {
    for (let i = 0; i < fileList.length; i++) {
      if (fileList[i]) {
        const formData = new FormData();
        formData.append('_decision', this.application.decision._id);
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

  // Delete Documents
  deleteDocument(document: Document, documents: Document[]) {
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

  // Publish Documents
  publishDocument(document: Document, documents: Document[]) {
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

  // Unpublish Documents
  unPublishDocument(document: Document, documents: Document[]) {
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

  // Save Decision
  saveDecision() {
    this.decisionService.save(this.application.decision)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        () => {
          // save succeeded
          // reload cached app only so we don't lose other local data
          this.applicationService.getById(this.application._id, true).takeUntil(this.ngUnsubscribe).subscribe();
          this.decisionForm.form.markAsPristine();

          // Redirect
          this._location.back();
        },
        error => {
          console.log('error =', error);
          this.snackBarRef = this.snackBar.open('Error saving decision...', null, { duration: 3000 });
        }
      );
  }

}
