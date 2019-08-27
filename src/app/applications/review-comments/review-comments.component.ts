import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as moment from 'moment';
import * as _ from 'lodash';

import { Application } from 'app/models/application';
import { Comment } from 'app/models/comment';
import { CommentService } from 'app/services/comment.service';
import { ExportService } from 'app/services/export.service';

class SortKey {
  innerHTML: string;
  value: string;
}

@Component({
  selector: 'app-review-comments',
  templateUrl: './review-comments.component.html',
  styleUrls: ['./review-comments.component.scss']
})
export class ReviewCommentsComponent implements OnInit, OnDestroy {
  readonly PAGE_SIZE = 20;

  @ViewChild('commentListScrollContainer', { read: ElementRef })
  public commentListScrollContainer: ElementRef;

  readonly sortKeys: SortKey[] = [
    { innerHTML: 'Oldest', value: '%2BdateAdded' },
    { innerHTML: 'Newest', value: '-dateAdded' },
    { innerHTML: 'Name (A-Z)', value: '%2BcontactName' },
    { innerHTML: 'Name (Z-A)', value: '-contactName' }
  ];

  public loading = false;
  public application: Application = null;
  public comments: Comment[] = [];
  public alerts: string[] = [];
  public currentComment: Comment;
  public pageCount = 1; // in case getCount() fails
  public pageNum = 1; // first page
  public sortBy = this.sortKeys[1].value; // initial sort is by descending date

  // see official solution:
  // https://stackoverflow.com/questions/38008334/angular-rxjs-when-should-i-unsubscribe-from-subscription
  // or http://brianflove.com/2016/12/11/anguar-2-unsubscribe-observables/
  private ngUnsubscribe: Subject<boolean> = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private commentService: CommentService,
    private exportService: ExportService
  ) {}

  ngOnInit() {
    // get data from route resolver
    this.route.data.pipe(takeUntil(this.ngUnsubscribe)).subscribe((data: { application: Application }) => {
      if (data.application) {
        this.application = data.application;

        this.commentService
          .getCountByPeriodId(this.application.meta.currentPeriod._id)
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe(value => {
            this.pageCount = value ? Math.ceil(value / this.PAGE_SIZE) : 1;
            // get initial data
            this.getData();
          });
      } else {
        alert("Uh-oh, couldn't load application");
        // application not found --> navigate back to search
        this.router.navigate(['/search']);
      }
    });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  getData() {
    if (this.application) {
      // safety check
      this.loading = true;
      this.commentListScrollContainer.nativeElement.scrollTop = 0;

      // get a page of comments
      this.commentService
        .getAllByApplicationId(this.application._id, this.pageNum - 1, this.PAGE_SIZE, this.sortBy, {
          getDocuments: true
        })
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(
          comments => {
            this.loading = false;
            this.comments = comments;

            // pre-select the first comment
            if (this.comments.length > 0) {
              this.setCurrentComment(this.comments[0]);
            }
          },
          error => {
            this.loading = false;
            // if 403, redir to login page
            if (error && error.status === 403) {
              this.router.navigate(['/login']);
            }
            this.alerts.push('Error loading comments');
          }
        );
    }
  }

  prevPage() {
    this.pageNum--;
    this.getData();
  }

  nextPage() {
    this.pageNum++;
    this.getData();
  }

  setCurrentComment(item: Comment) {
    const index = _.findIndex(this.comments, { _id: item._id });
    if (index >= 0) {
      this.comments.splice(index, 1, item);
      this.currentComment = item;
    }
  }

  isCurrentComment(item: Comment): boolean {
    return item === this.currentComment;
  }

  exportToExcel() {
    // get all comments
    this.commentService
      .getAllByApplicationId(this.application._id, 0, 1000000, null, { getDocuments: true }) // max 1M records
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        comments => {
          // FUTURE: instead of flattening, copy to new 'export object' with user-friendly keys?
          const flatComments = comments.map(comment => {
            // sanitize and flatten each comment object
            delete comment._commentPeriod;
            delete comment.commentNumber;
            // sanitize documents
            comment.documents.forEach(document => {
              delete document._id;
              delete document._addedBy;
              delete document._application;
              delete document._decision;
              delete document._comment;
              delete document.internalURL;
              delete document.internalMime;
              delete document.isDeleted;
            });
            // add necessary properties
            // comment.meta.applicants = this.application.meta.applicants; // FUTURE
            comment['cl_file'] = this.application.meta.clFile;
            return this.flatten_fastest(comment);
          });

          const excelFileName =
            'comments-' + this.application.meta.applicants.replace(/\s/g, '_') + moment(new Date()).format('-YYYYMMDD');
          const columnOrder: string[] = [
            'cl_file',
            '_id',
            '_addedBy',
            'dateAdded',
            'commentAuthor.contactName',
            'commentAuthor.orgName',
            'commentAuthor.location',
            'commentAuthor.requestedAnonymous',
            'commentAuthor.internal.email',
            'commentAuthor.internal.phone',
            'comment',
            'review.reviewerDate',
            'review.reviewerNotes',
            'commentStatus',
            'isPublished'
            // document columns go here
          ];
          this.exportService.exportAsExcelFile(flatComments, excelFileName, columnOrder);
        },
        error => console.log('error =', error)
      );
  }

  //
  // flatten utilities
  // ref: https://stackoverflow.com/questions/19098797/fastest-way-to-flatten-un-flatten-nested-json-objects
  //

  // current fastest
  private flatten_fastest(data: object): object {
    const result = {};

    function recurse(cur: object, prop: string) {
      if (Object(cur) !== cur) {
        result[prop] = cur;
      } else if (Array.isArray(cur)) {
        const l = cur.length;
        for (let i = 0; i < l; i++) {
          recurse(cur[i], prop ? prop + '.' + i : '' + i);
        }
        if (l === 0) {
          // result[prop] = []; // ignore empty arrays
        }
      } else {
        let isEmpty = true;
        for (const p of Object.keys(cur)) {
          isEmpty = false;
          recurse(cur[p], prop ? prop + '.' + p : p);
        }
        if (isEmpty) {
          result[prop] = {};
        }
      }
    }

    recurse(data, '');
    return result;
  }

  // ES6 version
  // NB: doesn't return empty arrays
  private flatten_es6(obj: object, path: string = ''): object {
    if (!(obj instanceof Object)) {
      return { [path.replace(/\.$/g, '')]: obj };
    }
    return Object.keys(obj).reduce((output, key) => {
      return obj instanceof Array
        ? { ...output, ...this.flatten_es6(obj[key], path + '[' + key + '].') }
        : { ...output, ...this.flatten_es6(obj[key], path + key + '.') };
    }, {});
  }
}
