import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CoreModule } from '@c8y/ngx-components';
import type * as L from 'leaflet';
import { fromEvent, Subject, takeUntil } from 'rxjs';
import { MarkerManagedObject } from '../../../data-point-indoor-map.model';

@Component({
  selector: 'move-marker-map',
  templateUrl: './move-marker-map.component.html',
  styleUrls: ['./move-marker-map.component.less'],
  standalone: true,
  imports: [CoreModule, CommonModule],
})
export class MoveMarkerMapComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly MARKER_DEFAULT_COLOR = '#1776BF';

  leaf!: Promise<typeof L>;
  map?: L.Map;
  private destroy$ = new Subject<void>();
  private marker?: L.CircleMarker;

  @Input() imageBlob?: Blob;
  @Input() device?: MarkerManagedObject;
  @Output() markerPosition = new EventEmitter<L.LatLng>();

  constructor() {}

  async ngOnInit() {
    this.leaf = import('leaflet');
  }

  async ngAfterViewInit() {
    const l = await this.leaf;
    if (!this.imageBlob) {
      return;
    }

    const {
      url,
      dimensions: { width, height },
    } = await this.readImage(this.imageBlob);

    this.map = l.map('map', {
      crs: l.CRS.Simple,
      minZoom: -2,
      maxZoom: 1,
      center: [height * 0.5, width * 0.5],
      zoom: 0,
    });
    
    this.addImageToMap(url, width, height, l);

    fromEvent<L.LeafletMouseEvent>(this.map, 'click')
      .pipe(takeUntil(this.destroy$))
      .subscribe((e) => this.onClick(e, l));

    if (this.device?.c8y_IndoorPosition) {
      const { lat, lng } = this.device.c8y_IndoorPosition;
      const latlng: L.LatLng = l.latLng(lat, lng);
      this.updateMarkerPosition(latlng, l);
    }
  }

  private async readImage(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const bmp = await createImageBitmap(blob);
    const { width, height } = bmp;
    bmp.close(); // free memory
    return { url, dimensions: { width, height } };
  }

  private addImageToMap(url: string, width: number, height: number, l: typeof L) {
    const bounds: L.LatLngBoundsExpression = [
      [0, 0],
      [height, width],
    ];
    const image = l.imageOverlay(url, bounds);
    image.addTo(this.map!);
    this.map!.fitBounds(bounds);
  }

  private onClick(e: L.LeafletMouseEvent, l: typeof L) {
    this.updateMarkerPosition(e.latlng, l);
    this.markerPosition.emit(e.latlng);
  }

  private updateMarkerPosition(latlng: L.LatLng, l: typeof L) {
    if (this.marker) {
      this.marker.removeFrom(this.map!);
    }
    this.marker = l
      .circleMarker(latlng, {
        fillColor: this.MARKER_DEFAULT_COLOR,
        fillOpacity: 0.75,
        radius: 8,
        weight: 0,
        interactive: false,
      })
      .addTo(this.map!);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    try {
      this.map?.clearAllEventListeners();
    } catch (e) {
      console.warn(e);
    }
  }
}
