import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBarRef, SimpleSnackBar, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from 'ng2-bootstrap-modal';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';

import { ConfirmComponent } from 'app/confirm/confirm.component';
import { Application } from 'app/models/application';
import { ApiService } from 'app/services/api';
import { ApplicationService } from 'app/services/application.service';

@Component({
  selector: 'app-application-detail',
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.scss'],
})

export class ApplicationDetailComponent implements OnInit, OnDestroy {
  public application: Application = null;
  private snackBarRef: MatSnackBarRef<SimpleSnackBar> = null;
  private ngUnsubscribe: Subject<boolean> = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public snackBar: MatSnackBar,
    public api: ApiService, // also used in template
    private dialogService: DialogService,
    public applicationService: ApplicationService // used in template
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
            this.application = data.application;
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

  deleteApplication() {
    if (this.application.isPublished) {
      this.dialogService.addDialog(ConfirmComponent,
        {
          title: 'Cannot Delete Application',
          message: 'Please unpublish application first.',
          okOnly: true
        }, {
          backdropColor: 'rgba(0, 0, 0, 0.5)'
        })
        .takeUntil(this.ngUnsubscribe);
    } else if (this.application.documents && this.application.documents.length > 0) {
      this.dialogService.addDialog(ConfirmComponent,
        {
          title: 'Cannot Delete Application',
          message: 'Please delete all documents first.',
          okOnly: true
        }, {
          backdropColor: 'rgba(0, 0, 0, 0.5)'
        })
        .takeUntil(this.ngUnsubscribe);
    } else {
      this.dialogService.addDialog(ConfirmComponent,
        {
          title: 'Confirm Deletion',
          message: 'Do you really want to delete this application?'
        }, {
          backdropColor: 'rgba(0, 0, 0, 0.5)'
        })
        .takeUntil(this.ngUnsubscribe)
        .subscribe(
          isConfirmed => {
            if (isConfirmed) {
              this.applicationService.delete(this.application)
                .takeUntil(this.ngUnsubscribe)
                .subscribe(
                  application => {
                    // delete succeeded --> navigate back to search
                    this.application = null;
                    this.router.navigate(['/search']);
                  },
                  error => {
                    console.log('error =', error);
                    this.snackBarRef = this.snackBar.open('Error deleting application...', null, { duration: 3000 });
                  }
                );
            }
          }
        );
    }
  }

  publishApplication() {
    this.applicationService.publish(this.application)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        application => {
          // publish succeeded
          // reload cached app and update local data separately so we don't lose other local data
          this.applicationService.getById(this.application._id, true).takeUntil(this.ngUnsubscribe).subscribe();
          this.application.isPublished = true;
          this.snackBarRef = this.snackBar.open('Application published...', null, { duration: 3000 });
        },
        error => {
          console.log('error =', error);
          this.snackBarRef = this.snackBar.open('Error publishing application...', null, { duration: 3000 });
        }
      );
  }

  unPublishApplication() {
    this.applicationService.unPublish(this.application)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        application => {
          // unpublish succeeded
          // reload cached app and update local data separately so we don't lose other local data
          this.applicationService.getById(this.application._id, true).takeUntil(this.ngUnsubscribe).subscribe();
          this.application.isPublished = false;
          this.snackBarRef = this.snackBar.open('Application unpublished...', null, { duration: 3000 });
        },
        error => {
          console.log('error =', error);
          this.snackBarRef = this.snackBar.open('Error unpublishing application...', null, { duration: 3000 });
        }
      );
  }

}
