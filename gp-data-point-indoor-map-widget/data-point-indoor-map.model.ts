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
import { IManagedObject } from '@c8y/client';

export interface WidgetConfiguration {
  mapConfigurationId: string;
  measurement: Datapoint;
  mapSettings: {
    zoomLevel: number;
  };
  legend?: {
    title: string;
    thresholds?: Threshold[];
  };
  datapointsPopup?: DatapointPopup[];
}

export interface Threshold {
  id: string;
  label: string;
  min: number;
  max: number;
  color: string;
}

export interface DatapointPopup {
  measurement: Datapoint;
  label: string;
}

export interface Datapoint {
  fragment: string;
  series: string;
}

export interface Measurement {
  value: number;
  unit?: string;
  datapoint: Datapoint;
}

export interface MapConfiguration extends IManagedObject {
  coordinates: Array<{ lat: number; lng: number }>;
  location: string;
  assetType: string;
  levels: MapConfigurationLevel[];
}

export interface MapConfigurationLevel {
  level: string;
  /** binary id of the image */
  id: string;
  /** downloaded image stored as Blob */
  blob?: Blob;
  /** markers ids which reference the corresponding managed object */
  markers: string[];
  /** the corresponding managed Object for a marker */
  markerManagedObjects?: IManagedObject[];
  imageDetails: {
    corners: Array<{ lat: number; lng: number }>;
  };
}
