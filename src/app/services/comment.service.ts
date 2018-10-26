import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/of';
import * as _ from 'lodash';

import { ApiService } from './api';
import { CommentPeriodService } from './commentperiod.service';
import { DocumentService } from './document.service';
import { Comment } from 'app/models/comment';

@Injectable()
export class CommentService {
  readonly accepted = 'Accepted';
  readonly pending = 'Pending';
  readonly rejected = 'Rejected';

  // for caching
  private comment: Comment = null;

  constructor(
    private api: ApiService,
    private commentPeriodService: CommentPeriodService,
    private documentService: DocumentService
  ) { }

  // get count of comments for the specified application id
  getCountByApplicationId(appId: string): Observable<number> {
    // first get the comment periods
    return this.commentPeriodService.getAllByApplicationId(appId)
      .mergeMap(periods => {
        if (periods.length === 0) {
          return Observable.of(0);
        }

        // count comments for first comment period only
        return this.getCountByPeriodId(periods[0]._id);

        // FUTURE: this code is for multiple comment periods
        // const promises: Array<Promise<any>> = [];

        // // now get the counts for all periods
        // periods.forEach(period => {
        //   promises.push(this.getCountByPeriodId(period._id).toPromise());
        // });

        // return Promise.all(promises)
        //   .then((allCounts: number[]) => {
        //     return allCounts.reduce((total, num) => { return total + num; });
        //   });
      })
      .catch(this.api.handleError);
  }

  // get count of comments for the specified comment period id
  // TODO: count only pending comments? (need comment status)
  getCountByPeriodId(periodId: string): Observable<number> {
    return this.api.getCommentsByPeriodIdNoFields(periodId)
      .map(res => {
        const comments = res.text() ? res.json() : [];
        comments.forEach((comment, i) => {
          comments[i] = new Comment(comment);
        });
        return comments.length;
      })
      .catch(this.api.handleError);
  }

  // get all comments for the specified application id
  // (including documents)
  getAllByApplicationId(appId: string, pageNum: number = 0, pageSize: number = 10, sortBy: string = null): Observable<Comment[]> {
    // first get the comment periods
    return this.commentPeriodService.getAllByApplicationId(appId)
      .mergeMap(periods => {
        if (periods.length === 0) {
          return Observable.of([] as Comment[]);
        }

        // get comments for first comment period only
        return this.getAllByPeriodId(periods[0]._id, pageNum, pageSize, sortBy);

        // FUTURE: this code is for multiple comment periods
        // const promises: Array<Promise<any>> = [];

        // // now get the comments for all periods
        // periods.forEach(period => {
        //   promises.push(this.getAllByPeriodId(period._id, pageNum, pageSize).toPromise());
        // });

        // return Promise.all(promises)
        //   .then((allComments: Comment[][]) => {
        //     return _.flatten(allComments);
        //   });
      })
      .catch(this.api.handleError);
  }

  // get all comments for the specified comment period id
  // (including documents)
  getAllByPeriodId(periodId: string, pageNum: number = 0, pageSize: number = 10, sortBy: string = null): Observable<Comment[]> {
    return this.api.getCommentsByPeriodId(periodId, pageNum, pageSize, sortBy)
      .map(res => {
        const comments = res.text() ? res.json() : [];
        comments.forEach((comment, i) => {
          comments[i] = new Comment(comment);
        });
        return comments;
      })
      .mergeMap(comments => {
        if (comments.length === 0) {
          return Observable.of([] as Comment[]);
        }

        const promises: Array<Promise<any>> = [];

        comments.forEach(comment => {
          // replace \\n (JSON format) with newlines
          if (comment.comment) {
            comment.comment = comment.comment.replace(/\\n/g, '\n');
          }
          if (comment.review && comment.review.reviewerNotes) {
            comment.review.reviewerNotes = comment.review.reviewerNotes.replace(/\\n/g, '\n');
          }

          // get the documents
          promises.push(this.documentService.getAllByCommentId(comment._id)
            .toPromise()
            .then(documents => comment.documents = documents)
          );
        });

        return Promise.all(promises).then(() => { return comments; });
      })
      .catch(this.api.handleError);
  }

