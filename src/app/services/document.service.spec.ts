import { TestBed, inject } from '@angular/core/testing';

import { DocumentService } from './document.service';
import { ApiService } from 'app/services/api';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('DocumentService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DocumentService, ApiService]
    });
  });

  it('should be created', inject([DocumentService], (service: DocumentService) => {
    expect(service).toBeTruthy();
  }));
});
