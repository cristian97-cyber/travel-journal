import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { Trip } from '../../core/models/trip.model';
import { TripStore } from '../../core/state/trip.store';
import { DateRangePipe } from '../../shared/pipes/date-range.pipe';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatProgressSpinnerModule, DateRangePipe],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  readonly store = inject(TripStore);
  readonly isDragging = signal(false);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  openFilePicker(input: HTMLInputElement): void {
    input.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    if (
      !event.currentTarget ||
      !(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)
    ) {
      this.isDragging.set(false);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files.item(0);
    if (file) void this.importFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (file) void this.importFile(file);
    input.value = '';
  }

  async removeTrip(event: Event, trip: Trip): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    if (!globalThis.confirm(`Eliminare “${trip.title}” da questo dispositivo?`)) return;
    await this.store.remove(trip.id);
    this.snackBar.open('Viaggio eliminato', 'Chiudi', { duration: 3000 });
  }

  private async importFile(file: File): Promise<void> {
    try {
      const trip = await this.store.import(file);
      this.snackBar.open('Viaggio importato e salvato sul dispositivo', 'Chiudi', {
        duration: 3500,
      });
      await this.router.navigate(['/trip', trip.id]);
    } catch {
      this.snackBar.open(this.store.error() ?? 'Importazione non riuscita', 'Chiudi', {
        duration: 6000,
      });
    }
  }
}
