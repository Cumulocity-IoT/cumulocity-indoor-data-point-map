import { IManagedObject } from '@c8y/client';

export interface WidgetConfiguration {
  mapConfigurationId: string;
  measurement: Datapoint;
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
