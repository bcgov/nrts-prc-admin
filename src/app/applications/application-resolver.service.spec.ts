import { async, TestBed } from '@angular/core/testing';

import { ApplicationDetailResolver } from './application-resolver.service';
import { ApplicationService } from 'app/services/application.service';

describe('ApplicationDetailResolverService', () => {
  const applicationServiceSpy = jasmine.createSpyObj('ApplicationService', ['getById']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [ApplicationDetailResolver, { provide: ApplicationService, useValue: applicationServiceSpy }]
    });
  }));

  it('should be created', () => {
    const service = TestBed.get(ApplicationDetailResolver);
    expect(service).toBeTruthy();
  });
});
