import { TestBed } from '@angular/core/testing';

import { CommentService } from './comment.service';
import { ApiService } from 'app/services/api';
import { DocumentService } from 'app/services/document.service';
import { CommentPeriodService } from 'app/services/commentperiod.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CommentService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CommentService, ApiService, DocumentService, CommentPeriodService]
    });
  });

  it('should be created', () => {
    const service = TestBed.get(CommentService);

    expect(service).toBeTruthy();
  });
});
