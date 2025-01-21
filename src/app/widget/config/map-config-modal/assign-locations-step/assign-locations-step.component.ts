import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MapConfiguration, MapConfigurationLevel, MarkerManagedObject } from '../../../data-point-indoor-map.model';
import { IManagedObject, IManagedObjectBinary, InventoryBinaryService, InventoryService } from '@c8y/client';
import { FilesService, IFetchWithProgress } from '@c8y/ngx-components';
import { Subject, takeUntil } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'assign-locations-step',
  templateUrl: './assign-locations-step.component.html',
  styleUrls: ['./assign-locations-step.component.less'],
})
export class AssignLocationsStepComponent implements OnInit, OnDestroy {
  selectedItem?: MapConfigurationLevel | MarkerManagedObject;
  selectedItemIsSensor = false;
  @Input() building!: MapConfiguration;
  isLoadingImage = false;
  destroy$ = new Subject<void>();
  progress?: IFetchWithProgress;
  safeDataUrl?: SafeUrl;
  imageCache = new Map<string, string>();
  imageBlob?: Blob;

  constructor(private inventory: InventoryService, private binaryService: InventoryBinaryService, private filesService: FilesService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
   this.select(this.building.levels[0]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  select(levelOrDevice: MapConfigurationLevel | IManagedObject) {
    this.selectedItem = levelOrDevice;
    if (!this.selectedItemIsSensor) {
      if (levelOrDevice.binaryId) {
        delete this.safeDataUrl;
        if (this.imageCache.has(levelOrDevice.binaryId)) {
          const imageUrl = this.imageCache.get(levelOrDevice.binaryId)!;
          this.safeDataUrl = this.sanitizer.bypassSecurityTrustUrl(imageUrl);
        } else {
          this.isLoadingImage = true;
          this.loadImage().finally(() => (this.isLoadingImage = false));
        }
      }
    }
  }

  onImageUploaded(binary: IManagedObjectBinary) {
    const level = this.selectedItem as MapConfigurationLevel;
    if (level.binaryId) {
      this.binaryService.delete(level.binaryId);
    }
    level.binaryId = binary.id!;
    this.loadImage();
  }

  async loadImage() {
    const level = this.selectedItem as MapConfigurationLevel;
    if (level.binaryId) {
      const { data } = await this.inventory.detail(level.binaryId);
      const binaryMO = data as IManagedObjectBinary;
      this.filesService
        .fetchFileWithProgress$(binaryMO)
        .pipe(takeUntil(this.destroy$))
        .subscribe((progress) => {
          this.progress = progress;
          if (this.progress?.blob) {
            this.imageBlob = progress.blob;
            const imageUrl = URL.createObjectURL(progress.blob!);
            this.imageCache.set(level.binaryId!, imageUrl);
            this.safeDataUrl = this.sanitizer.bypassSecurityTrustUrl(imageUrl);
          }
        });
    }
  }

  removeImage() {
    const level = this.selectedItem as MapConfigurationLevel;
    if (level.binaryId) {
      this.binaryService.delete(level.binaryId);
      delete level.binaryId;
    }
  }

  onMarkerPositionUpdate(position: L.LatLng) {
    const markerMO = this.selectedItem as MarkerManagedObject;
    markerMO.c8y_IndoorPosition = { lat: position.lat, lng: position.lng };
  }
}
