import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule /*, HttpTestingController*/ } from '@angular/common/http/testing';
import { ApiService, IApplicationParameters } from './api';

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
      const queryParams: IApplicationParameters = {
        pageNum: 0,
        pageSize: 30,
        cpStart: new Date('2019-01-01'),
        cpEnd: new Date('2019-02-02'),
        tantalisID: 123,
        cl_file: 321,
        purpose: ['PURPOSE'],
        subpurpose: ['SUBPURPOSE'],
        status: ['STATUS'],
        reason: ['REGION'],
        subtype: 'SUBTYPE',
        agency: 'AGENCY',
        businessUnit: 'BUSINESSUNIT',
        client: 'CLIENT',
        tenureStage: 'TENURESTAGE',
        areaHectares: '123.123',
        statusHistoryEffectiveDate: new Date('2019-03-03'),
        centroid: '[[[123, 123]]]',
        publishDate: new Date('2019-04-04'),
        isDeleted: false
      };

      const result = service.buildApplicationQueryParametersString(queryParams);

      const expectedResult =
        'pageNum=0&' +
        'pageSize=30&' +
        `cpStart=${new Date('2019-01-01').toISOString()}` +
        `&cpEnd=${new Date('2019-02-02').toISOString()}` +
        '&tantalisID=123' +
        '&cl_file=321&' +
        'purpose[eq]=PURPOSE&' +
        'subpurpose[eq]=SUBPURPOSE' +
        '&status[eq]=STATUS&' +
        'reason[eq]=REGION&' +
        'subtype=SUBTYPE&' +
        'agency=AGENCY&' +
        'businessUnit[eq]=BUSINESSUNIT&' +
        'client=CLIENT&' +
        'tenureStage=TENURESTAGE&' +
        'areaHectares=123.123&' +
        `statusHistoryEffectiveDate=${new Date('2019-03-03').toISOString()}` +
        '&centroid=[[[123, 123]]]&' +
        `publishDate=${new Date('2019-04-04').toISOString()}&` +
        'isDeleted=false';

      expect(result).toEqual(expectedResult);
    });
  });
});
