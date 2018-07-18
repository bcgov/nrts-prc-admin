import { NgModule } from '@angular/core';
// import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { MatSlideToggleModule } from '@angular/material';

import { OrderByPipe } from 'app/pipes/order-by.pipe';
import { NewlinesPipe } from 'app/pipes/newlines.pipe';
import { PublishedPipe } from 'app/pipes/published.pipe';
import { ObjectFilterPipe } from 'app/pipes/object-filter.pipe';

import { FileUploadComponent } from 'app/file-upload/file-upload.component';

import { VarDirective } from 'app/utils/ng-var.directive';

@NgModule({
  imports: [
    // CommonModule,
    BrowserModule,
    MatSlideToggleModule
  ],
  declarations: [
    OrderByPipe,
    NewlinesPipe,
    PublishedPipe,
    ObjectFilterPipe,
    FileUploadComponent,
    VarDirective
  ],
  exports: [
    MatSlideToggleModule,
    OrderByPipe,
    NewlinesPipe,
    PublishedPipe,
    FileUploadComponent,
    VarDirective
  ]
})

export class SharedModule { }
