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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Threshold } from '../data-point-indoor-map.model';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';

@Component({
  selector: 'add-threshold-modal-dialog',
  templateUrl: 'add-threshold-modal.component.html'
})
export class AddThresholdModalComponent implements OnInit {
  @Input() threshold: Threshold;

  public onSave$: Subject<Threshold> = new Subject<Threshold>();

  public onDelete$: Subject<Threshold> = new Subject<Threshold>();

  formGroup: FormGroup;

  color: string = '#ffffff';

  constructor(private modalRef: BsModalRef, private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.initForm();
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

  private initForm(): void {
    this.formGroup = this.formBuilder.group({
      label: ['', Validators.required],
      minimum: [, Validators.required],
      maximum: [, Validators.required]
    });

    if (this.isThresholdConfigurationAvailable()) {
      this.color = this.threshold.color;
      this.formGroup.patchValue({
        label: this.threshold.label,
        minimum: this.threshold.min,
        maximum: this.threshold.max
      });
    }
  }

  private getThresholdRepresentation(): Threshold {
    return {
      id: this.isThresholdConfigurationAvailable()
        ? this.threshold.id
        : this.generateId().toString(),
      label: this.formGroup.value.label,
      min: this.formGroup.value.minimum,
      max: this.formGroup.value.maximum,
      color: this.color
    };
  }

  private isThresholdConfigurationAvailable(): boolean {
    return !!this.threshold;
  }

  private sendThreshold() {
    const threshold = this.getThresholdRepresentation();
    this.onSave$.next(threshold);
  }

  private sendDeleteThresholdEvent() {
    const threshold = this.getThresholdRepresentation();
    this.onDelete$.next(threshold);
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
