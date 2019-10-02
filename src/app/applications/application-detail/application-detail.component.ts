import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBarRef, SimpleSnackBar, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from 'ng2-bootstrap-modal';
import { Subject, of, throwError } from 'rxjs';
import { takeUntil, concat, mergeMap } from 'rxjs/operators';

import { ConfirmComponent } from 'app/confirm/confirm.component';
import { Application } from 'app/models/application';
import { ApiService } from 'app/services/api';
import { ApplicationService } from 'app/services/application.service';
import { CommentPeriodService } from 'app/services/commentperiod.service';
import { DecisionService } from 'app/services/decision.service';
import { DocumentService } from 'app/services/document.service';
import { FeatureService } from 'app/services/feature.service';

@Component({
  selector: 'app-application-detail',
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.scss']
})
export class ApplicationDetailComponent implements OnInit, OnDestroy {
  public isPublishing = false;
  public isUnpublishing = false;
  public isDeleting = false;
  public isRefreshing = false;
  public application: Application = null;
  private snackBarRef: MatSnackBarRef<SimpleSnackBar> = null;
  private ngUnsubscribe: Subject<boolean> = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public snackBar: MatSnackBar,
    public api: ApiService, // also used in template
    private dialogService: DialogService,
    public applicationService: ApplicationService, // also used in template
    public commentPeriodService: CommentPeriodService,
    public decisionService: DecisionService,
    public documentService: DocumentService,
    public featureService: FeatureService
  ) {}

  ngOnInit() {
    // get data from route resolver
    this.route.data.pipe(takeUntil(this.ngUnsubscribe)).subscribe((data: { application: Application }) => {
      if (data.application) {
        this.application = data.application;
      } else {
        alert("Uh-oh, couldn't load application");
        // application not found --> navigate back to search
        this.router.navigate(['/search']);
      }
    });
  }

  ngOnDestroy() {
    // dismiss any open snackbar
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }

    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public deleteApplication() {
    if (this.application.meta.numComments > 0) {
      this.dialogService
        .addDialog(
          ConfirmComponent,
          {
            title: 'Cannot Delete Application',
            message: 'An application with submitted comments cannot be deleted.',
            okOnly: true
          },
          {
            backdropColor: 'rgba(0, 0, 0, 0.5)'
          }
        )
        .pipe(takeUntil(this.ngUnsubscribe));
      return;
    }

    if (this.application.meta.isPublished) {
      this.dialogService
        .addDialog(
          ConfirmComponent,
          {
            title: 'Cannot Delete Application',
            message: 'Please unpublish application first.',
            okOnly: true
          },
          {
            backdropColor: 'rgba(0, 0, 0, 0.5)'
          }
        )
        .pipe(takeUntil(this.ngUnsubscribe));
      return;
    }

    this.dialogService
      .addDialog(
        ConfirmComponent,
        {
          title: 'Confirm Deletion',
          message: 'Do you really want to delete this application?',
          okOnly: false
        },
        {
          backdropColor: 'rgba(0, 0, 0, 0.5)'
        }
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(isConfirmed => {
        if (isConfirmed) {
          this.internalDeleteApplication();
        }
      });
  }

  private internalDeleteApplication() {
    this.isDeleting = true;

    let observables = of(null);

    // delete comment period
    if (this.application.meta.currentPeriod) {
      observables = observables.pipe(concat(this.commentPeriodService.delete(this.application.meta.currentPeriod)));
    }

    // delete decision documents
    if (this.application.meta.decision && this.application.meta.decision.meta.documents) {
      for (const doc of this.application.meta.decision.meta.documents) {
        observables = observables.pipe(concat(this.documentService.delete(doc)));
      }
    }

    // delete decision
    if (this.application.meta.decision) {
      observables = observables.pipe(concat(this.decisionService.delete(this.application.meta.decision)));
    }

    // delete application documents
    if (this.application.meta.documents) {
      for (const doc of this.application.meta.documents) {
        observables = observables.pipe(concat(this.documentService.delete(doc)));
      }
    }

    // delete features
    observables = observables.pipe(concat(this.featureService.deleteByApplicationId(this.application._id)));

    // delete application
    // do this last in case of prior failures
    observables = observables.pipe(concat(this.applicationService.delete(this.application)));

    observables.pipe(takeUntil(this.ngUnsubscribe)).subscribe(
      () => {
        // onNext
        // do nothing here - see onCompleted() function below
      },
      error => {
        this.isDeleting = false;
        console.log('error =', error);
        alert("Uh-oh, couldn't delete application");
        // TODO: should fully reload application here so we have latest non-deleted objects
      },
      () => {
        // onCompleted
        this.isDeleting = false;
        // delete succeeded --> navigate back to search
        this.router.navigate(['/search']);
      }
    );
  }

  /**
   * Refreshes the application meta and features with the latest data from Tantalis.
   *
   * @memberof ApplicationDetailComponent
   */
  public refreshApplication() {
    this.isRefreshing = true;
    this.api
      .refreshApplication(this.application)
      .pipe(
        // Now that the application is refreshed, fetch it with all of its new data and features.
        // Also fetch the documents, comment periods, and decisions so we don't have to manually merge them over from
        // the current this.application.
        mergeMap(updatedApplicationAndFeatures => {
          if (updatedApplicationAndFeatures) {
            return this.applicationService.getById(updatedApplicationAndFeatures.application._id, {
              getFeatures: true,
              getDocuments: true,
              getCurrentPeriod: true,
              getDecision: true
            });
          } else {
            return throwError('Refresh application request returned invalid response.');
          }
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(
        refreshedApplication => {
          if (refreshedApplication) {
            // update the application with the latest data
            this.application = refreshedApplication;
          }
        },
        error => {
          this.isRefreshing = false;
          console.log('error =', error);
          alert("Uh-oh, couldn't update application");
        },
        () => {
          this.isRefreshing = false;
          this.snackBarRef = this.snackBar.open('Application refreshed...', null, { duration: 2000 });
        }
      );
  }

  public publishApplication() {
    if (!this.application.description) {
      this.dialogService
        .addDialog(
          ConfirmComponent,
          {
            title: 'Cannot Publish Application',
            message: 'A description for this application is required to publish.',
            okOnly: true
          },
          {
            backdropColor: 'rgba(0, 0, 0, 0.5)'
          }
        )
        .pipe(takeUntil(this.ngUnsubscribe));
      return;
    }

    this.dialogService
      .addDialog(
        ConfirmComponent,
        {
          title: 'Confirm Publish',
          message: 'Publishing this application will make it visible to the public. Are you sure you want to proceed?',
          okOnly: false
        },
        {
          backdropColor: 'rgba(0, 0, 0, 0.5)'
        }
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(isConfirmed => {
        if (isConfirmed) {
          this.internalPublishApplication();
        }
      });
  }

  private internalPublishApplication() {
    this.isPublishing = true;

    let observables = of(null);

    // publish comment period
    if (this.application.meta.currentPeriod && !this.application.meta.currentPeriod.meta.isPublished) {
      observables = observables.pipe(concat(this.commentPeriodService.publish(this.application.meta.currentPeriod)));
    }

    // publish decision documents
    if (this.application.meta.decision && this.application.meta.decision.meta.documents) {
      for (const doc of this.application.meta.decision.meta.documents) {
        if (!doc.meta.isPublished) {
          observables = observables.pipe(concat(this.documentService.publish(doc)));
        }
      }
    }

    // publish decision
    if (this.application.meta.decision && !this.application.meta.decision.meta.isPublished) {
      observables = observables.pipe(concat(this.decisionService.publish(this.application.meta.decision)));
    }

    // publish application documents
    if (this.application.meta.documents) {
      for (const doc of this.application.meta.documents) {
        if (!doc.meta.isPublished) {
          observables = observables.pipe(concat(this.documentService.publish(doc)));
        }
      }
    }

    // publish application
    // do this last in case of prior failures
    if (!this.application.meta.isPublished) {
      observables = observables.pipe(concat(this.applicationService.publish(this.application)));
    }

    // finally, save publish date (first time only)
    if (!this.application.publishDate) {
      this.application.publishDate = new Date(); // now
      observables = observables.pipe(concat(this.applicationService.save(this.application)));
    }

    observables.pipe(takeUntil(this.ngUnsubscribe)).subscribe(
      () => {
        // onNext
        // do nothing here - see onCompleted() function below
      },
      error => {
        this.isPublishing = false;
        console.log('error =', error);
        alert("Uh-oh, couldn't publish application");
        // TODO: should fully reload application here so we have latest isPublished flags for objects
      },
      () => {
        // onCompleted
        this.snackBarRef = this.snackBar.open('Application published...', null, { duration: 2000 });
        // reload all data
        this.applicationService
          .getById(this.application._id, {
            getFeatures: true,
            getDocuments: true,
            getCurrentPeriod: true,
            getDecision: true
          })
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe(
            (application: Application) => {
              this.isPublishing = false;
              this.application = application;
            },
            error => {
              this.isPublishing = false;
              console.log('error =', error);
              alert("Uh-oh, couldn't reload application");
            }
          );
      }
    );
  }

  public unPublishApplication() {
    this.isUnpublishing = true;

    let observables = of(null);

    // unpublish comment period
    if (this.application.meta.currentPeriod && this.application.meta.currentPeriod.meta.isPublished) {
      observables = observables.pipe(concat(this.commentPeriodService.unPublish(this.application.meta.currentPeriod)));
    }

    // unpublish decision documents
    if (this.application.meta.decision && this.application.meta.decision.meta.documents) {
      for (const doc of this.application.meta.decision.meta.documents) {
        if (doc.meta.isPublished) {
          observables = observables.pipe(concat(this.documentService.unPublish(doc)));
        }
      }
    }

    // unpublish decision
    if (this.application.meta.decision && this.application.meta.decision.meta.isPublished) {
      observables = observables.pipe(concat(this.decisionService.unPublish(this.application.meta.decision)));
    }

    // unpublish application documents
    if (this.application.meta.documents) {
      for (const doc of this.application.meta.documents) {
        if (doc.meta.isPublished) {
          observables = observables.pipe(concat(this.documentService.unPublish(doc)));
        }
      }
    }

    // unpublish application
    // do this last in case of prior failures
    if (this.application.meta.isPublished) {
      observables = observables.pipe(concat(this.applicationService.unPublish(this.application)));
    }

    observables.pipe(takeUntil(this.ngUnsubscribe)).subscribe(
      () => {
        // onNext
        // do nothing here - see onCompleted() function below
      },
      error => {
        this.isUnpublishing = false;
        console.log('error =', error);
        alert("Uh-oh, couldn't unpublish application");
        // TODO: should fully reload application here so we have latest isPublished flags for objects
      },
      () => {
        // onCompleted
        this.snackBarRef = this.snackBar.open('Application unpublished...', null, { duration: 2000 });
        // reload all data
        this.applicationService
          .getById(this.application._id, {
            getFeatures: true,
            getDocuments: true,
            getCurrentPeriod: true,
            getDecision: true
          })
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe(
            (application: Application) => {
              this.isUnpublishing = false;
              this.application = application;
            },
            error => {
              this.isUnpublishing = false;
              console.log('error =', error);
              alert("Uh-oh, couldn't reload application");
            }
          );
      }
    );
  }
}
