import * as _ from 'lodash';
import { CommentPeriod } from './commentperiod';
import { Decision } from './decision';
import { Document } from './document';
import { Feature } from './feature';
import { ConstantUtils, CodeType } from 'app/utils/constants/constantUtils';

export class Application {
  // Database fields
  _id: string;
  agency: string;
  areaHectares: number;
  businessUnit: string;
  centroid: number[] = []; // [lng, lat]
  cl_file: number;
  client: string;
  description: string = null;
  legalDescription: string = null;
  location: string;
  name: string;
  createdDate: Date = null;
  publishDate: Date = null;
  purpose: string;
  status: string;
  reason: string;
  subpurpose: string;
  subtype: string;
  tantalisID: number;
  tenureStage: string;
  type: string;
  statusHistoryEffectiveDate: Date = null;
  tags: string[] = [];

  /**
   * This field, and its internals, are not part of the database model.
   *
   * They are included here as a convenient way to store various bits of data that we don't keep in the database, but
   * which get used by the app in multiple places.  This way, we don't need to generate them repeatedly.
   *
   * Example: the region field is just a user friendly version of the businessUnit.
   *
   * @memberof Application
   */
  meta: {
    region: string;
    cpStatusStringLong: string;
    clFile: string;
    applicants: string;
    retireDate: Date;
    isRetired: boolean;
    isPublished: boolean;
    numComments: number;
    isCreated: boolean;

    // Associated data from other database collections
    currentPeriod: CommentPeriod;
    decision: Decision;
    documents: Document[];
    features: Feature[];
  } = {
    region: '',
    cpStatusStringLong: '',
    clFile: '',
    applicants: '',
    retireDate: null,
    isRetired: false,
    isPublished: false,
    numComments: null,
    isCreated: false,

    currentPeriod: null,
    decision: null,
    documents: [],
    features: []
  };

  constructor(obj?: any) {
    // Database fields
    this._id = (obj && obj._id) || null;
    this.agency = (obj && obj.agency) || null;
    this.areaHectares = (obj && obj.areaHectares) || null;
    this.businessUnit = (obj && obj.businessUnit) || null;
    this.cl_file = (obj && obj.cl_file) || null;
    this.client = (obj && obj.client) || null;
    this.location = (obj && obj.location) || null;
    this.name = (obj && obj.name) || null;
    this.purpose = (obj && obj.purpose) || null;
    this.status = (obj && obj.status) || null;
    this.reason = (obj && obj.reason) || null;
    this.subpurpose = (obj && obj.subpurpose) || null;
    this.subtype = (obj && obj.subtype) || null;
    this.tantalisID = (obj && obj.tantalisID) || null; // not zero
    this.tenureStage = (obj && obj.tenureStage) || null;
    this.type = (obj && obj.type) || null;

    if (obj && obj.createdDate) {
      this.createdDate = new Date(obj.createdDate);
    }

    if (obj && obj.publishDate) {
      this.publishDate = new Date(obj.publishDate);
    }

    if (obj && obj.statusHistoryEffectiveDate) {
      this.statusHistoryEffectiveDate = new Date(obj.statusHistoryEffectiveDate);
    }

    if (obj && obj.description) {
      // replace \\n (JSON format) with newlines
      this.description = obj.description.replace(/\\n/g, '\n');
    }
    if (obj && obj.legalDescription) {
      // replace \\n (JSON format) with newlines
      this.legalDescription = obj.legalDescription.replace(/\\n/g, '\n');
    }

    if (obj && obj.centroid) {
      for (const num of obj.centroid) {
        this.centroid.push(num);
      }
    }

    if (obj && obj.tags) {
      for (const tag of obj.tags) {
        this.tags.push(tag);
      }
    }

    // Associated data from other database collections

    if (obj && obj.meta && obj.meta.currentPeriod) {
      this.meta.currentPeriod = new CommentPeriod(obj.meta.currentPeriod);
    }

    if (obj && obj.meta && obj.meta.decision) {
      this.meta.decision = new Decision(obj.meta.decision);
    }

    if (obj && obj.meta && obj.meta.documents) {
      for (const doc of obj.meta.documents) {
        this.meta.documents.push(doc);
      }
    }

    if (obj && obj.meta && obj.meta.features) {
      for (const feature of obj.meta.features) {
        this.meta.features.push(feature);
      }
    }

    // Non-database fields that may be manually added to this object for convenience.

    this.meta.region =
      (obj && obj.businessUnit && ConstantUtils.getTextLong(CodeType.REGION, obj.businessUnit)) || null;
    this.meta.cpStatusStringLong = (obj && obj.meta && obj.meta.cpStatusStringLong) || null;
    this.meta.clFile = (obj && obj.meta && obj.meta.clFile) || null;
    this.meta.applicants = (obj && obj.meta && obj.meta.applicants) || null;
    this.meta.isRetired = (obj && obj.meta && obj.meta.isRetired) || null;
    if (obj && obj.meta && obj.meta.retireDate) {
      this.meta.retireDate = new Date(obj.retireDate);
    }
    this.meta.isCreated = (obj && obj.meta && obj.meta.isCreated) || null;
    if (obj && obj.tags) {
      // isPublished is based on the presence of the 'public' tag
      for (const tag of obj.tags) {
        if (_.includes(tag, 'public')) {
          this.meta.isPublished = true;
          break;
        }
      }
    }
    this.meta.numComments = (obj && obj.numComments) || null;
  }
}
