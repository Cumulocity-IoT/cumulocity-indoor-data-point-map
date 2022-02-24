import { Injectable } from '@angular/core';
import { FetchClient, IManagedObject, InventoryService } from '@c8y/client';
import { has, get } from 'lodash';
import { MapConfiguration } from './data-point-indoor-map.model';

@Injectable()
export class DataPointIndoorMapConfigService {
  constructor(private inventoryService: InventoryService, private fetchClient: FetchClient) {}

  async loadSmartMapConfigurations(): Promise<MapConfiguration[]> {
    const filter = {
      pageSize: 2000,
      type: 'c8y_Building'
    };

    try {
      return (await this.inventoryService.list(filter)).data as MapConfiguration[];
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async loadSupportedDataPointSeries(deviceId: string): Promise<string[]> {
    try {
      const response = await (await this.fetchClient.fetch(
        `/inventory/managedObjects/${deviceId}/supportedSeries`
      )).json();
      if (!has(response, 'c8y_SupportedSeries')) {
        return [];
      }

      return get(response, 'c8y_SupportedSeries') as string[];
    } catch (error) {
      console.error(error);
    }
  }

  getDeviceIdFromMapConfiguration(mapConfiguration: object): string {
    if (!mapConfiguration) {
      return '';
    }

    if (
      !has(mapConfiguration, 'levels') ||
      (get(mapConfiguration, 'levels') as object[]).length === 0
    ) {
      return '';
    }

    const firstLevel = (get(mapConfiguration, 'levels') as object[])[0];
    if (!has(firstLevel, 'markers') || (get(firstLevel, 'markers') as string[]).length === 0) {
      return '';
    }

    return (get(firstLevel, 'markers') as string[])[0];
  }
}
