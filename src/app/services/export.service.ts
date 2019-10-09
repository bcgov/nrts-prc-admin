import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { Parser } from 'json2csv';
import * as _ from 'lodash';
import * as moment from 'moment';

/**
 * Service to generate and download an excel or csv file.
 *
 * @export
 * @class ExportService
 */
@Injectable()
export class ExportService {
  constructor() {}

  /**
   * Generates and downloads the given data as a csv file.
   *
   * @param {any[]} data array of objects
   * @param {string} fileName file name, not including extension
   * @param {string[]} [fields=[]] data fields include in csv, in order
   * @memberof ExportService
   */
  public exportAsCSV(data: any[], fileName: string, fields: any[] = []): void {
    const csvData: string = new Parser({ fields: fields }).parse(data);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${fileName}.csv`);
  }

  /**
   * Convenience method for converting an export date field to a formatted date string that is recognized by Excel as
   * a Date.
   *
   * Note: See www.npmjs.com/package/json2csv for details on what this function is supporting.
   *
   * @param {string} dateProperty the object property for the date (the key path, not the value). Can be the path to a
   *                              nested date field: 'some.nested.date'
   * @returns {(row) => string} a function that takes a row and returns a string
   * @memberof ListComponent
   */
  public getExportDateFormatter(dateProperty: string): (row) => string {
    return row => {
      const dateProp = _.get(row, dateProperty);

      if (!dateProp) {
        return null;
      }

      const date = moment(dateProp);

      if (!date.isValid()) {
        return dateProp;
      }

      return date.format('YYYY-MM-DD');
    };
  }

  /**
   * Convenience method for padding a value with 0's to at least 7 characters.
   * If the string is of length 7 or more to begin with, no padding is performed.
   *
   * Note: See www.npmjs.com/package/json2csv for details on what this function is supporting.
   *
   * @param {string} property the object property for a value (the key path, not the value). Can be the path to a
   *                          nested field: 'some.nested.value'
   * @returns {(row) => string} a function that takes a row and returns a string
   * @memberof ListComponent
   */
  public getExportPadStartFormatter(property: string): (row) => string {
    return row => {
      const prop = _.get(row, property);

      if (!prop) {
        return null;
      }

      return prop.toString().padStart(7, '0');
    };
  }
}
