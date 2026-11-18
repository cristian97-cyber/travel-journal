import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { Trip } from '../../core/models/trip.model';
import type { NewTripUsefulInfo } from '../../core/types/useful-info.type';
import { TripStore } from '../../core/state/trip.store';
import { DateRangePipe } from '../../shared/pipes/date-range.pipe';
import { TripUsefulInfoComponent } from './trip-useful-info/trip-useful-info.component';

type TripDetailSection = 'itinerary' | 'useful-info';

@Component({
  selector: 'app-trip-detail-page',
  imports: [
    RouterLink,
    MatButtonModule,
    MatProgressSpinnerModule,
    DateRangePipe,
    TripUsefulInfoComponent,
  ],
  templateUrl: './trip-detail.page.html',
  styleUrl: './trip-detail.page.scss',
})
export class TripDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(TripStore);
  private readonly snackBar = inject(MatSnackBar);

  readonly trip = signal<Trip | null>(null);
  readonly loading = signal(true);
  readonly selectedDayIndex = signal(0);
  readonly selectedSection = signal<TripDetailSection>('itinerary');
  readonly selectedDay = computed(() => this.trip()?.days[this.selectedDayIndex()] ?? null);

  constructor() {
    void this.loadTrip();
  }

  selectDay(index: number): void {
    this.selectedDayIndex.set(index);
    globalThis.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  selectSection(section: TripDetailSection): void {
    this.selectedSection.set(section);
  }

  async addUsefulInfo(input: NewTripUsefulInfo): Promise<void> {
    const trip = this.trip();
    if (!trip) return;

    try {
      this.trip.set(await this.store.addUsefulInfo(trip.id, input));
      this.snackBar.open('Dettaglio aggiunto', 'Chiudi', { duration: 3000 });
    } catch {
      this.snackBar.open(
        this.store.error() ?? 'Non è stato possibile aggiungere il dettaglio.',
        'Chiudi',
        { duration: 5000 },
      );
    }
  }

  formatDay(date: string): string {
    return new Intl.DateTimeFormat('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));
  }

  shortDay(date: string): { weekday: string; day: string; month: string } {
    const value = new Date(`${date}T00:00:00Z`);
    return {
      weekday: new Intl.DateTimeFormat('it-IT', { weekday: 'short', timeZone: 'UTC' }).format(
        value,
      ),
      day: new Intl.DateTimeFormat('it-IT', { day: '2-digit', timeZone: 'UTC' }).format(value),
      month: new Intl.DateTimeFormat('it-IT', { month: 'short', timeZone: 'UTC' }).format(value),
    };
  }

  private async loadTrip(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.trip.set((await this.store.find(id)) ?? null);
    this.loading.set(false);
  }
}
