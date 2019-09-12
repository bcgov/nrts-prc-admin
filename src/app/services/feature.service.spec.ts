import { TestBed, inject } from '@angular/core/testing';

import { FeatureService } from './feature.service';
import { ApiService } from 'app/services/api';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('FeatureService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FeatureService, ApiService]
    });
  });

  it('should be created', inject([FeatureService], (service: FeatureService) => {
    expect(service).toBeTruthy();
  }));
});
