import * as _ from 'lodash';
import { CommentPeriod } from './commentperiod';
import { Decision } from './decision';
import { Document } from './document';
import { Feature } from './feature';
import { ConstantUtils, CodeType } from 'app/utils/constants/constantUtils';

export class Application {
  // the following are retrieved from the API
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

  region: string;
  cpStatus: string; // user-friendly comment period status

  clFile: string;
  applicants: string;
  retireDate: Date = null;
  isRetired = false;
  isPublished = false; // depends on tags; see below

  // associated data
  currentPeriod: CommentPeriod = null;
  decision: Decision = null;
  documents: Document[] = [];
  features: Feature[] = [];

  constructor(obj?: any) {
    this._id = (obj && obj._id) || null;
    this.agency = (obj && obj.agency) || null;
    this.areaHectares = (obj && obj.areaHectares) || null;
    this.businessUnit = (obj && obj.businessUnit) || null;
    this.cl_file = (obj && obj.cl_file) || null;
    this.client = (obj && obj.client) || null;
    this.location = (obj && obj.location) || null;
    this.name = (obj && obj.name) || null;
    this.purpose = (obj && obj.purpose) || null;
    this.status = (obj && obj.status && ConstantUtils.getCode(CodeType.STATUS, obj.status)) || null;
    this.reason = (obj && obj.reason && ConstantUtils.getCode(CodeType.REASON, obj.reason)) || null;
    this.subpurpose = (obj && obj.subpurpose) || null;
    this.subtype = (obj && obj.subtype) || null;
    this.tantalisID = (obj && obj.tantalisID) || null; // not zero
    this.tenureStage = (obj && obj.tenureStage) || null;
    this.type = (obj && obj.type) || null;
    this.region = (obj && obj.businessUnit && ConstantUtils.getTextLong(CodeType.REGION, obj.businessUnit)) || null;
    this.cpStatus = (obj && obj.cpStatus) || null;
    this.clFile = (obj && obj.clFile) || null;
    this.applicants = (obj && obj.applicants) || null;
    this.isRetired = (obj && obj.isRetired) || null;

    if (obj && obj.publishDate) {
      this.publishDate = new Date(obj.publishDate);
    }

    if (obj && obj.statusHistoryEffectiveDate) {
      this.statusHistoryEffectiveDate = new Date(obj.statusHistoryEffectiveDate);
    }

    if (obj && obj.retireDate) {
      this.retireDate = new Date(obj.retireDate);
    }

    // replace \\n (JSON format) with newlines
    if (obj && obj.description) {
      this.description = obj.description.replace(/\\n/g, '\n');
    }
    if (obj && obj.legalDescription) {
      this.legalDescription = obj.legalDescription.replace(/\\n/g, '\n');
    }

    // copy centroid
    if (obj && obj.centroid) {
      for (const num of obj.centroid) {
        this.centroid.push(num);
      }
    }

    // copy tags
    if (obj && obj.tags) {
      for (const tag of obj.tags) {
        this.tags.push(tag);
      }
    }

    if (obj && obj.currentPeriod) {
      this.currentPeriod = new CommentPeriod(obj.currentPeriod);
    }

    if (obj && obj.decision) {
      this.decision = new Decision(obj.decision);
    }

    // copy documents
    if (obj && obj.documents) {
      for (const doc of obj.documents) {
        this.documents.push(doc);
      }
    }

    // copy features
    if (obj && obj.features) {
      for (const feature of obj.features) {
        this.features.push(feature);
      }
    }

    // wrap isPublished around the tags we receive for this object
    if (obj && obj.tags) {
      for (const tag of obj.tags) {
        if (_.includes(tag, 'public')) {
          this.isPublished = true;
          break;
        }
      }
    }
  }
}
