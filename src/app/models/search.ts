import { Feature } from './feature';
import { Application } from './application';
import { Organization } from './organization';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

export class Search {
  _id: string;
  totalFeatures: number;
  features: Array<Feature>;
  date: Date;
  crs: string;
  type: string;
  status: string;
  hostname: string;
  application: Application;
  sidsFound: Array<string>;

  constructor(search?: any, hostname?: any) {
    this._id            = search && search._id            || null;
    this.totalFeatures  = search && search.totalFeatures  || 0;
    this.crs            = search && search.crs            || null;
    this.type           = search && search.type           || null;
    this.date           = search && search.date           || null;
    this.status         = search && search.status         || null;
    this.application    = search && search.application    || null;
    this.sidsFound      = search && search.sidsFound      || [];
    this.hostname       = hostname;

    this.features = [];

    if (search && search.features) {
      search.features.forEach(feature => {
        this.features.push(feature);
      });
    }
  }
}

export class SearchArray {
  items: Array<Search>;

  constructor(obj?: any) {
    this.items = obj && obj.items || [];
  }

  sort() {
    this.items.sort(function(a: Search, b: Search) {
      const aDate = a && a.date ? new Date(a.date).getTime() : 0;
      const bDate = b && b.date ? new Date(b.date).getTime() : 0;
      return bDate - aDate;
    });
  }

  get length() {
    return this.items.length;
  }

  add(search?: Search) {
    if (search) {
      this.items.push(search);
    }
  }
}

export class SearchTerms {
  keywords: string;
  clfile: string;
  dtid: string;
  applications: Array<Application>;
  organizations: Array<Organization>;
  ownerships: Array<Organization>;
  dateStart: NgbDateStruct;
  dateEnd: NgbDateStruct;

  constructor() {
    this.keywords       = '';
    this.clfile         = '';
    this.dtid           = '';
    this.applications   = [];
    this.organizations  = [];
    this.ownerships     = [];
    this.dateStart      = null;
    this.dateEnd        = null;
  }

  getParams() {
    const params = {};

    if (this.keywords) {
      params['keywords'] = this.keywords.split(' ').join(',');
    }

    if (this.clfile) {
      params['clfile'] = this.clfile.split(' ').join(',');
    }

    if (this.dtid) {
      params['dtid'] = this.dtid.split(' ').join(',');
    }

    if (this.applications.length) {
      params['applications'] = this.applications.map(p => p._id).join(',');
    }

    if (this.organizations.length) {
      params['organizations'] = this.organizations.map(p => p._id).join(',');
    }

    if (this.ownerships.length) {
      params['ownerships'] = this.ownerships.map(o => o._id).join(',');
    }

    if (this.dateStart) {
      params['datestart'] = this.getDateParam(this.dateStart);
    }

    if (this.dateEnd) {
      params['dateend'] = this.getDateParam(this.dateEnd);
    }

    return params;
  }

  private getDateParam(date: NgbDateStruct) {
    let dateParam = date.year + '-';

    if (date.month < 10) {
      dateParam += '0';
    }
    dateParam += date.month + '-';

    if (date.day < 10) {
      dateParam += '0';
    }
    dateParam += date.day;

    return dateParam;
  }
}
