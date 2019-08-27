import { Feature } from './feature';
import { InterestedParty } from './interestedParty';

export class SearchResults {
  _id: string;
  totalFeatures: number;
  date: Date = null;
  crs: string;
  type: string;
  status: string;
  hostname: string;

  features: Feature[] = [];

  // New Data
  CROWN_LANDS_FILE: string;
  DISPOSITION_TRANSACTION_SID: string;
  RESPONSIBLE_BUSINESS_UNIT: string;
  TENURE_LOCATION: string;
  TENURE_PURPOSE: string;
  TENURE_STAGE: string;
  TENURE_STATUS: string;
  TENURE_REASON: string;
  TENURE_SUBPURPOSE: string;
  TENURE_SUBTYPE: string;
  TENURE_TYPE: string;
  areaHectares: number;
  centroid: number[] = []; // [lng, lat]
  interestedParties: InterestedParty[] = [];
  parcels: Feature[] = [];
  statusHistoryEffectiveDate: Date = null;

  constructor(search?: any, hostname?: any) {
    this._id = (search && search._id) || null;
    this.totalFeatures = (search && search.totalFeatures) || 0;
    this.crs = (search && search.crs) || null;
    this.type = (search && search.type) || null;
    this.status = (search && search.status) || null;
    this.hostname = hostname;

    this.CROWN_LANDS_FILE = (search && search.CROWN_LANDS_FILE) || null;
    this.DISPOSITION_TRANSACTION_SID = (search && search.DISPOSITION_TRANSACTION_SID) || null;
    this.RESPONSIBLE_BUSINESS_UNIT = (search && search.RESPONSIBLE_BUSINESS_UNIT) || null;
    this.TENURE_LOCATION = (search && search.TENURE_LOCATION) || null;
    this.TENURE_PURPOSE = (search && search.TENURE_PURPOSE) || null;
    this.TENURE_STAGE = (search && search.TENURE_STAGE) || null;
    this.TENURE_STATUS = (search && search.TENURE_STATUS) || null;
    this.TENURE_REASON = (search && search.TENURE_REASON) || null;
    this.TENURE_SUBPURPOSE = (search && search.TENURE_SUBPURPOSE) || null;
    this.TENURE_SUBTYPE = (search && search.TENURE_SUBTYPE) || null;
    this.TENURE_TYPE = (search && search.TENURE_TYPE) || null;
    this.TENURE_TYPE = (search && search.TENURE_TYPE) || null;
    this.areaHectares = (search && search.areaHectares) || null;
    this.parcels = (search && search.parcels) || null;

    if (search && search.date) {
      this.date = new Date(search.date);
    }

    if (search && search.statusHistoryEffectiveDate) {
      this.statusHistoryEffectiveDate = new Date(search.statusHistoryEffectiveDate);
    }

    // copy features
    if (search && search.features) {
      for (const feature of search.features) {
        this.features.push(feature);
      }
    }

    // copy interestedParties
    if (search && search.interestedParties) {
      for (const party of search.interestedParties) {
        this.interestedParties.push(party);
      }
    }

    // copy centroid
    if (search && search.centroid) {
      for (const num of search.centroid) {
        this.centroid.push(num);
      }
    }
  }
}
