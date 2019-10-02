import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { DialogService } from 'ng2-bootstrap-modal';

import { ApplicationAddEditComponent } from './application-add-edit.component';
import { FileUploadComponent } from 'app/file-upload/file-upload.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBar } from '@angular/material';
import { ApiService } from 'app/services/api';
import { ApplicationService } from 'app/services/application.service';
import { CommentPeriodService } from 'app/services/commentperiod.service';
import { DecisionService } from 'app/services/decision.service';
import { DocumentService } from 'app/services/document.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ApplicationAddEditComponent', () => {
  let component: ApplicationAddEditComponent;
  let fixture: ComponentFixture<ApplicationAddEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, NgbModule, HttpClientTestingModule, RouterTestingModule],
      declarations: [ApplicationAddEditComponent, FileUploadComponent],
      providers: [
        DialogService,
        MatSnackBar,
        ApiService,
        ApplicationService,
        CommentPeriodService,
        DecisionService,
        DocumentService
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
