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
import { Document } from 'app/models/document';
import { Decision } from 'app/models/decision';
import { ApiService } from 'app/services/api';
import { ApplicationService } from 'app/services/application.service';
import { SearchService } from 'app/services/search.service';
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
    private dialogService: DialogService,
    private searchService: SearchService,
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

  public launchMap() {
    // pass along the id of the current application if available
    // so that the map component can show the popup for it.
    const appId = this.application ? this.application._id : null;
    this.router.navigate(['/map', { application: appId }]);
  }

  // TODO: soon to be obsolete
  applyDisposition() {
    // first check if the disp is already used by another application
    this.applicationService.getByTantalisID(this.application.tantalisID, true)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        application => {
          if (application && application._id !== this.application._id) {
            // found it
            this.dialogService.addDialog(ConfirmComponent,
              {
                title: 'Disposition Already Exists',
                message: 'This Disposition already exists in a Public Review &amp; Comment application.'
                  + ' Click OK to go to the existing application, or Cancel to return to the current application.'
              }, {
                backdropColor: 'rgba(0, 0, 0, 0.5)'
              })
              .takeUntil(this.ngUnsubscribe)
              .subscribe(
                isConfirmed => {
                  if (isConfirmed) {
                    // go to the other application
                    this.allowDeactivate = true;
                    this.router.navigate(['/a', application._id]);
                  }
                  // otherwise return to current application
                }
              );
          } else {
            // (re)load features/shapes
            this.searchService.getByDTID(this.application.tantalisID)
              .takeUntil(this.ngUnsubscribe)
              .subscribe(
                search => {
                  this.application.features = search && search.features;

                  // calculate Total Area (hectares)
                  let areaHectares = 0;
                  _.each(this.application.features, function (f) {
                    if (f['properties']) {
                      areaHectares += f['properties'].TENURE_AREA_IN_HECTARES;
                    }
                  });
                  this.application.areaHectares = areaHectares;

                  // save application properties from first feature
                  if (this.application.features && this.application.features.length > 0) {
                    // cached data
                    this.application.purpose = this.application.features[0].properties.TENURE_PURPOSE;
                    this.application.subpurpose = this.application.features[0].properties.TENURE_SUBPURPOSE;
                    this.application.type = this.application.features[0].properties.TENURE_TYPE;
                    this.application.subtype = this.application.features[0].properties.TENURE_SUBTYPE;
                    this.application.status = this.application.features[0].properties.TENURE_STATUS;
                    this.application.tenureStage = this.application.features[0].properties.TENURE_STAGE;
                    this.application.location = this.application.features[0].properties.TENURE_LOCATION;
                    this.application.businessUnit = this.application.features[0].properties.RESPONSIBLE_BUSINESS_UNIT;
                    // this is special
                    // we will persist it to db as a search key
                    this.application.cl_file = +this.application.features[0].properties.CROWN_LANDS_FILE; // NOTE: unary operator
                  }

                  this.application.agency = 'Crown Land Allocation';
                  this.application.name = this.application.cl_file && this.application.cl_file.toString();

                  // unset old client
                  this.application.client = null;

                  this.applicationAside.drawMap(this.application);
                },
                error => {
                  console.log('error =', error);
                  this.snackBarRef = this.snackBar.open('Error loading shapes...', null, { duration: 3000 });
                }
              );
          }
        },
        error => {
          console.log('Error retrieving application.');
        }
      );
  }

  selectClient() {
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
          },
          error => {
            console.log('error =', error);
            this.snackBarRef = this.snackBar.open('Error creating application...', null, { duration: 3000 });
          }
        );
    }
  }

  // Cancel
  // See 'canDeactivate' for the UI notification / form reset functionality
  public cancelChanges() {
    this._location.back();
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
          },
          error => {
            console.log('error =', error);
            this.snackBarRef = this.snackBar.open('Error saving application...', null, { duration: 3000 });
          }
        );
    }
  }

  // Upload Application Documents
  uploadFiles(fileList: FileList, documents: Document[]) {
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
