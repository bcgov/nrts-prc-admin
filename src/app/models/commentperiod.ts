import * as _ from 'lodash';

export class CommentPeriod {
  // Database fields
  _id: string;
  _addedBy: string;
  _application: string;
  startDate: Date = null;
  endDate: Date = null;

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
    daysRemaining: number;
  } = {
    isPublished: false,
    daysRemaining: null
  };

  constructor(obj?: any) {
    // Database fields
    this._id = (obj && obj._id) || null;
    this._addedBy = (obj && obj._addedBy) || null;
    this._application = (obj && obj._application) || null;

    if (obj && obj.startDate) {
      this.startDate = new Date(obj.startDate);
    }

    if (obj && obj.endDate) {
      this.endDate = new Date(obj.endDate);
    }

    // Non-database fields that may be manually added to this object for convenience

    if (obj && obj.tags) {
      // isPublished is based on the presence of the 'public' tag
      for (const tag of obj.tags) {
        if (_.includes(tag, 'public')) {
          this.meta.isPublished = true;
          break;
        }
      }
    }
    this.meta.daysRemaining = (obj && obj.meta && obj.meta.daysRemaining) || null;
  }
}
