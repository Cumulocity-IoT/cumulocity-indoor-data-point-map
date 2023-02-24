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
import { Injectable } from '@angular/core';
import {
  IManagedObject,
  IMeasurement,
  InventoryBinaryService,
  InventoryService,
  MeasurementService,
  Realtime
} from '@c8y/client';
import {
  Datapoint,
  MapConfiguration,
  MapConfigurationLevel,
  Measurement
} from './data-point-indoor-map.model';
import { has, get } from 'lodash-es';
import { Subject } from 'rxjs';

@Injectable()
export class DataPointIndoorMapService {
  public primaryMeasurementReceived$: Subject<{
    deviceId: string;
    measurement: Measurement;
  }> = new Subject<{ deviceId: string; measurement: Measurement }>();

  public measurementReceived$: Subject<{
    deviceId: string;
    measurement: Measurement;
  }> = new Subject<{ deviceId: string; measurement: Measurement }>();

  constructor(
    private inventoryService: InventoryService,
    private binaryService: InventoryBinaryService,
    private measurementService: MeasurementService,
    private realtime: Realtime
  ) {}

  async loadMapConfigurationWithImages(mapConfigurationId: string): Promise<MapConfiguration> {
    if (!mapConfigurationId) {
      throw new Error('Missing map configuration id!');
    }

    const mapConfiguration = (await this.inventoryService.detail(mapConfigurationId))
      .data as MapConfiguration;

    if (mapConfiguration.levels && mapConfiguration.levels.length === 0) {
      return mapConfiguration;
    }

    const promises: Promise<Blob>[] = [];
    mapConfiguration.levels.forEach(level => promises.push(this.loadImage(level.id)));

    const imageBlobs = await Promise.all(promises);
    mapConfiguration.levels.forEach((level, index) => (level.blob = imageBlobs[index]));

    return mapConfiguration;
  }

  async loadMarkersForLevels(levels: MapConfigurationLevel[]): Promise<IManagedObject[][]> {
    if (!levels || levels.length === 0) {
      return [];
    }

    const promises: Promise<IManagedObject[]>[] = [];
    levels.forEach(level => promises.push(this.loadMarkers(level.markers)));

    return Promise.all(promises);
  }

  async loadMarkers(markerIds: string[]): Promise<IManagedObject[]> {
    if (!markerIds || markerIds.length === 0) {
      return undefined;
    }

    const query = {
      __filter: {
        __or: []
      }
    };

    markerIds.forEach(markerId => query.__filter.__or.push({ __eq: { id: markerId } }));
    const response = await this.inventoryService.listQuery(query, { pageSize: 2000 });
    return response.data;
  }

  async loadImage(imageId: string): Promise<Blob> {
    const imageBlob = await ((await this.binaryService.download(imageId)) as Response).blob();
    return imageBlob;
  }

  public async loadLatestMeasurements(
    deviceIds: string[],
    measurementFragment: string,
    measurementSeries: string
  ): Promise<Measurement[]> {
    if (!deviceIds || deviceIds.length === 0) {
      return [];
    }

    const promisses: Promise<Measurement>[] = [];
    deviceIds.forEach(deviceId =>
      promisses.push(this.loadLatestMeasurement(deviceId, measurementFragment, measurementSeries))
    );

    return Promise.all(promisses);
  }

  public async loadLatestMeasurement(
    deviceId: string,
    measurementFragment: string,
    measurementSeries: string
  ): Promise<Measurement> {
    const filter = {
      source: deviceId,
      dateFrom: '1970-01-01',
      dateTo: new Date().toISOString(),
      valueFragmentType: measurementFragment,
      valueFragmentSeries: measurementSeries,
      pageSize: 1,
      revert: true
    };

    return this.measurementService.list(filter).then(response => {
      if (
        !response.data ||
        response.data.length != 1 ||
        !has(response.data[0], `${measurementFragment}.${measurementSeries}`)
      ) {
        return undefined;
      }

      const measurementValue: number = get(
        response.data[0],
        `${measurementFragment}.${measurementSeries}.value`
      );
      const measurementUnit: string = get(
        response.data[0],
        `${measurementFragment}.${measurementSeries}.unit`
      );

      return {
        value: measurementValue,
        unit: measurementUnit,
        datapoint: {
          fragment: measurementFragment,
          series: measurementSeries
        }
      };
    });
  }

  public subscribeForMeasurements(
    deviceIds: string[],
    primaryDatapoint: Datapoint,
    datapoints: Datapoint[]
  ) {
    if (!deviceIds || deviceIds.length === 0) {
      return;
    }

    deviceIds.forEach(deviceId =>
      this.subscribeForMeasurement(deviceId, primaryDatapoint, datapoints)
    );
  }

  private subscribeForMeasurement(
    deviceId: string,
    primaryDatapoint: Datapoint,
    datapoints: Datapoint[]
  ) {
    this.realtime.subscribe(`/measurements/${deviceId}`, measurementNotification => {
      const measurement: IMeasurement = measurementNotification.data.data;

      if (!measurement) {
        return;
      }

      if (has(measurement, `${primaryDatapoint.fragment}.${primaryDatapoint.series}`)) {
        const measurementReceived: Measurement = {
          value: get(measurement, `${primaryDatapoint.fragment}.${primaryDatapoint.series}.value`),
          unit: get(measurement, `${primaryDatapoint.fragment}.${primaryDatapoint.series}.unit`),
          datapoint: {
            fragment: primaryDatapoint.fragment,
            series: primaryDatapoint.series
          }
        };
        this.primaryMeasurementReceived$.next({ deviceId, measurement: measurementReceived });
      }

      datapoints.forEach(datapoint => {
        if (has(measurement, `${datapoint.fragment}.${datapoint.series}`)) {
          const measurementReceived: Measurement = {
            value: get(measurement, `${datapoint.fragment}.${datapoint.series}.value`),
            unit: get(measurement, `${datapoint.fragment}.${datapoint.series}.unit`),
            datapoint
          };
          this.measurementReceived$.next({ deviceId, measurement: measurementReceived });
        }
      });
    });
  }

  getApplicationBuilderAppId(): string {
    const currentURL = window.location.href;
    const routeParam = currentURL.split('#');
    if (routeParam.length > 1) {
      const appParamArray = routeParam[1].split('/');
      const appIndex = appParamArray.indexOf('application');
      if (appIndex !== -1) {
        return appParamArray[appIndex + 1];
      }
    }
    return '';
  }
}
