import * as _ from 'lodash';

export class Document {
  // Database fields
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

  /**
   * This field, and its internals, are not part of the database model.
   *
   * They are included here as a convenient way to store various bits of data that we don't keep in the database, but
   * which get used by the app in multiple places.  This way, we don't need to generate them repeatedly.
   *
   * Example: the isPublished field is just a boolean generated based on the presence of the 'public' tag.
   *
   * @memberof Application
   */
  meta: {
    isPublished: boolean;
  } = {
    isPublished: false
  };

  constructor(obj?: any) {
    // Database fields
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

    // Non-database fields that may be manually added to this object for convenience

    if (obj && obj.tags) {
      for (const tag of obj.tags) {
        if (_.includes(tag, 'public')) {
          this.meta.isPublished = true;
          break;
        }
      }
    }
  }
}
