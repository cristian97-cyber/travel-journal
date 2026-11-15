import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import type { Trip } from '../../core/models/trip.model';
import { TripStore } from '../../core/state/trip.store';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
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

  private readonly dialog = inject(MatDialog);
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
    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmDialog, {
          autoFocus: '.confirm-dialog__cancel',
          data: {
            title: 'Eliminare questo itinerario?',
            message: `“${trip.title}” verrà rimosso da questo dispositivo.`,
            confirmLabel: 'Elimina itinerario',
          },
          maxWidth: 'calc(100vw - 32px)',
          panelClass: 'app-dialog',
          width: '440px',
        })
        .afterClosed(),
    );
    if (!confirmed) return;

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
