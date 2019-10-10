import { Location } from '@angular/common';
import { async, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationService } from 'app/services/application.service';
import { ListComponent } from './list.component';
import { of, throwError } from 'rxjs';
import { OrderByPipe } from 'app/pipes/order-by.pipe';
import { RouterTestingModule } from '@angular/router/testing';
import { Application } from 'app/models/application';
// import { CommentCodes } from 'app/utils/constants/comment';
import { ActivatedRouteStub } from 'app/spec/helpers';
import { ExportService } from 'app/services/export.service';
import { QueryParamModifier } from 'app/services/api';

describe('ListComponent', () => {
  // component constructor mocks
  const mockLocation = jasmine.createSpyObj('Location', ['go']);
  const mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'events']);
  const mockActivatedRoute = new ActivatedRouteStub();
  const mockApplicationService = jasmine.createSpyObj('ApplicationService', ['getAll', 'getCount']);
  const mockExportService = jasmine.createSpyObj('ExportService', ['exportAsCSV']);

  /**
   * Initialize the test bed.
   */
  beforeEach(async(() => {
    setDefaultMockBehaviour();

    TestBed.configureTestingModule({
      declarations: [ListComponent, OrderByPipe],
      providers: [
        { provide: Location, useValue: mockLocation },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ApplicationService, useValue: mockApplicationService },
        { provide: ExportService, useValue: mockExportService }
      ],
      imports: [RouterTestingModule]
    }).compileComponents();
  }));

  /**
   * Return the mocks to their default stubbed state after each test so the tests don't interfere with one another.
   */
  afterEach(() => {
    setDefaultMockBehaviour();
  });

  /**
   * Sets the default stubbed behaviour of all mocks used by the component.
   */
  function setDefaultMockBehaviour() {
    mockLocation.go.and.stub();
    mockRouter.createUrlTree.and.returnValue('');
    mockActivatedRoute.clear();
    mockApplicationService.getAll.and.returnValue(of([]));
    mockApplicationService.getCount.and.returnValue(of(0));
    mockExportService.exportAsCSV.and.stub();
  }

  /**
   * Initializes the component and fixture.
   *
   * - In most cases, this will be called in the beforeEach.
   * - In tests that require custom mock behaviour, set up the mock behaviour before calling this.
   *
   * @param {boolean} [detectChanges=true] set to false if you want to manually call fixture.detectChanges(), etc.
   *   Usually you want to control this when the timing of ngOnInit, and similar auto-exec functions, matters.
   * @returns {{component, fixture}} Object containing the component and test fixture.
   */
  function createComponent(detectChanges: boolean = true) {
    const fixture = TestBed.createComponent(ListComponent);
    const component = fixture.componentInstance;

    if (detectChanges) {
      fixture.detectChanges();
    }

    return { component, fixture };
  }

  it('should create', () => {
    const { component } = createComponent();
    expect(component).toBeTruthy();
  });

  describe('getApplicationQueryParamSets', () => {
    let component;
    beforeEach(() => {
      ({ component } = createComponent());
    });

    it('returns application query parameters', () => {
      component.pagination.currentPage = 7;
      component.pagination.itemsPerPage = 17;
      component.purposeCodeFilters = ['AGRICULTURE'];
      component.statusCodeFilters = ['APPLICATION REVIEW COMPLETE'];
      component.regionCodeFilter = 'SK - LAND MGMNT - SKEENA FIELD OFFICE';

      const queryParameters = component.getApplicationQueryParamSets()[0];

      expect(queryParameters.isDeleted).toEqual(false);
      expect(queryParameters.pageNum).toEqual(6);
      expect(queryParameters.pageSize).toEqual(17);
      expect(queryParameters.purpose).toEqual({ value: ['AGRICULTURE'], modifier: QueryParamModifier.Equal });
      expect(queryParameters.status).toEqual({
        value: ['OFFER ACCEPTED', 'OFFERED'],
        modifier: QueryParamModifier.Equal
      });
      expect(queryParameters.businessUnit).toEqual({
        value: 'SK - LAND MGMNT - SKEENA FIELD OFFICE',
        modifier: QueryParamModifier.Equal
      });
    });
  });

  describe('getApplications', () => {
    describe('happy path', () => {
      let component;
      let applicationServiceMock;

      const applications = [new Application({ _id: 1 }), new Application({ _id: 2 })];

      beforeEach(async(() => {
        ({ component } = createComponent());

        component.applications = [];
        component.pagination.totalItems = 0;
        component.searching = true;
        component.loading = true;

        applicationServiceMock = TestBed.get(ApplicationService);
        applicationServiceMock.getAll.calls.reset();
        applicationServiceMock.getAll.and.returnValue(of(applications));
        applicationServiceMock.getCount.calls.reset();
        applicationServiceMock.getCount.and.returnValue(of(2));

        component.getApplications();
      }));

      it('calls ApplicationService.getAll', () => {
        expect(applicationServiceMock.getAll).toHaveBeenCalledWith(
          { getCurrentPeriod: true },
          component.getApplicationQueryParamSets()
        );
      });

      it('calls ApplicationService.getCount', () => {
        expect(applicationServiceMock.getCount).toHaveBeenCalledWith(component.getApplicationQueryParamSets());
      });

      it('updates applications', () => {
        expect(component.applications).toEqual(applications);
      });

      it('updates pagination', () => {
        expect(component.pagination.totalItems).toEqual(2);
      });

      it('updates searching/loading flags', () => {
        expect(component.searching).toEqual(false);
        expect(component.loading).toEqual(false);
      });
    });

    describe('on error', () => {
      let component;
      beforeEach(async(() => {
        ({ component } = createComponent());
      }));

      it('re-navigates to the list page on error', async(() => {
        const applicationServiceMock = TestBed.get(ApplicationService);
        applicationServiceMock.getAll.and.returnValue(throwError('some error'));

        const routerMock = TestBed.get(Router);
        routerMock.navigate.calls.reset();

        component.getApplications();

        expect(routerMock.navigate).toHaveBeenCalledWith(['/list']);
      }));
    });
  });

  describe('export', () => {
    describe('happy path', () => {
      let component;
      let applicationServiceMock;
      let exportServiceMock;

      const applications = [new Application({ _id: 3 })];

      beforeEach(async(() => {
        ({ component } = createComponent());

        component.pagination.currentPage = 8;
        component.pagination.itemsPerPage = 18;
        component.purposeCodeFilters = ['purposeFilterF'];
        component.statusCodeFilters = ['UNKNOWN'];
        component.regionCodeFilter = 'regionFilterF';
        component.exporting = true;

        applicationServiceMock = TestBed.get(ApplicationService);
        applicationServiceMock.getAll.calls.reset();
        applicationServiceMock.getAll.and.returnValue(of(applications));

        exportServiceMock = TestBed.get(ExportService);
        exportServiceMock.exportAsCSV.calls.reset();

        component.export();
      }));

      it('calls ExportService.exportAsCSV', () => {
        expect(exportServiceMock.exportAsCSV).toHaveBeenCalledTimes(1);
        expect(exportServiceMock.exportAsCSV.calls.all()[0].args[0]).toEqual(applications);
      });

      it('updates exporting flag', () => {
        expect(component.exporting).toEqual(false);
      });
    });

    describe('on error', () => {
      let component;
      let exportServiceMock;

      const applications = [new Application({ _id: 4 })];

      beforeEach(async(() => {
        ({ component } = createComponent());

        component.exporting = true;

        const applicationServiceMock = TestBed.get(ApplicationService);
        applicationServiceMock.getAll.calls.reset();
        applicationServiceMock.getAll.and.returnValue(of(applications));

        exportServiceMock = TestBed.get(ExportService);
        exportServiceMock.exportAsCSV.calls.reset();
        exportServiceMock.exportAsCSV.and.returnValue(throwError('some error 2'));

        component.export();
      }));

      it('calls ExportService.exportAsCSV', () => {
        expect(exportServiceMock.exportAsCSV).toHaveBeenCalledTimes(1);
        expect(exportServiceMock.exportAsCSV.calls.all()[0].args[0]).toEqual(applications);
      });

      it('updates exporting flag', () => {
        expect(component.exporting).toEqual(false);
      });
    });
  });

  describe('setInitialQueryParameters', () => {
    it('sets default query parameters when parameters are not saved to the url', () => {
      const { component } = createComponent();

      component.pagination.currentPage = 7;
      component.sorting.column = 'columnC';
      component.sorting.direction = 2;
      component.purposeCodeFilters = ['purposeFilterC'];
      component.statusCodeFilters = ['statusFilterC'];
      component.regionCodeFilter = 'regionFilterC';
      // component.commentCodeFilters = ['commentFilterC'];

      component.setInitialQueryParameters();

      expect(component.pagination.currentPage).toEqual(1);
      expect(component.sorting.column).toEqual(null);
      expect(component.sorting.direction).toEqual(0);
      expect(component.purposeCodeFilters).toEqual([]);
      expect(component.statusCodeFilters).toEqual([]);
      expect(component.regionCodeFilter).toEqual('');
      // expect(component.commentCodeFilters).toEqual([]);
    });

    it('sets default query parameters when parameters are saved to the url', () => {
      const activatedRouteStub: ActivatedRouteStub = TestBed.get(ActivatedRoute);
      activatedRouteStub.setQueryParamMap({
        page: 3,
        sortBy: '+columnD',
        purpose: 'purpose1|purpose2',
        status: 'status1|status2|status3',
        region: 'region1',
        comment: 'comment1'
      });

      const { component } = createComponent();

      component.pagination.currentPage = 77;
      component.sorting.column = 'columnCC';
      component.sorting.direction = 22;
      component.purposeCodeFilters = ['purposeFilterCC'];
      component.statusCodeFilters = ['statusFilterCC'];
      component.regionCodeFilter = 'regionFilterCC';
      // component.commentCodeFilters = ['commentFilterCC'];

      component.setInitialQueryParameters();

      expect(component.pagination.currentPage).toEqual(3);
      expect(component.sorting.column).toEqual('columnD');
      expect(component.sorting.direction).toEqual(1);
      expect(component.purposeCodeFilters).toEqual(['purpose1', 'purpose2']);
      expect(component.statusCodeFilters).toEqual(['status1', 'status2', 'status3']);
      expect(component.regionCodeFilter).toEqual('region1');
      // expect(component.commentCodeFilters).toEqual(['comment1']);
    });
  });

  describe('saveQueryParameters', () => {
    let component;
    let spyRouter;
    let spyLocation;

    beforeEach(() => {
      spyRouter = TestBed.get(Router);
      spyRouter.createUrlTree.and.callFake((...args) => {
        expect(args[1].queryParams).toEqual({
          page: 4,
          sortBy: '-columnA',
          purpose: 'purposeFilterA',
          region: 'regionFilterA',
          status: 'statusFilterA'
          // comment: 'commentFilterA'
        });
        return 'I was called 1';
      });

      spyLocation = TestBed.get(Location);
      spyLocation.go.calls.reset();

      ({ component } = createComponent());
    });

    it('saves all query parameters to the url', () => {
      component.pagination.currentPage = 4;
      component.sorting.column = 'columnA';
      component.sorting.direction = -1;
      component.purposeCodeFilters = ['purposeFilterA'];
      component.statusCodeFilters = ['statusFilterA'];
      component.regionCodeFilter = 'regionFilterA';
      // component.commentCodeFilters = ['commentFilterA'];

      component.saveQueryParameters();

      expect(spyLocation.go).toHaveBeenCalledWith('I was called 1');
    });
  });

  describe('clearQueryParameters', () => {
    let component;
    let spyRouter;
    let spyLocation;

    beforeEach(() => {
      spyRouter = TestBed.get(Router);
      spyRouter.createUrlTree.and.callFake((...args) => {
        expect(args[1]['queryParams']).toBeUndefined();
        return 'I was called 2';
      });

      spyLocation = TestBed.get(Location);
      spyLocation.go.calls.reset();

      ({ component } = createComponent());
    });

    it('sets all query parameters to their default values', () => {
      component.pagination.currentPage = 5;
      component.pagination.totalItems = 11;
      component.sorting.column = 'columnB';
      component.sorting.direction = -1;
      component.purposeCodeFilters = ['purposeFilterB'];
      component.statusCodeFilters = ['statusFilterB'];
      component.regionCodeFilter = 'regionFilterB';
      // component.commentCodeFilters = ['commentFilterB'];

      component.clearQueryParameters();

      expect(component.pagination.currentPage).toEqual(1);
      expect(component.pagination.totalItems).toEqual(0);
      expect(component.sorting.column).toEqual(null);
      expect(component.sorting.direction).toEqual(0);
      expect(component.purposeCodeFilters).toEqual([]);
      expect(component.statusCodeFilters).toEqual([]);
      expect(component.regionCodeFilter).toEqual('');
      // expect(component.commentCodeFilters).toEqual([]);

      expect(spyLocation.go).toHaveBeenCalledWith('I was called 2');
    });
  });

  describe('setPurposeFilter', () => {
    let component;
    beforeEach(() => {
      ({ component } = createComponent());
    });

    describe('purposeCode is undefined', () => {
      beforeEach(() => {
        component.purposeCodeFilters = ['oldFilter'];
        component.filterChanged = false;

        component.setPurposeFilter(undefined);
      });

      it('sets purposeCodeFilters to empty array', () => {
        expect(component.purposeCodeFilters).toEqual([]);
      });

      it('sets filterChanged to true', () => {
        expect(component.filterChanged).toEqual(true);
      });
    });

    describe('purposeCode is null', () => {
      beforeEach(() => {
        component.purposeCodeFilters = ['oldFilter'];
        component.filterChanged = false;

        component.setPurposeFilter(null);
      });

      it('sets purposeCodeFilters to empty array', () => {
        expect(component.purposeCodeFilters).toEqual([]);
      });

      it('sets filterChanged to true', () => {
        expect(component.filterChanged).toEqual(true);
      });
    });

    describe('purposeCode is empty string', () => {
      beforeEach(() => {
        component.purposeCodeFilters = ['oldFilter'];
        component.filterChanged = false;

        component.setPurposeFilter('');
      });

      it('sets purposeCodeFilters to empty array', () => {
        expect(component.purposeCodeFilters).toEqual([]);
      });

      it('sets filterChanged to true', () => {
        expect(component.filterChanged).toEqual(true);
      });
    });

    describe('purposeCode is valid', () => {
      beforeEach(() => {
        component.purposeCodeFilters = ['oldFilter'];
        component.filterChanged = false;

        component.setPurposeFilter('newFilter');
      });

      it('sets purposeCodeFilters to array containing new filter', () => {
        expect(component.purposeCodeFilters).toEqual(['newFilter']);
      });

      it('sets filterChanged to true', () => {
        expect(component.filterChanged).toEqual(true);
      });
    });
  });

  describe('setStatusFilter', () => {
    let component;
    beforeEach(() => {
      ({ component } = createComponent());
    });

    describe('statusCode is undefined', () => {
      beforeEach(() => {
        component.statusCodeFilters = ['oldFilter'];
        component.filterChanged = false;

        component.setStatusFilter(undefined);
      });

      it('sets statusCodeFilters to empty array', () => {
        expect(component.statusCodeFilters).toEqual([]);
      });

      it('sets filterChanged to true', () => {
        expect(component.filterChanged).toEqual(true);
      });
    });

    describe('statusCode is null', () => {
      beforeEach(() => {
        component.statusCodeFilters = ['oldFilter'];
        component.filterChanged = false;

        component.setStatusFilter(null);
      });

      it('sets statusCodeFilters to empty array', () => {
        expect(component.statusCodeFilters).toEqual([]);
      });

      it('sets filterChanged to true', () => {
        expect(component.filterChanged).toEqual(true);
      });
    });

    describe('statusCode is empty string', () => {
      beforeEach(() => {
        component.statusCodeFilters = ['oldFilter'];
        component.filterChanged = false;

        component.setStatusFilter('');
      });

      it('sets statusCodeFilters to empty array', () => {
        expect(component.statusCodeFilters).toEqual([]);
      });

      it('sets filterChanged to true', () => {
        expect(component.filterChanged).toEqual(true);
      });
    });

    describe('statusCode is valid', () => {
      beforeEach(() => {
        component.statusCodeFilters = ['oldFilter'];
        component.filterChanged = false;

        component.setStatusFilter('newFilter');
      });

      it('sets statusCodeFilters to array containing new filter', () => {
        expect(component.statusCodeFilters).toEqual(['newFilter']);
      });

      it('sets filterChanged to true', () => {
        expect(component.filterChanged).toEqual(true);
      });
    });
  });

  describe('setRegionFilter', () => {
    let component;
    beforeEach(() => {
      ({ component } = createComponent());
    });

    describe('regionCode is undefined', () => {
      beforeEach(() => {
        component.regionCodeFilter = 'oldFilter';
        component.filterChanged = false;

        component.setRegionFilter(undefined);
      });

      it('sets regionCodeFilter to empty array', () => {
        expect(component.regionCodeFilter).toEqual('');
      });

      it('sets filterChanged to true', () => {
        expect(component.filterChanged).toEqual(true);
      });
    });

    describe('regionCode is null', () => {
      beforeEach(() => {
        component.regionCodeFilter = 'oldFilter';
        component.filterChanged = false;

        component.setRegionFilter(null);
      });

      it('sets regionCodeFilter to empty string', () => {
        expect(component.regionCodeFilter).toEqual('');
      });

      it('sets filterChanged to true', () => {
        expect(component.filterChanged).toEqual(true);
      });
    });

    describe('regionCode is empty string', () => {
      beforeEach(() => {
        component.regionCodeFilter = 'oldFilter';
        component.filterChanged = false;

        component.setRegionFilter('');
      });

      it('sets regionCodeFilter to empty string', () => {
        expect(component.regionCodeFilter).toEqual('');
      });

      it('sets filterChanged to true', () => {
        expect(component.filterChanged).toEqual(true);
      });
    });

    describe('regionCode is valid', () => {
      beforeEach(() => {
        component.regionCodeFilter = 'oldFilter';
        component.filterChanged = false;

        component.setRegionFilter('newFilter');
      });

      it('sets regionCodeFilter to new filter', () => {
        expect(component.regionCodeFilter).toEqual('newFilter');
      });

      it('sets filterChanged to true', () => {
        expect(component.filterChanged).toEqual(true);
      });
    });
  });

  describe('setApplicantFilter', () => {
    let component;
    beforeEach(() => {
      ({ component } = createComponent());
    });

    describe('applicantCode is undefined', () => {
      beforeEach(() => {
        component.applicantFilter = 'oldFilter';
        component.filterChanged = false;

        component.setApplicantFilter(undefined);
      });

      it('sets applicantFilter to empty array', () => {
        expect(component.applicantFilter).toEqual('');
      });

      it('sets filterChanged to true', () => {
        expect(component.filterChanged).toEqual(true);
      });
    });

    describe('applicantCode is null', () => {
      beforeEach(() => {
        component.applicantFilter = 'oldFilter';
        component.filterChanged = false;

        component.setApplicantFilter(null);
      });

      it('sets applicantFilter to empty string', () => {
        expect(component.applicantFilter).toEqual('');
      });

      it('sets filterChanged to true', () => {
        expect(component.filterChanged).toEqual(true);
      });
    });

    describe('applicantCode is empty string', () => {
      beforeEach(() => {
        component.applicantFilter = 'oldFilter';
        component.filterChanged = false;

        component.setApplicantFilter('');
      });

      it('sets applicantFilter to empty string', () => {
        expect(component.applicantFilter).toEqual('');
      });

      it('sets filterChanged to true', () => {
        expect(component.filterChanged).toEqual(true);
      });
    });

    describe('applicantCode is valid', () => {
      beforeEach(() => {
        component.applicantFilter = 'oldFilter';
        component.filterChanged = false;

        component.setApplicantFilter('newFilter');
      });

      it('sets applicantFilter to new filter', () => {
        expect(component.applicantFilter).toEqual('newFilter');
      });

      it('sets filterChanged to true', () => {
        expect(component.filterChanged).toEqual(true);
      });
    });
  });

  // describe('setCommentFilter', () => {
  //   let component;
  //   beforeEach(() => {
  //     ({ component } = createComponent());
  //   });

  //   describe('commentCode is undefined', () => {
  //     beforeEach(() => {
  //       component.commentCodeFilters = ['oldFilter'];
  //       component.filterChanged = false;

  //       component.setCommentFilter(undefined);
  //     });

  //     it('sets commentCodeFilters to empty array', () => {
  //       expect(component.commentCodeFilters).toEqual([]);
  //     });

  //     it('sets filterChanged to true', () => {
  //       expect(component.filterChanged).toEqual(true);
  //     });
  //   });

  //   describe('commentCode is null', () => {
  //     beforeEach(() => {
  //       component.commentCodeFilters = ['oldFilter'];
  //       component.filterChanged = false;

  //       component.setCommentFilter(null);
  //     });

  //     it('sets commentCodeFilters to empty array', () => {
  //       expect(component.commentCodeFilters).toEqual([]);
  //     });

  //     it('sets filterChanged to true', () => {
  //       expect(component.filterChanged).toEqual(true);
  //     });
  //   });

  //   describe('commentCode is empty string', () => {
  //     beforeEach(() => {
  //       component.commentCodeFilters = ['oldFilter'];
  //       component.filterChanged = false;

  //       component.setCommentFilter('');
  //     });

  //     it('sets commentCodeFilters to empty array', () => {
  //       expect(component.commentCodeFilters).toEqual([]);
  //     });

  //     it('sets filterChanged to true', () => {
  //       expect(component.filterChanged).toEqual(true);
  //     });
  //   });

  //   describe('commentCode is valid', () => {
  //     beforeEach(() => {
  //       component.commentCodeFilters = ['oldFilter'];
  //       component.filterChanged = false;

  //       component.setCommentFilter('newFilter');
  //     });

  //     it('sets commentCodeFilters to array containing new filter', () => {
  //       expect(component.commentCodeFilters).toEqual(['newFilter']);
  //     });

  //     it('sets filterChanged to true', () => {
  //       expect(component.filterChanged).toEqual(true);
  //     });
  //   });
  // });

  // describe('applyCommentPeriodFilter', () => {
  //   let component;
  //   beforeEach(() => {
  //     ({ component } = createComponent());
  //   });

  //   const applications: Application[] = [
  //     new Application({ _id: 1, meta: { cpStatusStringLong: CommentCodes.CLOSED.code } }),
  //     new Application({ _id: 2, meta: { cpStatusStringLong: CommentCodes.NOT_STARTED.code } }),
  //     new Application({ _id: 3, meta: { cpStatusStringLong: CommentCodes.NOT_OPEN.code } }),
  //     new Application({ _id: 4, meta: { cpStatusStringLong: CommentCodes.OPEN.code } })
  //   ];

  //   it('returns original applications array if array is undefined', () => {
  //     component.commentCodeFilters = [CommentCodes.CLOSED.code];

  //     const filteredApplications = component.applyCommentPeriodFilter(undefined);
  //     expect(filteredApplications).toEqual(undefined);
  //   });

  //   it('returns original applications array if array is null', () => {
  //     component.commentCodeFilters = [CommentCodes.CLOSED.code];

  //     const filteredApplications = component.applyCommentPeriodFilter(null);
  //     expect(filteredApplications).toEqual(null);
  //   });

  //   it('returns original applications array if commentCodeFilters is undefined', () => {
  //     component.commentCodeFilters = undefined;

  //     const filteredApplications = component.applyCommentPeriodFilter(applications);
  //     expect(filteredApplications).toEqual(applications);
  //   });

  //   it('returns original applications array if commentCodeFilters is null', () => {
  //     component.commentCodeFilters = null;

  //     const filteredApplications = component.applyCommentPeriodFilter(applications);
  //     expect(filteredApplications).toEqual(applications);
  //   });

  //   it('returns original applications array if commentCodeFilters is empty', () => {
  //     component.commentCodeFilters = [];

  //     const filteredApplications = component.applyCommentPeriodFilter(applications);
  //     expect(filteredApplications).toEqual(applications);
  //   });

  //   it('filters out applications that are missing the cpStatusStringLong field', () => {
  //     component.commentCodeFilters = [CommentCodes.NOT_STARTED.code];

  //     const applicationsMissingCPStatus = [
  //       new Application({ _id: 1 }),
  //       new Application({ _id: 2, meta: { cpStatusStringLong: CommentCodes.NOT_STARTED.code } }),
  //       new Application({ _id: 3 })
  //     ];

  //     const filteredApplications = component.applyCommentPeriodFilter(applicationsMissingCPStatus);
  //     expect(filteredApplications).toEqual([
  //       new Application({ _id: 2, meta: { cpStatusStringLong: CommentCodes.NOT_STARTED.code } })
  //     ]);
  //   });

  //   it('filters out applications whose cpStatusStringLong does not match the commentCodeFilters', () => {
  //     component.commentCodeFilters = [CommentCodes.CLOSED.code];

  //     const filteredApplications = component.applyCommentPeriodFilter(applications);
  //     expect(filteredApplications).toEqual([
  //       new Application({ _id: 1, meta: { cpStatusStringLong: CommentCodes.CLOSED.code } })
  //     ]);
  //   });

  //   it('filters out applications whose cpStatusStringLong does not match the commentCodeFilters', () => {
  //     component.commentCodeFilters = [CommentCodes.CLOSED.code, CommentCodes.OPEN.code];

  //     const filteredApplications = component.applyCommentPeriodFilter(applications);
  //     expect(filteredApplications).toEqual([
  //       new Application({ _id: 1, meta: { cpStatusStringLong: CommentCodes.CLOSED.code } }),
  //       new Application({ _id: 4, meta: { cpStatusStringLong: CommentCodes.OPEN.code } })
  //     ]);
  //   });
  // });

  describe('sort', () => {
    let component;
    beforeEach(() => {
      ({ component } = createComponent());
    });

    it('does nothing if sortBy is undefined', () => {
      component.sorting.column = 'columnE';
      component.sorting.direction = 1;

      component.sort(undefined);
      expect(component.sorting.column).toEqual('columnE');
      expect(component.sorting.direction).toEqual(1);
    });

    it('does nothing if sortBy is null', () => {
      component.sorting.column = 'columnE';
      component.sorting.direction = 1;

      component.sort(null);
      expect(component.sorting.column).toEqual('columnE');
      expect(component.sorting.direction).toEqual(1);
    });

    it('sets column and toggles direction', () => {
      component.sorting.column = '';
      component.sorting.direction = null;

      component.sort('columnA');
      expect(component.sorting.column).toEqual('columnA');
      expect(component.sorting.direction).toEqual(1);

      component.sort('columnA');
      expect(component.sorting.column).toEqual('columnA');
      expect(component.sorting.direction).toEqual(-1);

      component.sort('columnA');
      expect(component.sorting.column).toEqual('columnA');
      expect(component.sorting.direction).toEqual(1);

      component.sort('columnD');
      expect(component.sorting.column).toEqual('columnD');
      expect(component.sorting.direction).toEqual(1);
    });
  });

  describe('updatePagination', () => {
    const initialPaginationValues = {
      currentPage: 3,
      itemsPerPage: 2,
      totalItems: 9,
      pageCount: 5,
      message: 'Displaying 5 - 6 of 9 applications'
    };

    let component;
    beforeEach(() => {
      ({ component } = createComponent());
      component.pagination = { ...initialPaginationValues };
    });

    it('does nothing if paginationParams is undefined', () => {
      component.updatePagination(undefined);
      expect(component.pagination).toEqual(initialPaginationValues);
    });

    it('does nothing if paginationParams is null', () => {
      component.updatePagination(null);
      expect(component.pagination).toEqual(initialPaginationValues);
    });

    it('does nothing if totalItems is negative', () => {
      component.updatePagination({ totalItems: -1 });
      expect(component.pagination).toEqual({ ...initialPaginationValues });
    });

    it('does nothing if currentPage is negative', () => {
      component.updatePagination({ currentPage: -1 });
      expect(component.pagination).toEqual({ ...initialPaginationValues });
    });

    it('sets canned message when totalItems is 0', () => {
      component.updatePagination({ totalItems: 0 });
      expect(component.pagination).toEqual({
        ...initialPaginationValues,
        totalItems: 0,
        pageCount: 1,
        message: 'No applications found'
      });
    });

    it('updates pagination values for small sets', () => {
      component.updatePagination({ currentPage: 1, totalItems: 1 });
      expect(component.pagination).toEqual({
        ...initialPaginationValues,
        currentPage: 1,
        totalItems: 1,
        pageCount: 1,
        message: 'Displaying 1 - 1 of 1 applications'
      });
    });

    it('updates pagination values for large sets', () => {
      component.pagination.itemsPerPage = 13;

      component.updatePagination({ currentPage: 4, totalItems: 251 });
      expect(component.pagination).toEqual({
        ...initialPaginationValues,
        itemsPerPage: 13,
        currentPage: 4,
        totalItems: 251,
        pageCount: 20,
        message: 'Displaying 40 - 52 of 251 applications'
      });
    });

    it('updates pagination values on first page', () => {
      component.pagination.itemsPerPage = 14;

      component.updatePagination({ currentPage: 1, totalItems: 122 });
      expect(component.pagination).toEqual({
        ...initialPaginationValues,
        itemsPerPage: 14,
        currentPage: 1,
        totalItems: 122,
        pageCount: 9,
        message: 'Displaying 1 - 14 of 122 applications'
      });
    });

    it('updates pagination values on last page', () => {
      component.pagination.itemsPerPage = 14;

      component.updatePagination({ currentPage: 10, totalItems: 130 });
      expect(component.pagination).toEqual({
        ...initialPaginationValues,
        itemsPerPage: 14,
        currentPage: 10,
        totalItems: 130,
        pageCount: 10,
        message: 'Displaying 127 - 130 of 130 applications'
      });
    });

    it('updates pagination values when totalItems changes', () => {
      component.updatePagination({ totalItems: 15 });
      expect(component.pagination).toEqual({
        ...initialPaginationValues,
        totalItems: 15,
        pageCount: 8,
        message: 'Displaying 5 - 6 of 15 applications'
      });
    });

    it('updates pagination values when currentPage changes', () => {
      component.updatePagination({ currentPage: 4 });
      expect(component.pagination).toEqual({
        ...initialPaginationValues,
        currentPage: 4,
        message: 'Displaying 7 - 8 of 9 applications'
      });
    });

    it('sets canned message when currentPage greater than pageCount', () => {
      component.updatePagination({ currentPage: 10 });
      expect(component.pagination).toEqual({
        ...initialPaginationValues,
        currentPage: 10,
        message: 'Unable to display results, please clear and re-try'
      });
    });

    it('sets canned message when totalItems causes pageCount to be smaller than currentPage', () => {
      component.updatePagination({ totalItems: 1 });
      expect(component.pagination).toEqual({
        ...initialPaginationValues,
        totalItems: 1,
        pageCount: 1,
        message: 'Unable to display results, please clear and re-try'
      });
    });
  });

  describe('resetPagination', () => {
    let component;
    beforeEach(() => {
      ({ component } = createComponent());
    });

    it('sets current page to 1', () => {
      component.pagination.currentPage = 5;
      component.resetPagination();
      expect(component.pagination.currentPage).toEqual(1);
    });

    it('sets filterChanged flag to false', () => {
      component.filterChanged = true;
      component.resetPagination();
      expect(component.filterChanged).toEqual(false);
    });
  });

  describe('updatePage', () => {
    let component;
    beforeEach(() => {
      ({ component } = createComponent());
    });

    it('does nothing when page is undefined', () => {
      component.pagination.currentPage = 0;
      component.updatePage(undefined);
      expect(component.pagination.currentPage).toEqual(0);
    });

    it('does nothing when page is null', () => {
      component.pagination.currentPage = 0;
      component.updatePage(null);
      expect(component.pagination.currentPage).toEqual(0);
    });

    it('does nothing when page equal to 0', () => {
      component.pagination.currentPage = 1;
      component.updatePage(0);
      expect(component.pagination.currentPage).toEqual(1);
    });

    it('does nothing when page greater than 1', () => {
      component.pagination.currentPage = 1;
      component.updatePage(2);
      expect(component.pagination.currentPage).toEqual(1);
    });

    describe('page is -1', () => {
      it('current page is greater than 1', () => {
        component.pagination.currentPage = 2;
        component.updatePage(-1);
        expect(component.pagination.currentPage).toEqual(1);
      });

      it('current page is equal to 1', () => {
        component.pagination.currentPage = 1;
        component.updatePage(-1);
        expect(component.pagination.currentPage).toEqual(1);
      });

      it('current page is less than 1', () => {
        component.pagination.currentPage = 0;
        component.updatePage(-1);
        expect(component.pagination.currentPage).toEqual(0);
      });
    });

    describe('page is 1', () => {
      it('page count is greater than current page + 1', () => {
        component.pagination.pageCount = 3;
        component.pagination.currentPage = 1;
        component.updatePage(1);
        expect(component.pagination.currentPage).toEqual(2);
      });

      it('page count is equal to current page + 1', () => {
        component.pagination.pageCount = 2;
        component.pagination.currentPage = 1;
        component.updatePage(1);
        expect(component.pagination.currentPage).toEqual(2);
      });

      it('page count is equal to current page', () => {
        component.pagination.pageCount = 2;
        component.pagination.currentPage = 2;
        component.updatePage(1);
        expect(component.pagination.currentPage).toEqual(2);
      });

      it('page count is less than current page', () => {
        component.pagination.pageCount = 1;
        component.pagination.currentPage = 2;
        component.updatePage(1);
        expect(component.pagination.currentPage).toEqual(2);
      });
    });
  });

  describe('setPage', () => {
    let component;
    beforeEach(() => {
      ({ component } = createComponent());
    });

    it('does nothing when page is undefined', () => {
      component.pagination.currentPage = 0;
      component.setPage(undefined);
      expect(component.pagination.currentPage).toEqual(0);
    });

    it('does nothing when page is null', () => {
      component.pagination.currentPage = 0;
      component.setPage(null);
      expect(component.pagination.currentPage).toEqual(0);
    });

    it('does nothing when page is negative', () => {
      component.pagination.currentPage = 0;
      component.setPage(-1);
      expect(component.pagination.currentPage).toEqual(0);
    });

    it('does nothing when page is 0', () => {
      component.pagination.currentPage = 1;
      component.setPage(0);
      expect(component.pagination.currentPage).toEqual(1);
    });
  });
});
