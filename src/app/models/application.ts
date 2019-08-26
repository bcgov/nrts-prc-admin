import * as _ from 'lodash';
import { CommentPeriod } from './commentperiod';
import { Decision } from './decision';
import { Document } from './document';
import { Feature } from './feature';
import { ConstantUtils, CodeType } from 'app/utils/constants/constantUtils';
import { ICodeGroup } from 'app/utils/constants/interfaces';

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

  // Non-database fields that may be manually added to this object for convenience.
  region: string;
  cpStatus: ICodeGroup;
  cpStatusStringLong: string;
  clFile: string;
  applicants: string;
  retireDate: Date = null;
  isRetired = false;
  isPublished = false;
  numComments: number;

  // Associated data from other database collections
  currentPeriod: CommentPeriod = null;
  decision: Decision = null;
  documents: Document[] = [];
  features: Feature[] = [];

  constructor(obj?: any) {
    // Database fields.

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

    if (obj && obj.currentPeriod) {
      this.currentPeriod = new CommentPeriod(obj.currentPeriod);
    }

    if (obj && obj.decision) {
      this.decision = new Decision(obj.decision);
    }

    if (obj && obj.documents) {
      for (const doc of obj.documents) {
        this.documents.push(doc);
      }
    }

    if (obj && obj.features) {
      for (const feature of obj.features) {
        this.features.push(feature);
      }
    }

    // Non-database fields that may be manually added to this object for convenience.

    this.region = (obj && obj.businessUnit && ConstantUtils.getTextLong(CodeType.REGION, obj.businessUnit)) || null;
    this.cpStatus = (obj && obj.cpStatus) || null;
    this.cpStatusStringLong = (obj && obj.cpStatusStringLong) || null;
    this.clFile = (obj && obj.clFile) || null;
    this.applicants = (obj && obj.applicants) || null;
    this.isRetired = (obj && obj.isRetired) || null;
    if (obj && obj.retireDate) {
      this.retireDate = new Date(obj.retireDate);
    }
    if (obj && obj.tags) {
      // isPublished is based on the presence of the 'public' tag
      for (const tag of obj.tags) {
        if (_.includes(tag, 'public')) {
          this.isPublished = true;
          break;
        }
      }
    }
    this.numComments = (obj && obj.numComments) || null;
  }
}
