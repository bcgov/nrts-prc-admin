import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule /*, HttpTestingController*/ } from '@angular/common/http/testing';
import { ApiService, IApplicationQueryParamSet, QueryParamModifier } from './api';

describe('ApiService', () => {
  // let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService],
      imports: [HttpClientTestingModule]
    });
  });

  it('should be created', () => {
    const service = TestBed.get(ApiService);
    expect(service).toBeTruthy();
  });

  describe('convertArrayIntoPipeString', () => {
    let service;

    beforeEach(() => {
      service = TestBed.get(ApiService);
    });

    it('given an empty array returns empty string', () => {
      const result = service.convertArrayIntoPipeString([]);

      expect(result).toEqual('');
    });

    it('given a valid array returns a pipe deliminated string', () => {
      const result = service.convertArrayIntoPipeString(['dog', 'cat', 'bird', 'big lizard']);

      expect(result).toEqual('dog|cat|bird|big lizard');
    });
  });

  describe('buildApplicationQueryParametersString', () => {
    let service;

    beforeEach(() => {
      service = TestBed.get(ApiService);
    });

    it('given undefined query params returns empty string', () => {
      const result = service.buildApplicationQueryParametersString(undefined);

      expect(result).toEqual('');
    });

    it('given null query params returns empty string', () => {
      const result = service.buildApplicationQueryParametersString(null);

      expect(result).toEqual('');
    });

    it('given all query params', () => {
      const queryParams: IApplicationQueryParamSet = {
        pageNum: 0,
        pageSize: 30,
        sortBy: 'status',
        isDeleted: false,
        cpStart: { value: new Date('2019-01-01') },
        cpEnd: { value: new Date('2019-02-02') },
        tantalisID: { value: 123 },
        cl_file: { value: 321 },
        purpose: { value: ['PURPOSE'] },
        subpurpose: { value: ['SUBPURPOSE'] },
        status: { value: ['STATUS'] },
        reason: { value: ['REGION'], modifier: QueryParamModifier.Not_Equal },
        subtype: { value: 'SUBTYPE' },
        agency: { value: 'AGENCY' },
        businessUnit: { value: 'BUSINESSUNIT' },
        client: { value: 'CLIENT', modifier: QueryParamModifier.Text },
        tenureStage: { value: 'TENURESTAGE' },
        areaHectares: { value: '123.123' },
        statusHistoryEffectiveDate: { value: new Date('2019-03-03') },
        centroid: { value: '[[[123, 123]]]' },
        publishDate: { value: new Date('2019-04-04') }
      };

      const result = service.buildApplicationQueryParametersString(queryParams);

      const expectedResult =
        'isDeleted=false&' +
        'sortBy=status&' +
        'pageNum=0&' +
        'pageSize=30&' +
        `cpStart=${new Date('2019-01-01').toISOString()}&` +
        `cpEnd=${new Date('2019-02-02').toISOString()}&` +
        'tantalisID=123&' +
        'cl_file=321&' +
        'purpose[eq]=PURPOSE&' +
        'subpurpose[eq]=SUBPURPOSE&' +
        'status[eq]=STATUS&' +
        'reason[ne]=REGION&' +
        'subtype=SUBTYPE&' +
        'agency=AGENCY&' +
        'businessUnit[eq]=BUSINESSUNIT&' +
        'client[text]=CLIENT&' +
        'tenureStage=TENURESTAGE&' +
        'areaHectares=123.123&' +
        `statusHistoryEffectiveDate=${new Date('2019-03-03').toISOString()}&` +
        'centroid=[[[123, 123]]]&' +
        `publishDate=${new Date('2019-04-04').toISOString()}`;

      expect(result).toEqual(expectedResult);
    });
  });
});
