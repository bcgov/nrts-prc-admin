import * as _ from 'lodash';
import { Document } from './document';

export class Decision {
  // Database fields
  _id: string;
  _addedBy: string;
  _application: string; // objectid -> Application
  name: string;

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
    isPublished: boolean;

    // Associated data from other database collections
    documents: Document[];
  } = {
    isPublished: false,

    documents: []
  };

  constructor(obj?: any) {
    // Database fields
    this._id = (obj && obj._id) || null;
    this._addedBy = (obj && obj._addedBy) || null;
    this._application = (obj && obj._application) || null;
    this.name = (obj && obj.name) || null;

    if (obj && obj.meta && obj.meta.documents) {
      for (const doc of obj.meta.documents) {
        this.meta.documents.push(doc);
      }
    }

    // Non-database fields that may be manually added to this object for convenience.

    if (obj && obj.tags) {
      // isPublished is based on the presence of the 'public' tag
      for (const tag of obj.tags) {
        if (_.includes(tag, 'public')) {
          this.meta.isPublished = true;
          break;
        }
      }
    }
  }
}
