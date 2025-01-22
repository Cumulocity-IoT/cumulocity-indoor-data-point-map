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
import { InventoryService } from '@c8y/client';
import { has, get } from 'lodash';
import { isMapConfigutaration, MapConfiguration } from './data-point-indoor-map.model';
import { AlertService, ModalService, Status } from '@c8y/ngx-components';

@Injectable()
export class DataPointIndoorMapConfigService {
  constructor(private inventoryService: InventoryService, private modal: ModalService, private alertService: AlertService) {}

  async loadSmartMapConfigurations(): Promise<MapConfiguration[]> {
    const filter = {
      pageSize: 2000,
      type: 'c8y_Building',
    };

    try {
      const { data } = await this.inventoryService.list(filter);
      return data
        .map((item) => {
          if (isMapConfigutaration(item)) {
            return item;
          }
          return undefined;
        })
        .filter((item) => item !== undefined);
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  deleteMapConfiguration(mapConfigurationId: string) {
    return this.modal.confirm('Delete map configuration', 'Are you sure you want to delete this map configuration?', Status.DANGER).then((result) => {
      if (result) {
        return this.inventoryService.delete(mapConfigurationId).then(
          () => {
            this.alertService.success('Map configuration deleted successfully');
            return true;
          },
          () => {
            return false;
          }
        );
      }
      return false;
    });
  }

  getDeviceIdFromMapConfiguration(mapConfiguration: object): string {
    if (!mapConfiguration) {
      return '';
    }

    if (!has(mapConfiguration, 'levels') || (get(mapConfiguration, 'levels') as object[]).length === 0) {
      return '';
    }

    const firstLevel = (get(mapConfiguration, 'levels') as object[])[0];
    if (!has(firstLevel, 'markers') || (get(firstLevel, 'markers') as string[]).length === 0) {
      return '';
    }

    return (get(firstLevel, 'markers') as string[])[0];
  }

  loadSupportedDataPointSeries(deviceId: string) {
    return this.inventoryService.getSupportedSeries(deviceId).then();
  }
}
