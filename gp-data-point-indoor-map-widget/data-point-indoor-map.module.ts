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
import { NgModule } from '@angular/core';
import { CommonModule as NgCommonModule } from '@angular/common';
import { FormsModule as NgFormModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import {
  CoreModule,
  DynamicFormsModule,
  DynamicComponentDefinition,
  HOOK_COMPONENTS
} from '@c8y/ngx-components';
import { ContextWidgetConfig } from '@c8y/ngx-components/context-dashboard';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { AddThresholdModalComponent } from './add-threshold-modal/add-threshold-modal.component';
import { previewImage } from './assets/preview-image';
import { DataPointIndoorMapComponent } from './data-point-indoor-map.component';
import { DataPointIndoorMapConfigComponent } from './data-point-indoor-map.config.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { ManagedDatapointsPopupModalComponent } from './managed-datapoints-popup-modal/managed-datapoints-popup-modal.component';
import { ModalModule } from 'ngx-bootstrap/modal';

@NgModule({
  imports: [
    CoreModule,
    TooltipModule,
    NgCommonModule,
    NgFormModule,
    ReactiveFormsModule,
    DynamicFormsModule,
    ColorPickerModule,
    ModalModule.forRoot()
  ],
  exports: [
    DataPointIndoorMapComponent,
    DataPointIndoorMapConfigComponent,
    AddThresholdModalComponent,
    ManagedDatapointsPopupModalComponent
  ],
  declarations: [
    DataPointIndoorMapComponent,
    DataPointIndoorMapConfigComponent,
    AddThresholdModalComponent,
    ManagedDatapointsPopupModalComponent
  ],
  entryComponents: [
    DataPointIndoorMapComponent,
    DataPointIndoorMapConfigComponent,
    AddThresholdModalComponent,
    ManagedDatapointsPopupModalComponent
  ],
  providers: [
    {
      provide: HOOK_COMPONENTS,
      multi: true,
      useValue: [
        {
          id: 'indoor-data-point-map-widget',
          label: 'Indoor Data Point Map Widget',
          description: 'Display markers on a indoor map and their data points',
          component: DataPointIndoorMapComponent,
          configComponent: DataPointIndoorMapConfigComponent,
          previewImage: previewImage,
          data: {
            settings: {
              noNewWidgets: false, // Set this to true, to don't allow adding new widgets.
              ng1: {
                options: {
                  noDeviceTarget: true, // Set this to true to hide the device selector.
                  groupsSelectable: false // Set this, if not only devices should be selectable.
                }
              }
            }
          } as ContextWidgetConfig
        }
      ] as DynamicComponentDefinition[]
    }
  ]
})
export class DataPointIndoorMapModule {}
