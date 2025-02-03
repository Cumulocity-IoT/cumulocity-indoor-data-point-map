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
import { Component, Input, OnInit } from '@angular/core';
import { Threshold } from '../../data-point-indoor-map.model';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { pick } from 'lodash';

interface Tab {
  id: string;
  label: string;
  icon?: string;
  active?: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'add-threshold-modal-dialog',
  templateUrl: 'add-threshold-modal.component.html',
})
export class AddThresholdModalComponent implements OnInit {
  initialValue: Threshold = {
    id: this.generateId().toString(),
    type: 'measurement',
    color: '#fb4b4b',
    label: '',
    min: 0,
    max: 10,
  };
  @Input() threshold: Threshold = this.initialValue;

  public onSave$: Subject<Threshold> = new Subject<Threshold>();
  public onDelete$: Subject<Threshold> = new Subject<Threshold>();

  tabs: Tab[] = [
    {
      id: 'measurement',
      label: 'Measurement',
      icon: 'c8y-icon c8y-icon-aab-icon-template-model',
      active: true,
      disabled: false,
    },
    {
      id: 'event',
      label: 'Event',
      icon: 'c8y-icon c8y-icon-data-points',
      disabled: false,
    },
  ] as const;

  constructor(private modalRef: BsModalRef) {}

  ngOnInit() {
    this.changeTab(this.threshold.type);
  }

  onTabClick(tabId: Tab['id'] | Threshold['type']) {
    this.changeTab(tabId);
    if (tabId === 'measurement') {
      this.threshold = { ...pick(this.threshold, ['id', 'color', 'label']), type: 'measurement', min: 0, max: 0 };
      this.initialValue = this.threshold;
    } else if (tabId === 'event') {
      this.threshold = { ...pick(this.threshold, ['id', 'color', 'label']), type: 'event', text: '' };
      this.initialValue = this.threshold;
    }
  }

  changeTab(tabId: Tab['id'] | Threshold['type']): void {
    this.tabs.forEach((t) => {
      t.active = t.id === tabId;
    });
  }

  onCancelButtonClicked(): void {
    this.hideDialog();
  }

  onSaveButtonClicked(): void {
    this.sendThreshold();
    this.hideDialog();
  }

  onDeleteButtonClicked(): void {
    this.sendDeleteThresholdEvent();
    this.hideDialog();
  }

  private sendThreshold() {
    this.onSave$.next(this.threshold);
  }

  private sendDeleteThresholdEvent() {
    this.onDelete$.next(this.threshold);
  }

  private hideDialog() {
    this.modalRef.hide();
  }

  private generateId(): number {
    const min = 0;
    const max = Number.MAX_SAFE_INTEGER;
    return Math.floor(Math.random() * (max - min)) + min;
  }
}
