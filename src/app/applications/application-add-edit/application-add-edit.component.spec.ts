import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { DialogService } from 'ng2-bootstrap-modal';

import { ApplicationAddEditComponent } from './application-add-edit.component';
import { FileUploadComponent } from 'app/file-upload/file-upload.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBar } from '@angular/material';
import { ApplicationService } from 'app/services/application.service';
import { CommentPeriodService } from 'app/services/commentperiod.service';
import { DecisionService } from 'app/services/decision.service';
import { DocumentService } from 'app/services/document.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SearchComponent } from 'app/search/search.component';

describe('ApplicationAddEditComponent', () => {
  let component: ApplicationAddEditComponent;
  let fixture: ComponentFixture<ApplicationAddEditComponent>;

  const matSnackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open', 'dismiss']);
  const applicationServiceSpy = jasmine.createSpyObj('ApplicationService', ['save']);
  const commentPeriodServiceSpy = jasmine.createSpyObj('CommentPeriodService', ['add', 'save', 'publish']);
  const decisionServiceSpy = jasmine.createSpyObj('DecisionService', ['add', 'save', 'publish', 'delete']);
  const documentServiceSpy = jasmine.createSpyObj('DocumentService', ['add', 'save', 'publish']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        NgbModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([{ path: 'search', component: SearchComponent }])
      ],
      declarations: [ApplicationAddEditComponent, FileUploadComponent, SearchComponent],
      providers: [
        DialogService,
        { provide: MatSnackBar, useValue: matSnackBarSpy },
        { provide: ApplicationService, useValue: applicationServiceSpy },
        { provide: CommentPeriodService, useValue: commentPeriodServiceSpy },
        { provide: DecisionService, useValue: decisionServiceSpy },
        { provide: DocumentService, useValue: documentServiceSpy }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationAddEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
