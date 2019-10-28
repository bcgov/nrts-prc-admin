import { async, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { SearchComponent } from './search.component';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { SearchService } from 'app/services/search.service';
import { Application } from 'app/models/application';
import { of, throwError } from 'rxjs';
import { ActivatedRouteStub } from 'app/spec/helpers';
import { By } from '@angular/platform-browser';
import { CommentPeriod } from 'app/models/commentperiod';

describe('SearchComponent', () => {
  // component constructor mocks
  const mockLocation = jasmine.createSpyObj('Location', ['go']);
  const mockMatSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
  const mockMatSnackBarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
  const mockSearchService = jasmine.createSpyObj('SearchService', ['getApplicationsByCLFileAndTantalisID']);
  const mockActivatedRoute = new ActivatedRouteStub();

  /**
   * Set the mocks to their default stubbed state.
   */
  beforeAll(() => {
    setDefaultMockBehaviour();
  });

  /**
   * Initialize the test bed.
   */
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SearchComponent],
      providers: [
        { provide: Location, useValue: mockLocation },
        { provide: MatSnackBar, useValue: mockMatSnackBar },
        { provide: SearchService, useValue: mockSearchService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ],
      imports: [FormsModule, RouterTestingModule]
    }).compileComponents();
  }));

  /**
   * Sets the default stubbed behaviour of all mocks used by the component.
   */
  function setDefaultMockBehaviour() {
    mockLocation.go.and.stub();
    mockMatSnackBarRef.onAction.and.returnValue(of({}));
    mockMatSnackBar.open.and.returnValue(mockMatSnackBarRef);
    mockSearchService.getApplicationsByCLFileAndTantalisID.and.returnValue(of([]));
    mockActivatedRoute.clear();
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
    const fixture = TestBed.createComponent(SearchComponent);
    const component = fixture.componentInstance;

    if (detectChanges) {
      fixture.detectChanges();
    }

    return { component, fixture };
  }

  it('should be created', () => {
    const { component } = createComponent();

    expect(component).toBeTruthy();
  });

  describe('route behavior', () => {
    describe('with no params in the route', () => {
      let fixture;
      let searchService;
      let activatedRoute: ActivatedRouteStub;

      beforeEach(() => {
        ({ fixture } = createComponent(false));
        searchService = TestBed.get(SearchService);

        activatedRoute = TestBed.get(ActivatedRoute);
        activatedRoute.clear();
      });

      it('does not perform a search', () => {
        searchService.getApplicationsByCLFileAndTantalisID.calls.reset();

        fixture.detectChanges();

        expect(searchService.getApplicationsByCLFileAndTantalisID).not.toHaveBeenCalled();
      });
    });

    describe('with multiple params in the route', () => {
      let fixture;
      let searchService;
      let activatedRoute: ActivatedRouteStub;

      const urlParams = { keywords: '88888,99999' };

      beforeEach(() => {
        ({ fixture } = createComponent(false));
        searchService = TestBed.get(SearchService);

        activatedRoute = TestBed.get(ActivatedRoute);
        activatedRoute.setQueryParamMap(urlParams);
      });

      it('performs a search with those keywords', () => {
        searchService.getApplicationsByCLFileAndTantalisID.calls.reset();

        fixture.detectChanges();

        expect(searchService.getApplicationsByCLFileAndTantalisID).toHaveBeenCalledWith(['88888', '99999']);
      });
    });

    describe('with one keyword in the route', () => {
      const urlParams = { keywords: '88888' };

      describe('happy path', () => {
        let component;
        let fixture;
        let searchService;
        let activatedRoute: ActivatedRouteStub;

        const application1 = new Application({
          _id: '11',
          tantalisID: '1111'
        });
        const application2 = new Application({
          _id: '22',
          tantalisID: '2222'
        });
        const application3 = new Application({
          _id: '33',
          tantalisID: '3333'
        });

        beforeEach(async(() => {
          activatedRoute = TestBed.get(ActivatedRoute);
          activatedRoute.setQueryParamMap(urlParams);

          searchService = TestBed.get(SearchService);
          searchService.getApplicationsByCLFileAndTantalisID.calls.reset();
          searchService.getApplicationsByCLFileAndTantalisID.and.returnValue(
            of([application1, application2, application3])
          );

          ({ component, fixture } = createComponent(false));

          // start with an application to verify duplicates aren't added.
          component.applications = [application2];

          fixture.detectChanges();
        }));

        it('performs a search with those keywords', () => {
          expect(searchService.getApplicationsByCLFileAndTantalisID).toHaveBeenCalledWith(['88888']);
        });

        it('sets the components applications to the results from the search service, excluding duplicates', () => {
          expect(component.count).toEqual(3);
          expect(component.applications).toEqual([application1, application2, application3]);
        });
      });

      describe('on error', () => {
        let component;
        let fixture;
        let searchService;
        let activatedRoute: ActivatedRouteStub;
        let matSnackBar;
        let matSnackBarRef;

        beforeEach(async(() => {
          activatedRoute = TestBed.get(ActivatedRoute);
          activatedRoute.setQueryParamMap(urlParams);

          matSnackBarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
          matSnackBarRef.onAction.and.returnValue(of({}));

          matSnackBar = TestBed.get(MatSnackBar);
          matSnackBar.open.calls.reset();
          matSnackBar.open.and.returnValue(matSnackBarRef);

          searchService = TestBed.get(SearchService);
          searchService.getApplicationsByCLFileAndTantalisID.calls.reset();
          searchService.getApplicationsByCLFileAndTantalisID.and.returnValues(
            throwError('Something went wrong!'),
            of([])
          );

          ({ component, fixture } = createComponent(false));

          fixture.detectChanges();
        }));

        it('renders an error if the search service throws an error', () => {
          expect(matSnackBar.open).toHaveBeenCalledWith('Error searching applications ...', 'RETRY');
          // called twice because the error handling calls onSubmit, which returns the empty array the second time to
          // prevent recursing forever.
          expect(searchService.getApplicationsByCLFileAndTantalisID).toHaveBeenCalledTimes(2);
        });
      });
    });
  });

  // describe('searching', () => {
  //   let component;
  //   let fixture;
  //   let searchService;

  //   let searchInput: HTMLSelectElement;
  //   // const searchButton: DebugElement;
  //   let searchForm: DebugElement;

  //   beforeEach(() => {
  //     ({ component, fixture } = createComponent());
  //     searchService = TestBed.get(SearchService);
  //   });
  //   // I was having trouble getting the items from the search input to actually
  //   // trigger a change and be sent to the url
  //   // TODO: update test to actually assert the term in the search input is reflected in the route.
  //   xit('refreshes the current route with the search params', done => {
  //     fixture.whenStable().then(() => {
  //       const navigateSpy = spyOn((component as any).router, 'navigate');
  //       searchInput.value = '77777';
  //       searchInput.dispatchEvent(new Event('change'));
  //       fixture.detectChanges();

  //       searchForm.triggerEventHandler('ngSubmit', null);
  //       // searchButton.nativeElement.click();
  //       // searchForm.submit();

  //       // expect(searchService.getApplicationsByCLFileAndTantalisID).toHaveBeenCalledWith(['77777']);
  //       expect(navigateSpy).toHaveBeenCalledWith(['search', { ms: jasmine.anything() }]);
  //       done();
  //     });
  //   });
  // });

  describe('UI', () => {
    let fixture;
    let searchService;
    let activatedRoute: ActivatedRouteStub;

    const urlParams = { keywords: '999', ms: '123' };

    const valemontCommentPeriod = new CommentPeriod({
      startDate: new Date(2018, 8, 29),
      endDate: new Date(2018, 11, 1)
    });

    const valemontApplication = new Application({
      _id: '111111',
      cl_file: '66666',
      tantalisID: '123456',
      purpose: 'Shred',
      subpurpose: 'Powder',
      status: 'Application Under Review',
      meta: {
        applicants: 'Mr Moneybags',
        cpStatusStringLong: 'Commenting Closed',
        currentPeriod: valemontCommentPeriod
      }
    });

    const applicationTwo = new Application({
      _id: '222222',
      cl_file: '77777',
      tantalisID: '654321'
    });

    beforeEach(() => {
      ({ fixture } = createComponent(false));
      searchService = TestBed.get(SearchService);

      activatedRoute = TestBed.get(ActivatedRoute);
      activatedRoute.setQueryParamMap(urlParams);
    });

    describe('with application results', () => {
      beforeEach(() => {
        searchService.getApplicationsByCLFileAndTantalisID.and.returnValue(of([valemontApplication, applicationTwo]));
      });

      it('displays the application details on the page', () => {
        fixture.detectChanges();

        const searchTable: DebugElement = fixture.debugElement.query(By.css('.search-results table'));

        const firstApplicationRow = searchTable.query(By.css('.app-details'));
        expect(firstApplicationRow).toBeDefined();

        const firstApplicationRowElement = firstApplicationRow.nativeElement;

        expect(firstApplicationRowElement.textContent).toContain('123456');
        expect(firstApplicationRowElement.textContent).toContain('Mr Moneybags');
        expect(firstApplicationRowElement.textContent).toContain('Application Under Review');
        expect(firstApplicationRowElement.textContent).toContain('Shred / Powder');
      });

      describe('when the application "isCreated" property is true', () => {
        beforeEach(() => {
          valemontApplication.meta.isCreated = true;
          valemontApplication.meta.numComments = 200;
        });

        it('renders the comment period status and number of comments', () => {
          fixture.detectChanges();

          const searchTable: DebugElement = fixture.debugElement.query(By.css('.search-results table'));

          const firstCommentDetailsRow = searchTable.query(By.css('.app-comment-details'));
          expect(firstCommentDetailsRow).toBeDefined();

          const firstCommentRowElement = firstCommentDetailsRow.nativeElement;

          expect(firstCommentRowElement.textContent).toContain('200 comments');
          expect(firstCommentRowElement.textContent).toContain('Commenting Closed');
          expect(firstCommentRowElement.textContent).toContain('September 29, 2018 to December 1, 2018');
        });

        it('renders the "Actions" button', () => {
          fixture.detectChanges();

          const searchTable: DebugElement = fixture.debugElement.query(By.css('.search-results table'));

          const firstButton = searchTable.query(By.css('button'));
          const firstButtonElement = firstButton.nativeElement;
          expect(firstButtonElement.textContent).toContain('Actions');
        });
      });

      describe('when the application "isCreated" property is false', () => {
        beforeEach(() => {
          valemontApplication.meta.isCreated = false;
        });

        it('does not render commenting details', () => {
          fixture.detectChanges();

          const searchTable: DebugElement = fixture.debugElement.query(By.css('.search-results table'));

          const firstCommentDetailsRow = searchTable.query(By.css('.app-comment-details'));
          expect(firstCommentDetailsRow).toBeFalsy();
        });

        it('renders the "Create" button', () => {
          fixture.detectChanges();

          const searchTable: DebugElement = fixture.debugElement.query(By.css('.search-results table'));

          const firstButton = searchTable.query(By.css('button'));
          const firstButtonElement = firstButton.nativeElement;
          expect(firstButtonElement.textContent).toContain('Create');
        });
      });

      it('renders each application result on the page', () => {
        fixture.detectChanges();

        const searchTable: DebugElement = fixture.debugElement.query(By.css('.search-results table'));

        const appDetailsRows = searchTable.nativeElement.querySelectorAll('tr.app-details');
        expect(appDetailsRows.length).toBe(2);
      });
    });

    describe('with no application results', () => {});
  });
});
