import * as _ from 'lodash';

export class Document {
  _id: string;
  _addedBy: string;
  _application: string; // objectid -> Application
  _decision: string; // objectid -> Decision
  _comment: string; // objectid -> Comment
  documentFileName: string;
  displayName: string;
  internalURL: string;
  isDeleted: boolean;
  internalMime: string;

  isPublished = false; // depends on tags; see below

  constructor(obj?: any) {
    this._id = (obj && obj._id) || null;
    this._addedBy = (obj && obj._addedBy) || null;
    this._application = (obj && obj._application) || null;
    this._decision = (obj && obj._decision) || null;
    this._comment = (obj && obj._comment) || null;
    this.documentFileName = (obj && obj.documentFileName) || null;
    this.displayName = (obj && obj.displayName) || null;
    this.internalURL = (obj && obj.internalURL) || null;
    this.isDeleted = (obj && obj.isDeleted) || null;
    this.internalMime = (obj && obj.internalMime) || null;

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
