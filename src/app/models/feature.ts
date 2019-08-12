export class Feature {
  _id: string;
  type: string;
  geometry: {
    type: string;
    geometries: [
      {
        type: string;
        coordinates: any;
      }
    ];
  };
  properties: {
    INTRID_SID: number;
    TENURE_STAGE: string;
    TENURE_STATUS: string;
    TENURE_REASON: string;
    TENURE_TYPE: string;
    TENURE_SUBTYPE: string;
    TENURE_PURPOSE: string;
    TENURE_SUBPURPOSE: string;
    CROWN_LANDS_FILE: string;
    TENURE_DOCUMENT: string;
    TENURE_EXPIRY: string; // TODO: convert to date?
    TENURE_LOCATION: string;
    TENURE_LEGAL_DESCRIPTION: string;
    TENURE_AREA_DERIVATION: string;
    TENURE_AREA_IN_HECTARES: number;
    RESPONSIBLE_BUSINESS_UNIT: string;
    DISPOSITION_TRANSACTION_SID: number;
    CODE_CHR_STAGE: string;
    FEATURE_CODE: string;
    FEATURE_AREA_SQM: number;
    FEATURE_LENGTH_M: number;
    OBJECTID: number;
    SW_ANNO_CAD_DATA: any; // TODO: what type is this?
  };
  isDeleted: boolean;
  applicationID: string;

  constructor(obj?: any) {
    this._id = (obj && obj._id) || null;
    this.type = (obj && obj.type) || null;
    this.geometry = (obj && obj.geometry) || null;
    this.properties = (obj && obj.properties) || null;
    this.isDeleted = (obj && obj.isDeleted) || null;
    this.applicationID = (obj && obj.type) || null;
  }
}
