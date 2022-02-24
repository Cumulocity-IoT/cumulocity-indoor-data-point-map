import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
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
