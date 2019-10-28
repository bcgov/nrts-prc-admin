import { TestBed, inject } from '@angular/core/testing';

import { DecisionService } from './decision.service';
import { ApiService } from 'app/services/api';
import { DocumentService } from 'app/services/document.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('DecisionService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DecisionService, ApiService, DocumentService]
    });
  });

  it('should be created', inject([DecisionService], (service: DecisionService) => {
    expect(service).toBeTruthy();
  }));
});
