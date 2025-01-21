import { Component, Input, ViewChild } from '@angular/core';
import { VirtualDraggableDeviceListComponent } from '../../../shared/components/virtual-draggable-device-list/virtual-draggable-device-list.component';
import { MapConfiguration, MapConfigurationLevel } from '../../../data-point-indoor-map.model';
import { IManagedObject } from '@c8y/client';
import { CdkDragDrop, CdkDropList, copyArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
import { isEqual } from 'lodash';

@Component({
  selector: 'assign-devices-step',
  templateUrl: './assign-devices-step.component.html',
})
export class AssignDevicesStepComponent {
  @ViewChild('allDevices', { static: false })
  allDevicesComponent?: VirtualDraggableDeviceListComponent;

  @Input() building?: MapConfiguration;

  onAddLevel() {
    this.building?.levels.push({
      name: `New Level`,
      markers: new Array<string>(),
      markerManagedObjects: new Array<IManagedObject>(),
      binaryId: '',
      imageDetails: {
        corners: [],
      },
    });
  }

  drop(event: CdkDragDrop<IManagedObject[]>) {
    if (event.previousContainer === event.container) {
      // move within same container
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else if (this.isLevelContainer(event.previousContainer) && this.isLevelContainer(event.container)) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      const fromLevel = this.getLevel(event.previousContainer);
      const item = fromLevel!.markerManagedObjects![event.previousIndex];
      const toLevel = this.getLevel(event.container);
      toLevel!.markerManagedObjects!.splice(event.currentIndex, 0, item);
      fromLevel!.markerManagedObjects = fromLevel!.markerManagedObjects!.filter((mo) => mo !== item);
    } else if (!event.container.data.find((m) => m.id === event.previousContainer.data[event.previousIndex].id)) {
      // prevent duplicates when dropped to a level container
      copyArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  private isLevelContainer(list: CdkDropList<IManagedObject[]>) {
    const ids2 = list.data.map((mo) => mo.id);
    return this.building!.levels!.some((level) => {
      const ids1 = level.markerManagedObjects?.map((mo) => mo.id);
      return isEqual(ids1, ids2);
    });
  }

  private getLevel(list: CdkDropList<IManagedObject[]>) {
    const ids2 = list.data.map((mo) => mo.id);
    return this.building!.levels!.find((level) => {
      const ids1 = level.markerManagedObjects?.map((mo) => mo.id);
      return isEqual(ids1, ids2);
    });
  }

  assign(mos: IManagedObject[], level: MapConfigurationLevel) {
    level.markers.push(...mos.map((mo) => mo.id));
    level.markerManagedObjects = [...level.markerManagedObjects!, ...mos];
  }

  /**
   * Removes an assigned device from a level and adds it back to the list of all devices.
   * @param mo
   * @param level
   */
  moveBack(mo: IManagedObject, level: MapConfigurationLevel) {
    level.markers = level.markers.filter((m) => m !== mo.id);
    level.markerManagedObjects = level.markerManagedObjects?.filter((m) => m.id !== mo.id);
    // this.allDevicesComponent?.search();
  }

  onRemoveLevel(level: MapConfigurationLevel) {
    this.building!.levels = this.building!.levels.filter((l) => l !== level);
    // this.allDevicesComponent?.search();
  }
}
