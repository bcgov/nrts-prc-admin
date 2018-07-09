import { Router, ActivatedRoute, Params } from '@angular/router';
import { ChangeDetectorRef, ChangeDetectionStrategy, Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/map';
import * as L from 'leaflet';
import * as _ from 'lodash';

import { Application } from 'app/models/application';
import { Organization } from 'app/models/organization';
import { Search, SearchTerms } from 'app/models/search';
import { ApplicationService } from 'app/services/application.service';
import { SearchService } from 'app/services/search.service';
import { DialogService } from 'ng2-bootstrap-modal';
import { SelectOrganizationComponent } from 'app/applications/select-organization/select-organization.component';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('visibility', [
      transition(':enter', [   // :enter is alias to 'void => *'
        animate('0.2s 0s', style({ opacity: 1 }))
      ]),
      transition(':leave', [   // :leave is alias to '* => void'
        animate('0.2s 0.75s', style({ opacity: 0 }))
      ])
    ])
  ]
})

export class SearchComponent implements OnInit, OnDestroy {
  results: Search;
  groupByResults: Array<any>;
  page: number;
  limit: number;
  count: number;
  noMoreResults: boolean;
  ranSearch: boolean;
  applications: Array<Application>;
  organizations: Array<Organization>;
  applicationArray: Array<string>;
  protoSearchActive: boolean;
  showAdvancedFields: boolean;
  public loading: boolean;
  params: Params;
  terms: SearchTerms;
  myApplications: Array<any>;
  map: L.Map;
  fg: L.FeatureGroup;
  layerGroups: L.FeatureGroup[];
  layers: L.Layer[];
  tileLayers: L.TileLayer[];
  baseMaps: {};
  control: L.Control;
  private ngUnsubscribe: Subject<boolean> = new Subject<boolean>();
  private maxZoom = { maxZoom: 17 };

  constructor(
    private applicationService: ApplicationService,
    private dialogService: DialogService,
    private searchService: SearchService,
    private _changeDetectionRef: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.limit = 15;
  }

