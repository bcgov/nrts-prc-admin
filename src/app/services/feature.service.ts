import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ApiService } from './api';
import { Feature } from 'app/models/feature';

import * as _ from 'lodash';

@Injectable()
export class FeatureService {
  constructor(private api: ApiService) {}

  getByTantalisId(tantalisId: number): Observable<Feature[]> {
    return this.api.getFeaturesByTantalisId(tantalisId).pipe(
      map(res => {
        if (res && res.length > 0) {
          const features: Feature[] = [];
          res.forEach(f => {
            features.push(new Feature(f));
          });
          return features;
        }
        return [];
      }),
      catchError(error => this.api.handleError(error))
    );
  }

  getByApplicationId(applicationId: string): Observable<Feature[]> {
    return this.api.getFeaturesByApplicationId(applicationId).pipe(
      map(res => {
        if (res && res.length > 0) {
          const features: Feature[] = [];
          res.forEach(f => {
            features.push(new Feature(f));
          });
          return features;
        }
        return [];
      }),
      catchError(error => this.api.handleError(error))
    );
  }

  deleteByApplicationId(applicationId: string): Observable<object> {
    return this.api.deleteFeaturesByApplicationId(applicationId).pipe(catchError(error => this.api.handleError(error)));
  }

  add(originalFeature: Feature): Observable<Feature> {
    const feature = _.cloneDeep(originalFeature);

    delete feature._id;
    delete feature.isDeleted;

    return this.api.addFeature(feature).pipe(catchError(error => this.api.handleError(error)));
  }

  save(originalFeature: Feature): Observable<Feature> {
    const feature = _.cloneDeep(originalFeature);

    return this.api.saveFeature(feature).pipe(catchError(error => this.api.handleError(error)));
  }

  // MBL TODO: PUT/POST functionality.

  // TODO: publish/unpublish functionality
}
