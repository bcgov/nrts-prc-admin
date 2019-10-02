import { async, TestBed } from '@angular/core/testing';

import { ApplicationDetailComponent } from './application-detail.component';
import { RouterTestingModule } from '@angular/router/testing';
import { NewlinesPipe } from 'app/pipes/newlines.pipe';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ApplicationAsideComponent } from 'app/applications/application-aside/application-aside.component';
import { MatSnackBar } from '@angular/material';
import { DialogService } from 'ng2-bootstrap-modal';
import { ApiService } from 'app/services/api';
import { ApplicationService } from 'app/services/application.service';
import { CommentPeriodService } from 'app/services/commentperiod.service';
import { DecisionService } from 'app/services/decision.service';
import { DocumentService } from 'app/services/document.service';
import { FeatureService } from 'app/services/feature.service';
import { Application } from 'app/models/application';
import { ActivatedRoute } from '@angular/router';
import { ActivatedRouteStub } from 'app/spec/helpers';
import { InlineSVGModule } from 'ng-inline-svg';
import { LinkifyPipe } from 'app/pipes/linkify.pipe';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ApplicationDetailComponent', () => {
  const existingApplication = new Application();
  const validRouteData = { application: existingApplication };

  const apiServiceSpy = jasmine.createSpyObj('ApiService', ['refreshApplication']);
  const matSnackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
  const activatedRouteStub = new ActivatedRouteStub(validRouteData);
  const applicationServiceSpy = jasmine.createSpyObj('ApplicationService', ['getStatusStringLong']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ApplicationDetailComponent, NewlinesPipe, LinkifyPipe, ApplicationAsideComponent],
      imports: [RouterTestingModule, HttpClientTestingModule, NgbModule, InlineSVGModule],
      providers: [
        { provide: MatSnackBar, useValue: matSnackBarSpy },
        { provide: ApiService, useValue: apiServiceSpy },
        DialogService,
        { provide: ApplicationService, useValue: applicationServiceSpy },
        CommentPeriodService,
        DecisionService,
        DocumentService,
        FeatureService,
        { provide: ActivatedRoute, useValue: activatedRouteStub }
      ]
    }).compileComponents();
  }));

  /**
   * Initializes the component and fixture.
   *
   * - In most cases, this will be called in the beforeEach.
   * - In tests that require custom mock behaviour, set up the mock behaviour before calling this.
   *
   * @param {boolean} [detectChanges=true] set to false if you want to manually call fixture.detectChanges(), etc.
   *   Usually you want to control this when the timing of ngOnInit, and similar auto-exec functions, matters.
   * @returns {{component, fixture}} Object containing the component and test fixture.
   */
  function createComponent(detectChanges: boolean = true) {
    const fixture = TestBed.createComponent(ApplicationDetailComponent);
    const component = fixture.componentInstance;

    if (detectChanges) {
      fixture.detectChanges();
    }

    return { component, fixture };
  }

  it('should be created', () => {
    const { component } = createComponent();

    expect(component).toBeTruthy();
  });

  describe('when the application is retrievable from the route', () => {
    let component;

    beforeEach(() => {
      const activatedRouteMock = TestBed.get(ActivatedRoute);
      activatedRouteMock.setData(validRouteData);

      ({ component } = createComponent());
    });

    it('sets the component application to the one from the route', async(() => {
      expect(component.application).toEqual(existingApplication);
    }));
  });

  describe('when the application is not available from the route', () => {
    let component;
    let fixture;

    beforeEach(() => {
      const activatedRouteMock = TestBed.get(ActivatedRoute);
      activatedRouteMock.setData({ something: 'went wrong' });

      ({ component, fixture } = createComponent(false));
    });

    it('redirects to /search', async(() => {
      const navigateSpy = spyOn((component as any).router, 'navigate').and.stub();

      fixture.detectChanges();

      expect(navigateSpy).toHaveBeenCalledWith(['/search']);
    }));
  });
});