  ngOnInit() {
    this.noMoreResults = true;
    this.ranSearch = false;
    this.showAdvancedFields = false;
    this.loading = false;

    if (!this.tileLayers) {
      this.tileLayers = [];
    }
    const World_Topo_Map = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    });
    const World_Imagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });
    const OpenMapSurfer_Roads = L.tileLayer('https://korona.geog.uni-heidelberg.de/tiles/roads/x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    const Esri_OceanBasemap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
      maxZoom: 13
    });
    const Esri_NatGeoWorldMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
      maxZoom: 16
    });
    this.map = L.map('map', {
      layers: [World_Imagery]
    });
    this.map.setView(new L.LatLng(53.7267, -127.6476), 5);

    // set up the controls
    this.baseMaps = {
      'Ocean Base': Esri_OceanBasemap,
      'Nat Geo World Map': Esri_NatGeoWorldMap,
      'Open Surfer Roads': OpenMapSurfer_Roads,
      'World Topographic': World_Topo_Map,
      'World Imagery': World_Imagery
    };

    if (!this.layers) {
      this.layers = [];
    }

    this.route.params
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        (params: Params) => {
          /*
            TBD: Deal with meta search terms?
              this.params.type
              this.params.page
              this.params.limit
          */
          this.params = params;
          this.terms = new SearchTerms();

          if (this.params.clfile) {
            this.terms.clfile = this.params.clfile.split(',').join(' ');
          }

          // Force change detection since we changed a bound property after the normal check cycle and outside anything
          // that would trigger a CD cycle - this will eliminate the error you get when running in dev mode.
          this._changeDetectionRef.detectChanges();

          if (!_.isEmpty(this.terms.getParams())) {
            this.doSearch(true);
          }
        }
      );
  }

  showClientInformation(item: any) {
    let dispId: number = null;

    if (item && item.properties && item.properties.DISPOSITION_TRANSACTION_SID) {
      dispId = item.properties.DISPOSITION_TRANSACTION_SID;
    }

    this.dialogService.addDialog(SelectOrganizationComponent,
      {
        dispositionId: dispId,
        clientListing: true
      }, {
        backdropColor: 'rgba(0, 0, 0, 0.5)'
      })
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        clientString => {
          // Do nothing, this is client listing only.
        },
        error => {
          console.log('error =', error);
        }
      );
  }

  importProject(item: any) {
    // save application properties from search results
    if (item.properties) {
      // cached data
      item.purpose = item.properties.TENURE_PURPOSE;
      item.subpurpose = item.properties.TENURE_SUBPURPOSE;
      item.type = item.properties.TENURE_TYPE;
      item.subtype = item.properties.TENURE_SUBTYPE;
      item.status = item.properties.TENURE_STATUS;
      item.tenureStage = item.properties.TENURE_STAGE;
      item.location = item.properties.TENURE_LOCATION;
      item.businessUnit = item.properties.RESPONSIBLE_BUSINESS_UNIT;
      // these are special
      // we will persist them to db as search keys
      item.cl_file = +item.properties.CROWN_LANDS_FILE; // NOTE: unary operator
      item.tantalisID = item.properties.DISPOSITION_TRANSACTION_SID;
    }

    // add the application
    // on success go to edit page
    this.applicationService.add(item)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(application => {
        this.router.navigate(['/a', application._id]);
      });
  }

  toggleAdvancedSearch() {
    this.showAdvancedFields = !this.showAdvancedFields;
  }

  doSearch(firstSearch: boolean) {
    this.loading = true;
    this.ranSearch = true;

    if (firstSearch) {
      this.page = 0;
      this.count = 0;
      this.results = null;
      this.groupByResults = [];
      this.noMoreResults = false;
    } else {
      this.page += 1;
    }

    this.searchService.getByCLFile(this.terms.clfile)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        data => {
          this.loading = false;
          // This outputs the value of data to the web console.
          this.results = data;

          const self = this;

          this.groupByResults = [];
          const groupedFeatures = _.groupBy(data.features, 'properties.DISPOSITION_TRANSACTION_SID');

          _.each(groupedFeatures, function (value: any, key) {
            if (_.includes(data.sidsFound, key)) {
              value[0].isImported = true;
            }
            self.groupByResults.push(value[0]);
          });

          self.layerGroups = [];
          // Create the FG for all the layers found in this search.
          if (self.fg) {
            self.map.removeControl(self.control);
            _.each(self.layers, function (layer) {
              self.map.removeLayer(layer);
            });
            self.fg.clearLayers();
          } else {
            self.fg = L.featureGroup();
          }
          const overlayMaps: { [k: string]: any } = {};

          _.each(this.results.features, function (feature) {
            const f = JSON.parse(JSON.stringify(feature));
            // Needed to be valid GeoJSON
            delete f.geometry_name;
            const featureObj: GeoJSON.Feature<any> = f;
            const layer = L.geoJSON(featureObj);
            self.layers.push(layer);
            const options = { maxWidth: 400 };
            const content = '<h3>' + featureObj.properties.TENURE_TYPE
              + '<br />'
              + featureObj.properties.TENURE_SUBTYPE + '</h3>'
              + '<strong>ShapeID: </strong>' + featureObj.properties.INTRID_SID
              + '<br />'
              + '<strong>Disposition: </strong>' + featureObj.properties.DISPOSITION_TRANSACTION_SID
              + '<br />'
              + '<strong>Purpose: </strong>' + featureObj.properties.TENURE_PURPOSE
              + '<br />'
              + '<strong>Sub Purpose: </strong>' + featureObj.properties.TENURE_SUBPURPOSE
              + '<br />'
              + '<strong>Stage: </strong>' + featureObj.properties.TENURE_STAGE
              + '<br />'
              + '<strong>Status: </strong>' + featureObj.properties.TENURE_STATUS
              + '<br />'
              + '<strong>Hectares: </strong>' + featureObj.properties.TENURE_AREA_IN_HECTARES
              + '<br />'
              + '<br />'
              + '<strong>Legal Description: </strong>' + featureObj.properties.TENURE_LEGAL_DESCRIPTION;
            const popup = L.popup(options).setContent(content);
            layer.bindPopup(popup);
            self.fg.addLayer(layer);
            const dispLabel = '<strong>Disposition ID:</strong> ' + featureObj.properties.DISPOSITION_TRANSACTION_SID + '</span>';
            if (!!self.layerGroups[dispLabel]) {
              // Already exists as a FG.
            } else {
              self.layerGroups[dispLabel] = new L.FeatureGroup();
            }
            self.layerGroups[dispLabel].addLayer(layer);
          });

          // Add the layergroups to the map.
          _.forOwn(self.layerGroups, function (value, key) {
            overlayMaps[key] = self.layerGroups[key];
            self.layerGroups[key].addTo(self.map);
          });

          self.control = L.control.layers(self.baseMaps, overlayMaps, { collapsed: false }).addTo(self.map);

          self.map.fitBounds(self.fg.getBounds(), self.maxZoom);

          if (self.groupByResults) {
            this.count = self.groupByResults.length;
          }

          // Force change detection since we changed a bound property after the normal check cycle and outside anything
          // that would trigger a CD cycle - this will eliminate the error you get when running in dev mode.
          this._changeDetectionRef.detectChanges();
        },
        error => {
          this.loading = false;
          console.log(error);
        });
  }

  onSubmit() {
    this.router.navigate(['search', this.terms.getParams()]);
  }

  loadMore() {
    this.doSearch(false);
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
