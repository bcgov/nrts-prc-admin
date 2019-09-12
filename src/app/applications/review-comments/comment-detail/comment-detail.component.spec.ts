import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewlinesPipe } from 'app/pipes/newlines.pipe';
import { ApiService } from 'app/services/api';
import { CommentDetailComponent } from './comment-detail.component';
import { CommentService } from 'app/services/comment.service';
import { DocumentService } from 'app/services/document.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CommentDetailComponent', () => {
  let component: CommentDetailComponent;
  let fixture: ComponentFixture<CommentDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [CommentDetailComponent, NewlinesPipe],
      providers: [ApiService, CommentService, DocumentService]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommentDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
