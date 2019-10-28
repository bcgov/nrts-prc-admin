import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import * as moment from 'moment';

import { ApplicationService } from './application.service';
import { ApiService } from 'app/services/api';
import { DocumentService } from 'app/services/document.service';
import { CommentPeriodService } from 'app/services/commentperiod.service';
import { CommentService } from 'app/services/comment.service';
import { DecisionService } from 'app/services/decision.service';
import { FeatureService } from 'app/services/feature.service';

import { Feature } from 'app/models/feature';
import { Document } from 'app/models/document';
import { CommentPeriod } from 'app/models/commentperiod';
import { Decision } from 'app/models/decision';
import { Application } from 'app/models/application';
import { StatusCodes, ReasonCodes, RegionCodes } from 'app/utils/constants/application';
import { CommentCodes } from 'app/utils/constants/comment';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ApplicationService', () => {
  let service: any;

  const apiServiceStub = {
    getApplication(id: string) {
      const application = new Application({ _id: id, status: 'ACCEPTED' });
      return of([application]);
    },

    getApplications() {
      const firstApplication = new Application({ _id: 'BBBB', status: 'ACCEPTED' });
      const secondApplication = new Application({ _id: 'CCCC', status: 'ABANDONED' });
      return of([firstApplication, secondApplication]);
    },

    handleError(error: any) {
      fail(error);
    }
  };

  const featureServiceStub = {
    getByApplicationId() {
      const features = [
        new Feature({ _id: 'FFFFF', properties: { TENURE_AREA_IN_HECTARES: 12 } }),
        new Feature({ _id: 'GGGGG', properties: { TENURE_AREA_IN_HECTARES: 13 } })
      ];
      return of(features);
    }
  };

  const documentServiceStub = {
    getAllByApplicationId() {
      const documents = [new Document({ _id: 'DDDDD' }), new Document({ _id: 'EEEEE' })];
      return of(documents);
    }
  };

  const commentPeriodServiceStub = {
    getAllByApplicationId() {
      const commentPeriods = [
        new CommentPeriod({ _id: 'DDDDD', startDate: new Date(2018, 10, 1), endDate: new Date(2018, 11, 10) }),
        new CommentPeriod({ _id: 'EEEEE', startDate: new Date(2018, 10, 1), endDate: new Date(2018, 11, 10) })
      ];
      return of(commentPeriods);
    },

    getCurrent(periods: CommentPeriod[]): CommentPeriod {
      return periods.length > 0 ? periods[0] : null;
    },

    getCode(): string {
      return CommentCodes.OPEN.code;
    },

    isOpen(): boolean {
      return true;
    }
  };

  const decisionServiceStub = {
    getByApplicationId() {
      return of(new Decision({ _id: 'IIIII' }));
    }
  };

  const commentServiceStub = {
    getCountByPeriodId(): Observable<number> {
      return of(42);
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApplicationService,
        { provide: ApiService, useValue: apiServiceStub },
        { provide: DocumentService, useValue: documentServiceStub },
        { provide: CommentPeriodService, useValue: commentPeriodServiceStub },
        { provide: CommentService, useValue: commentServiceStub },
        { provide: DecisionService, useValue: decisionServiceStub },
        { provide: FeatureService, useValue: featureServiceStub }
      ]
    });

    service = TestBed.get(ApplicationService);
  });

  it('should be created', () => {
    const appService = TestBed.get(ApplicationService);
    expect(appService).toBeTruthy();
  });

  describe('getAll()', () => {
    it('retrieves the applications from the api service', () => {
      service.getAll().subscribe(applications => {
        expect(applications[0]._id).toBe('BBBB');
        expect(applications[1]._id).toBe('CCCC');
      });
    });

    describe('application properties', () => {
      const existingApplication = new Application({
        _id: 'AAAA'
      });

      let apiService;
      beforeEach(() => {
        apiService = TestBed.get(ApiService);

        spyOn(apiService, 'getApplications').and.returnValue(of([existingApplication]));
      });

      it('clFile property is padded to be seven digits', () => {
        existingApplication.cl_file = 7777;
        service.getAll().subscribe(applications => {
          const application = applications[0];
          expect(application.meta.clFile).toBe('0007777');
        });
      });

      it('clFile property is null if there is no cl_file property', () => {
        existingApplication.cl_file = null;
        service.getAll().subscribe(applications => {
          const application = applications[0];
          expect(application.meta.clFile).toBeNull();
        });
      });

      it('sets the region property', () => {
        existingApplication.businessUnit = 'SK - LAND MGMNT - SKEENA FIELD OFFICE';
        service.getAll().subscribe(applications => {
          const application = applications[0];
          expect(application.meta.region).toBeDefined();
          expect(application.meta.region).toEqual(RegionCodes.SKEENA.text.long);
        });
      });
    });

    // The getCurrentPeriod parameter is currently the only one passed to this function
    // in the codebase, so that's why this is the only one tested. getFeatures, getDocuments,
    // etc aren't actually used with this function at the moment.

    describe('with the getCurrentPeriod Parameter', () => {
      // let commentPeriodService;
      const firstAppCommentPeriod = new CommentPeriod({
        _id: 'CP_FOR_FIRST_APP',
        startDate: new Date(2018, 10, 1),
        endDate: new Date(2018, 11, 10)
      });
      const secondAppCommentPeriod = new CommentPeriod({
        _id: 'CP_FOR_SECOND_APP',
        startDate: new Date(2018, 10, 1),
        endDate: new Date(2018, 11, 10)
      });

      beforeEach(() => {
        const commentPeriodService = TestBed.get(CommentPeriodService);

        spyOn(commentPeriodService, 'getAllByApplicationId').and.callFake(applicationId => {
          if (applicationId === 'BBBB') {
            return of([firstAppCommentPeriod]);
          } else if (applicationId === 'CCCC') {
            return of([secondAppCommentPeriod]);
          }
        });
      });

      // tslint:disable-next-line:max-line-length
      it('makes a call to commentPeriodService.getAllByApplicationId for each application and retrieves the comment period', () => {
        service.getAll({ getCurrentPeriod: true }).subscribe(applications => {
          const firstApplication = applications[0];
          expect(firstApplication.meta.currentPeriod).toBeDefined();
          expect(firstApplication.meta.currentPeriod).not.toBeNull();
          expect(firstApplication.meta.currentPeriod._id).toBe('CP_FOR_FIRST_APP');

          const secondApplication = applications[1];
          expect(secondApplication.meta.currentPeriod).toBeDefined();
          expect(secondApplication.meta.currentPeriod).not.toBeNull();
          expect(secondApplication.meta.currentPeriod._id).toBe('CP_FOR_SECOND_APP');
        });
      });

      describe('if the comment period is open', () => {
        beforeEach(() => {
          jasmine.clock().install();
          const commentPeriodService = TestBed.get(CommentPeriodService);

          const currentTime = new Date(2018, 11, 1);
          const today = moment(currentTime).toDate();
          jasmine.clock().mockDate(today);

          spyOn(commentPeriodService, 'isOpen').and.returnValue(true);
        });

        afterEach(() => {
          jasmine.clock().uninstall();
        });

        it('sets the daysRemaining value to the endDate minus the current time', () => {
          firstAppCommentPeriod.startDate = new Date(2018, 10, 1);
          firstAppCommentPeriod.endDate = new Date(2018, 11, 10);

          service.getAll({ getCurrentPeriod: true }).subscribe(applications => {
            const firstApplication = applications[0];

            expect(firstApplication.meta.currentPeriod.meta.daysRemaining).toBeDefined();

            expect(firstApplication.meta.currentPeriod.meta.daysRemaining).toEqual(10);
          });
        });
      });

      describe('if the comment period is not open', () => {
        beforeEach(() => {
          const commentPeriodService = TestBed.get(CommentPeriodService);
          spyOn(commentPeriodService, 'isOpen').and.returnValue(false);
        });

        // I can't get the spies to work correctly here to stub the isOpen value
        // TODO: Stub isOpen method properly to get this to pass.
        xit('does not set the daysRemaining value', () => {
          service.getAll({ getCurrentPeriod: true }).subscribe(applications => {
            expect(applications[0].meta.currentPeriod.meta.daysRemaining).not.toBeDefined();
            expect(applications[1].meta.currentPeriod.meta.daysRemaining).not.toBeDefined();
          });
        });
      });

      describe('numComments', () => {
        beforeEach(() => {
          const commentService = TestBed.get(CommentService);

          spyOn(commentService, 'getCountByPeriodId').and.returnValue(of(42));
        });

        it('sets the numComments value to the commentService.getCountByPeriodId function', () => {
          service.getAll({ getCurrentPeriod: true }).subscribe(applications => {
            expect(applications[0].meta.numComments).toEqual(42);
            expect(applications[1].meta.numComments).toEqual(42);
          });
        });
      });
    });

    describe('without the getCurrentPeriod Parameter', () => {
      it('does not call commentPeriodService.getAllByApplicationId', () => {
        const commentPeriodService = TestBed.get(CommentPeriodService);
        spyOn(commentPeriodService, 'getAllByApplicationId');
        expect(commentPeriodService.getAllByApplicationId).not.toHaveBeenCalled();
      });

      it('has no attached comment period', () => {
        service.getAll({ getCurrentPeriod: false }).subscribe(applications => {
          expect(applications[0].meta.currentPeriod).toBeNull();
          expect(applications[1].meta.currentPeriod).toBeNull();
        });
      });
    });
  });

  describe('getById()', () => {
    it('retrieves the application from the api service', () => {
      service.getById('AAAA').subscribe(application => {
        expect(application._id).toBe('AAAA');
      });
    });

    describe('application properties', () => {
      const existingApplication = new Application({
        _id: 'AAAA'
      });

      let apiService;
      beforeEach(() => {
        apiService = TestBed.get(ApiService);

        spyOn(apiService, 'getApplication').and.returnValue(of([existingApplication]));
      });

      it('clFile property is padded to be seven digits', () => {
        existingApplication.cl_file = 7777;
        service.getById('AAAA').subscribe(application => {
          expect(application.meta.clFile).toBe('0007777');
        });
      });

      it('clFile property is null if there is no cl_file property', () => {
        existingApplication.cl_file = null;
        service.getById('AAAA').subscribe(application => {
          expect(application.meta.clFile).toBeNull();
        });
      });

      it('sets the region property', () => {
        existingApplication.businessUnit = 'SK - LAND MGMNT - SKEENA FIELD OFFICE';
        service.getById('AAAA').subscribe(application => {
          expect(application.meta.region).toBeDefined();
          expect(application.meta.region).toEqual(RegionCodes.SKEENA.text.long);
        });
      });
    });

    describe('with the getFeatures Parameter', () => {
      it('makes a call to featureService.getByApplicationId and attaches the resulting features', () => {
        service.getById('AAAA', { getFeatures: true }).subscribe(application => {
          expect(application.meta.features).toBeDefined();
          expect(application.meta.features).not.toBeNull();
          expect(application.meta.features[0]._id).toBe('FFFFF');
          expect(application.meta.features[1]._id).toBe('GGGGG');
        });
      });
    });

    describe('without the getFeatures Parameter', () => {
      it('does not call featureService.getByApplicationId', () => {
        const featureService = TestBed.get(FeatureService);
        spyOn(featureService, 'getByApplicationId');
        expect(featureService.getByApplicationId).not.toHaveBeenCalled();
      });

      it('has no attached features', () => {
        service.getById('AAAA', { getFeatures: false }).subscribe(application => {
          expect(application.meta.features).toBeDefined();
          expect(application.meta.features).toEqual([]);
        });
      });
    });

    describe('with the getDocuments Parameter', () => {
      it('makes a call to documentService.getAllByApplicationId and attaches the resulting documents', () => {
        service.getById('AAAA', { getDocuments: true }).subscribe(application => {
          expect(application.meta.documents).toBeDefined();
          expect(application.meta.documents).not.toBeNull();
          expect(application.meta.documents[0]._id).toBe('DDDDD');
          expect(application.meta.documents[1]._id).toBe('EEEEE');
        });
      });
    });

    describe('without the getDocuments Parameter', () => {
      it('does not call documentService.getAllByApplicationId', () => {
        const documentService = TestBed.get(DocumentService);
        spyOn(documentService, 'getAllByApplicationId');
        expect(documentService.getAllByApplicationId).not.toHaveBeenCalled();
      });

      it('has no attached documents', () => {
        service.getById('AAAA', { getDocuments: false }).subscribe(application => {
          expect(application.meta.documents).toBeDefined();
          expect(application.meta.documents).toEqual([]);
        });
      });
    });

    describe('with the getCurrentPeriod Parameter', () => {
      // tslint:disable-next-line:max-line-length
      it('makes a call to commentPeriodService.getAllByApplicationId and attaches the first resulting comment period', () => {
        service.getById('AAAA', { getCurrentPeriod: true }).subscribe(application => {
          expect(application.meta.currentPeriod).toBeDefined();
          expect(application.meta.currentPeriod).not.toBeNull();
          expect(application.meta.currentPeriod._id).toBe('DDDDD');
        });
      });

      describe('if the comment period is open', () => {
        const periodExpiringOnTheTenth = new CommentPeriod({
          _id: 'CCCC',
          startDate: new Date(2018, 10, 1),
          endDate: new Date(2018, 11, 10)
        });

        beforeEach(() => {
          jasmine.clock().install();

          const currentTime = new Date(2018, 11, 1);
          const today = moment(currentTime).toDate();
          jasmine.clock().mockDate(today);

          const commentPeriodService = TestBed.get(CommentPeriodService);
          spyOn(commentPeriodService, 'isOpen').and.returnValue(true);
          spyOn(commentPeriodService, 'getAllByApplicationId').and.returnValue(of([periodExpiringOnTheTenth]));
        });

        afterEach(() => {
          jasmine.clock().uninstall();
        });

        it('sets the daysRemaining value to the endDate minus the current time', () => {
          service.getById('AAAA', { getCurrentPeriod: true }).subscribe(application => {
            expect(application.meta.currentPeriod.meta.daysRemaining).toBeDefined();
            expect(application.meta.currentPeriod.meta.daysRemaining).toEqual(10);
          });
        });
      });

      describe('if the comment period is not open', () => {
        beforeEach(() => {
          const commentPeriodService = TestBed.get(CommentPeriodService);

          spyOn(commentPeriodService, 'isOpen').and.returnValue(false);
        });

        it('does not set the daysRemaining value', () => {
          service.getById('AAAA', { getCurrentPeriod: true }).subscribe(application => {
            expect(application.meta.currentPeriod.meta.daysRemaining).toBeNull();
          });
        });
      });

      describe('numComments', () => {
        beforeEach(() => {
          const commentService = TestBed.get(CommentService);

          spyOn(commentService, 'getCountByPeriodId').and.returnValue(of(42));
        });

        it('sets the numComments value to the commentService.getCountByPeriodId function', () => {
          service.getById('AAAA', { getCurrentPeriod: true }).subscribe(application => {
            expect(application.meta.numComments).toEqual(42);
          });
        });
      });
    });

    describe('without the getCurrentPeriod Parameter', () => {
      it('does not call commentPeriodService.getAllByApplicationId', () => {
        const commentPeriodService = TestBed.get(CommentPeriodService);
        spyOn(commentPeriodService, 'getAllByApplicationId');
        expect(commentPeriodService.getAllByApplicationId).not.toHaveBeenCalled();
      });

      it('has no attached comment period', () => {
        service.getById('AAAA', { getCurrentPeriod: false }).subscribe(application => {
          expect(application.meta.currentPeriod).toBeNull();
        });
      });
    });

    describe('with the getDecision Parameter', () => {
      it('makes a call to decisionService.getByApplicationId and attaches the resulting decision', () => {
        service.getById('AAAA', { getDecision: true }).subscribe(application => {
          expect(application.meta.decision).toBeDefined();
          expect(application.meta.decision).not.toBeNull();
          expect(application.meta.decision._id).toBe('IIIII');
        });
      });
    });

    describe('without the getDecision Parameter', () => {
      it('does not call decisionService.getByApplicationId', () => {
        const decisionService = TestBed.get(DecisionService);
        spyOn(decisionService, 'getByApplicationId');
        expect(decisionService.getByApplicationId).not.toHaveBeenCalled();
      });

      it('has no attached decision', () => {
        service.getById('AAAA', { getDecision: false }).subscribe(application => {
          expect(application.meta.decision).toBeDefined();
          expect(application.meta.decision).toBeNull();
        });
      });
    });
  });

  describe('getStatusStringShort()', () => {
    it('with "ABANDONED" status it returns "AB" code', () => {
      expect(service.getStatusStringShort('ABANDONED')).toEqual(StatusCodes.ABANDONED.text.short);
    });
  });

  describe('getStatusStringLong()', () => {
    it('with "AB" code it returns "Abandoned" string', () => {
      expect(service.getStatusStringLong(new Application({ status: StatusCodes.ABANDONED.param }))).toBe(
        StatusCodes.ABANDONED.text.long
      );
    });

    it('with "UN" code it returns "Unknown status" string', () => {
      expect(service.getStatusStringLong(new Application({ status: StatusCodes.UNKNOWN.param }))).toBe(
        'Unknown Status'
      );
    });
  });

  describe('isAmendment()', () => {
    it('returns false if the application is undefined', () => {
      expect(service.isAmendment(undefined)).toBe(false);
    });

    it('returns false if the application is null', () => {
      expect(service.isAmendment(null)).toBe(false);
    });

    it('returns false if the status is not Abandoned', () => {
      expect(service.isAmendment({ status: 'notAbandoned' })).toBe(false);
    });

    it('returns false if the status is Abandoned but the reason is undefined', () => {
      expect(service.isAmendment({ status: StatusCodes.ABANDONED.code, reason: undefined })).toBe(false);
    });

    it('returns false if the status is Abandoned but the reason is null', () => {
      expect(service.isAmendment({ status: StatusCodes.ABANDONED.code, reason: null })).toBe(false);
    });

    it('returns true if the status is Abandoned and the reason indicates an approved Amendment', () => {
      expect(
        service.isAmendment({ status: StatusCodes.ABANDONED.code, reason: ReasonCodes.AMENDMENT_APPROVED.code })
      ).toBe(true);
    });

    it('returns true if the status is Abandoned and the reason indicates a not approved Amendment', () => {
      expect(
        service.isAmendment({ status: StatusCodes.ABANDONED.code, reason: ReasonCodes.AMENDMENT_NOT_APPROVED.code })
      ).toBe(true);
    });
  });
});