  // get a specific comment by its id
  // (including documents)
  getById(commentId: string, forceReload: boolean = false): Observable<Comment> {
    if (this.comment && this.comment._id === commentId && !forceReload) {
      return Observable.of(this.comment);
    }

    // first get the comment data
    return this.api.getComment(commentId)
      .map(res => {
        const comments = res.text() ? res.json() : [];
        // return the first (only) comment
        return comments.length > 0 ? new Comment(comments[0]) : null;
      })
      .mergeMap(comment => {
        if (!comment) {
          return Observable.of(null as Comment);
        }

        // replace \\n (JSON format) with newlines
        if (comment.comment) {
          comment.comment = comment.comment.replace(/\\n/g, '\n');
        }
        if (comment.review && comment.review.reviewerNotes) {
          comment.review.reviewerNotes = comment.review.reviewerNotes.replace(/\\n/g, '\n');
        }

        // now get the comment documents
        const promise = this.documentService.getAllByCommentId(comment._id)
          .toPromise()
          .then(documents => comment.documents = documents);

        return Promise.resolve(promise).then(() => {
          this.comment = comment;
          return this.comment;
        });
      })
      .catch(this.api.handleError);
  }

  add(orig: Comment): Observable<Comment> {
    // make a (deep) copy of the passed-in comment so we don't change it
    const comment = _.cloneDeep(orig);

    // ID must not exist on POST
    delete comment._id;

    // don't send documents
    delete comment.documents;

    // replace newlines with \\n (JSON format)
    if (comment.comment) {
      comment.comment = comment.comment.replace(/\n/g, '\\n');
    }
    if (comment.review && comment.review.reviewerNotes) {
      comment.review.reviewerNotes = comment.review.reviewerNotes.replace(/\n/g, '\\n');
    }

    return this.api.addComment(comment)
      .map(res => {
        const c = res.text() ? res.json() : null;
        return c ? new Comment(c) : null;
      })
      .catch(this.api.handleError);
  }

  save(orig: Comment): Observable<Comment> {
    // make a (deep) copy of the passed-in comment so we don't change it
    const comment = _.cloneDeep(orig);

    // don't send documents
    delete comment.documents;

    // replace newlines with \\n (JSON format)
    if (comment.comment) {
      comment.comment = comment.comment.replace(/\n/g, '\\n');
    }
    if (comment.review && comment.review.reviewerNotes) {
      comment.review.reviewerNotes = comment.review.reviewerNotes.replace(/\n/g, '\\n');
    }

    return this.api.saveComment(comment)
      .map(res => {
        const c = res.text() ? res.json() : null;
        return c ? new Comment(c) : null;
      })
      .catch(this.api.handleError);
  }

  publish(comment: Comment): Observable<Comment> {
    return this.api.publishComment(comment)
      .map(res => {
        const c = res.text() ? res.json() : null;
        return c ? new Comment(c) : null;
      })
      .catch(this.api.handleError);
  }

  unPublish(comment: Comment): Observable<Comment> {
    return this.api.unPublishComment(comment)
      .map(res => {
        const c = res.text() ? res.json() : null;
        return c ? new Comment(c) : null;
      })
      .catch(this.api.handleError);
  }

  isAccepted(comment: Comment): boolean {
    return comment && comment.commentStatus && comment.commentStatus.toLowerCase() === this.accepted.toLowerCase();
  }

  isPending(comment: Comment): boolean {
    return comment && comment.commentStatus && comment.commentStatus.toLowerCase() === this.pending.toLowerCase();
  }

  isRejected(comment: Comment): boolean {
    return comment && comment.commentStatus && comment.commentStatus.toLowerCase() === this.rejected.toLowerCase();
  }

  doAccept(comment: Comment): Comment {
    comment.commentStatus = this.accepted;
    return comment;
  }

  doPending(comment: Comment): Comment {
    comment.commentStatus = this.pending;
    return comment;
  }

  doReject(comment: Comment): Comment {
    comment.commentStatus = this.rejected;
    return comment;
  }
}
