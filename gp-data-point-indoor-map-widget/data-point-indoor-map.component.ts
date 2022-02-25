/**
 * Copyright (c) 2022 Software AG, Darmstadt, Germany and/or its licensors
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { IManagedObject } from '@c8y/client';
import {
  Datapoint,
  MapConfiguration,
  Measurement,
  WidgetConfiguration
} from './data-point-indoor-map.model';
import { DataPointIndoorMapService } from './data-point-indoor-map.service';
import { has, get } from 'lodash';
import { Router } from '@angular/router';

declare global {
  interface Window {
    L: any;
    h337: any;
  }
}

import 'leaflet2/dist/leaflet.js';
const L: any = window.L;
@Component({
  selector: 'data-point-indoor-map',
  templateUrl: 'data-point-indoor-map.component.html',
  styleUrls: ['./styles.less'],
  providers: [DataPointIndoorMapService],
  encapsulation: ViewEncapsulation.None
})
export class DataPointIndoorMapComponent implements OnInit, AfterViewInit {
  @Input() config: WidgetConfiguration;

  @ViewChild('IndoorDataPointMap', { read: ElementRef, static: true }) mapReference: ElementRef;

  private readonly MARKER_DEFAULT_COLOR = '#1776BF';

  private readonly KEY_LATEST_MEASUREMENT = 'latestPrimaryMeasurement';

  private readonly KEY_MEASUREMENTS = 'measurements';

  private readonly KEY_MAP_MARKER_INSTANCE = 'mapMarkerInstance';

  private readonly KEY_MAP_MARKER_POPUP_INSTANCE = 'mapMarkerPopupInstance';

  private currentFloorLevel = 0;

  private markerManagedObjectsForFloorLevel: { [deviceId: string]: IManagedObject }[] = [];

  private map;

  private mapConfiguration: MapConfiguration;

  private applicationBuilderAppId: string;

  constructor(private mapService: DataPointIndoorMapService, private router: Router) {}

  ngOnInit() {}

  async ngAfterViewInit(): Promise<void> {
    this.applicationBuilderAppId = this.mapService.getApplicationBuilderAppId();

    await this.loadMapConfiguration();
    await this.loadManagedObjectsForMarkers();
    await this.loadLatestPrimaryMeasurementForMarkers();

    this.initMeasurementUpdates();

    this.initMap();
    this.initMarkers();
    this.renderLegend();
  }

  /**
   * Load the map configuration which has been assigned to this widget.
   */
  private async loadMapConfiguration(): Promise<void> {
    this.mapConfiguration = await this.mapService.loadMapConfigurationWithImages(
      this.config.mapConfigurationId
    );
  }

  /**
   * Load the corresponding managed objects for all the markers which are
   * defined in the map configuration for each level. Store the managed objects
   * in a map with managed object id as key for each level to quickly access
   * them
   */
  private async loadManagedObjectsForMarkers(): Promise<void> {
    if (!this.mapConfiguration || !this.mapConfiguration.levels) {
      return;
    }

    const managedObjectsForFloorLevels = await this.mapService.loadMarkersForLevels(
      this.mapConfiguration.levels
    );

    managedObjectsForFloorLevels.forEach((managedObjectsForFloorLevel, index) => {
      let managedObjectsMap: { [deviceId: string]: IManagedObject } = {};
      managedObjectsForFloorLevel.forEach(
        managedObject => (managedObjectsMap[managedObject.id] = managedObject)
      );
      this.markerManagedObjectsForFloorLevel[index] = managedObjectsMap;
    });
  }

  /**
   * Load the latest primary measurement for all available markers on the
   * currently configured floor level. The latest measurement is stored as
   * a property on the corresponding managed object and used to initialize
   * the map markers and their colors based on the configured legend correctly.
   */
  private async loadLatestPrimaryMeasurementForMarkers(): Promise<void> {
    if (!this.isMarkersAvailableForCurrentFloorLevel()) {
      return;
    }

    const currentVisibleMarkerManagedObjects = this.markerManagedObjectsForFloorLevel[
      this.currentFloorLevel
    ];
    const deviceIds: string[] = Object.keys(currentVisibleMarkerManagedObjects);
    const measurements = await this.mapService.loadLatestMeasurements(
      deviceIds,
      this.config.measurement.fragment,
      this.config.measurement.series
    );

    deviceIds.forEach((deviceId, index) => {
      const managedObject = currentVisibleMarkerManagedObjects[deviceId];
      managedObject[this.KEY_LATEST_MEASUREMENT] = measurements[index];
    });
  }

  private initMeasurementUpdates(): void {
    if (!this.isMarkersAvailableForCurrentFloorLevel()) {
      return;
    }

    this.subscribeForMeasurementUpdates();
    this.listenToPrimaryMeasurementUpdates();
    this.listenToConfiguredMeasurementUpdates();
  }

  /**
   * subscribe for measurements (primary and configured measurements) for each device
   * which is available on the current floor level
   */
  private subscribeForMeasurementUpdates(): void {
    const deviceIds: string[] = Object.keys(
      this.markerManagedObjectsForFloorLevel[this.currentFloorLevel]
    );
    const datapoints: Datapoint[] = this.config.datapointsPopup.map(
      datapointPopup => datapointPopup.measurement
    );

    this.mapService.subscribeForMeasurements(deviceIds, this.config.measurement, datapoints);
  }

  /**
   * subscribe for primary measurements updates. For the received measurement its value
   * is used to color the map marker instance correctly based on the legend.
   */
  private listenToPrimaryMeasurementUpdates(): void {
    this.mapService.primaryMeasurementReceived$.subscribe(({ deviceId, measurement }) => {
      const markerManagedObject = this.markerManagedObjectsForFloorLevel[this.currentFloorLevel][
        deviceId
      ];
      if (!markerManagedObject) {
        return;
      }

      let mapMarkerInstance = markerManagedObject[this.KEY_MAP_MARKER_INSTANCE];
      if (!mapMarkerInstance) {
        return;
      }

      mapMarkerInstance.setStyle({ fillColor: this.getBackgroundColor(measurement) });
    });
  }

  /**
   * listen to updates for measurements, which should be displayed in the popup
   * for a corresponding map marker instance. Configure the popup based on the
   * received measurements
   */
  private listenToConfiguredMeasurementUpdates() {
    this.mapService.measurementReceived$.subscribe(({ deviceId, measurement }) => {
      const datapoint = `${measurement.datapoint.fragment}.${measurement.datapoint.series}`;
      const managedObject = this.markerManagedObjectsForFloorLevel[this.currentFloorLevel][
        deviceId
      ];

      if (!managedObject) {
        return;
      }

      managedObject[this.KEY_MEASUREMENTS] = Object.assign(
        !!managedObject[this.KEY_MEASUREMENTS] ? managedObject[this.KEY_MEASUREMENTS] : {},
        { [datapoint]: measurement }
      );

      const popup = managedObject[this.KEY_MAP_MARKER_POPUP_INSTANCE];
      if (popup) {
        popup.setContent(
          this.getPopupContent(managedObject, Object.values(managedObject[this.KEY_MEASUREMENTS]))
        );
      }
    });
  }

  /**
   * initialize the map based on the configured image for the current floor level.
   * Floor plan is positioned in the defined bounds.
   */
  private initMap(): void {
    const bounds = L.latLngBounds(
      this.mapConfiguration.levels[this.currentFloorLevel].imageDetails.corners
    );
    const imgBlobURL = URL.createObjectURL(
      this.mapConfiguration.levels[this.currentFloorLevel].blob
    );

    this.map = L.map(this.mapReference.nativeElement, {
      center: [0, 0],
      zoom: 20.25,
      zoomDelta: 0.25,
      zoomSnap: 0,
      maxBounds: bounds
    });

    L.imageOverlay(imgBlobURL, bounds, {
      opacity: 1,
      interactive: false,
      zIndex: -1000
    }).addTo(this.map);
  }

  /**
   * initialize the map markers for the current floor level
   */
  private initMarkers(): void {
    if (!this.isMarkersAvailableForCurrentFloorLevel()) {
      return;
    }

    this.addMarkersToLevel(
      Object.values(this.markerManagedObjectsForFloorLevel[this.currentFloorLevel])
    );
  }

  /**
   * create and add marker instances for the current floor level and add these
   * to the map. Register an event listener for click events to display the
   * corresponding popup with latest measurements.
   *
   * @param markerManagedObjects managed objects with geolocations, which should
   * be displayed on the map
   */
  private addMarkersToLevel(markerManagedObjects: IManagedObject[]): void {
    const markersLayer = L.featureGroup().addTo(this.map);
    markerManagedObjects.forEach(markerManagedObject => {
      if (!this.isGeolocationAvailable(markerManagedObject)) {
        return;
      }

      const circleMarkerInstance = this.createCircleMarkerInstance(markerManagedObject).addTo(
        markersLayer
      );
      circleMarkerInstance.on('click', event => {
        // load measurements for all configured datapoints
        if (!markerManagedObject[this.KEY_MEASUREMENTS]) {
          this.loadLatestMeasurements(markerManagedObject).then(() =>
            this.updatePopupInstanceContent(markerManagedObject)
          );
        }

        this.openPopupForMarkerInstance(markerManagedObject, event.target._latlng);
      });

      markerManagedObject[this.KEY_MAP_MARKER_INSTANCE] = circleMarkerInstance;
    });
  }

  /**
   * render the legend of the thresholds in case they have been defined in the configuration for the widget
   */
  private renderLegend(): void {
    if (
      !this.config.legend ||
      !this.config.legend.thresholds ||
      this.config.legend.thresholds.length === 0
    ) {
      return;
    }

    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = map => {
      const div = L.DomUtil.create('div', 'legend');

      if (this.config.legend.title) {
        div.innerHTML += `<h4>${this.config.legend.title}</h4>`;
      }

      this.config.legend.thresholds.forEach(threshold => {
        div.innerHTML += `<div class="entry"><i style="background: ${threshold.color}"></i><span>${
          threshold.label
        }</span ></div>`;
      });

      return div;
    };

    legend.addTo(this.map);
  }

  /**
   * creates a circle marker instance with background color depending on the
   * current primary measurement and the defined thresholds.
   *
   * @param managedObject
   * @returns circle marker instance
   */
  private createCircleMarkerInstance(managedObject: IManagedObject): any {
    return L.circleMarker(
      [get(managedObject, 'c8y_Position.lat'), get(managedObject, 'c8y_Position.lng')],
      {
        fillColor: this.getBackgroundColor(managedObject[this.KEY_LATEST_MEASUREMENT]),
        fillOpacity: 0.75,
        radius: 40,
        weight: 0,
        interactive: true
      }
    );
  }

  /**
   * display a popup if user clicked on a marker instance
   *
   * @param managedObject to which the popup should be related to
   * @param geolocation at which the popup should be displayed
   */
  private openPopupForMarkerInstance(managedObject: IManagedObject, geolocation: any) {
    const popup = this.createPopupInstance(managedObject, geolocation);
    popup.openOn(this.map);
    managedObject[this.KEY_MAP_MARKER_POPUP_INSTANCE] = popup;
  }

  /**
   * creates the popup instance
   *
   * @param managedObject to get name and measurements which should be displayed
   * @param geolocation at which the popup should be displayed
   * @returns instance of popup
   */
  private createPopupInstance(managedObject: IManagedObject, geolocation: any): any {
    const popup = L.popup({
      closeButton: true,
      autoClose: true,
      className: 'indoor-map-popup'
    });
    popup
      .setLatLng(geolocation)
      .setContent(
        this.getPopupContent(
          managedObject,
          !!managedObject[this.KEY_MEASUREMENTS]
            ? Object.values(managedObject[this.KEY_MEASUREMENTS])
            : []
        )
      );

    return popup;
  }

  /**
   * Updates the content of a popup assigned to the given managed object
   *
   * @param managedObject whose popup should be updated
   */
  private updatePopupInstanceContent(managedObject: IManagedObject): void {
    const popupInstance = managedObject[this.KEY_MAP_MARKER_POPUP_INSTANCE];

    if (!popupInstance) {
      return;
    }

    popupInstance.setContent(
      this.getPopupContent(
        managedObject,
        !!managedObject[this.KEY_MEASUREMENTS]
          ? Object.values(managedObject[this.KEY_MEASUREMENTS])
          : []
      )
    );
  }

  /**
   * create an html string which describes the content of a popup instance.
   * It includes the device name and the measurements.
   *
   * @param deviceName used for the headline
   * @param measurements to display in the popup
   * @returns html string
   */
  private getPopupContent(managedObject: IManagedObject, measurements?: Measurement[]): string {
    let contentString = this.getPopupHeader(managedObject);

    if (!measurements || measurements.length === 0) {
      contentString += '<p style="text-align:center">Loading measurements...</p>';
      return contentString;
    }

    measurements.forEach(measurement => {
      const datapointConfig = this.config.datapointsPopup.find(
        datapoint =>
          `${datapoint.measurement.fragment}.${datapoint.measurement.series}` ===
          `${measurement.datapoint.fragment}.${measurement.datapoint.series}`
      );
      const measurementString = measurement.unit
        ? `${measurement.value}${measurement.unit}`
        : `${measurement.value}`;
      contentString += `<p>${
        datapointConfig.label
      }: <span class="measurement-value">${measurementString}</span></p>`;
    });

    return contentString;
  }

  /**
   * returns the header for the popup. In case the device has a dashboard id assigned to
   * it, the dashboard will linked in the header.
   *
   * @param managedObject for which the popup should be created
   * @returns header as an html string
   */
  private getPopupHeader(managedObject: IManagedObject): string {
    if (!has(managedObject, 'dashboardId')) {
      return `<h5>${managedObject.name}</h5><hr />`;
    }

    if (!this.applicationBuilderAppId) {
      return `<a href="#/device/${managedObject.id}"><h5>${managedObject.name}</h5></a><hr />`;
    }

    return `<a href="#/application/${this.applicationBuilderAppId}/dashboard/${
      managedObject['dashboardId']
    }/device/${managedObject.id}"><h5>${managedObject.name}</h5></a><hr />`;
  }

  /**
   * Load the latest measurement based on the configured popup measurements for a
   * given managedObject. The measurements will be directly stored on the
   * managed object as a custom property.
   *
   * @param managedObject
   */
  private async loadLatestMeasurements(managedObject: IManagedObject): Promise<void> {
    const datapoints: Datapoint[] = this.config.datapointsPopup.map(
      datapointPopup => datapointPopup.measurement
    );

    const promisses: Promise<Measurement>[] = [];
    datapoints.forEach(datapoint =>
      promisses.push(
        this.mapService.loadLatestMeasurement(
          managedObject.id,
          datapoint.fragment,
          datapoint.series
        )
      )
    );

    const measurements: Measurement[] = await Promise.all(promisses);

    measurements.forEach((measurement, index) => {
      const datapoint = `${datapoints[index].fragment}.${datapoints[index].series}`;
      managedObject[this.KEY_MEASUREMENTS] = Object.assign(
        !!managedObject[this.KEY_MEASUREMENTS] ? managedObject[this.KEY_MEASUREMENTS] : {},
        { [datapoint]: measurement }
      );
    });
  }

  /**
   * get the background color based on the thresholds which have been defined
   * in the widgets configuration. If there aren't any thresholds return the
   * default color
   *
   * @param measurement
   * @returns color as hex string
   */
  private getBackgroundColor(measurement: Measurement): string {
    if (
      !this.config.legend ||
      !this.config.legend.thresholds ||
      this.config.legend.thresholds.length === 0
    ) {
      return this.MARKER_DEFAULT_COLOR;
    }

    const threshold = this.config.legend.thresholds.find(
      threshold => measurement.value >= threshold.min && measurement.value <= threshold.max
    );
    if (!threshold) {
      return this.MARKER_DEFAULT_COLOR;
    }

    return threshold.color;
  }

  private isMarkersAvailableForCurrentFloorLevel(): boolean {
    return (
      this.markerManagedObjectsForFloorLevel &&
      this.markerManagedObjectsForFloorLevel.length > 0 &&
      !!this.markerManagedObjectsForFloorLevel[this.currentFloorLevel]
    );
  }

  private isGeolocationAvailable(managedObject: IManagedObject): boolean {
    return has(managedObject, 'c8y_Position.lat') && has(managedObject, 'c8y_Position.lng');
  }
}
