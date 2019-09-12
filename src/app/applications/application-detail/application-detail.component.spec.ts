import { async, ComponentFixture, TestBed } from '@angular/core/testing';

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
import { ActivatedRoute, Router } from '@angular/router';
import { ActivatedRouteStub } from 'app/spec/helpers';
import { InlineSVGModule } from 'ng-inline-svg';
import { LinkifyPipe } from 'app/pipes/linkify.pipe';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ApplicationDetailComponent', () => {
  let component: ApplicationDetailComponent;
  let fixture: ComponentFixture<ApplicationDetailComponent>;
  const existingApplication = new Application();
  const validRouteData = { application: existingApplication };

  const apiServiceSpy = jasmine.createSpyObj('ApiService', ['refreshApplication']);
  const matSnackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
  const activatedRouteStub = new ActivatedRouteStub(validRouteData);
  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
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
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('when the application is retrievable from the route', () => {
    beforeEach(() => {
      activatedRouteStub.setData(validRouteData);
    });

    it('sets the component application to the one from the route', async(() => {
      expect(component.application).toEqual(existingApplication);
    }));
  });

  describe('when the application is not available from the route', () => {
    beforeEach(() => {
      activatedRouteStub.setData({ something: 'went wrong' });
    });

    it('redirects to /search', async(() => {
      component.ngOnInit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/search']);
    }));
  });
});
