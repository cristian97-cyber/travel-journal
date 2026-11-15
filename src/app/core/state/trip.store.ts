import { computed, inject, Injectable, signal } from '@angular/core';
import type { Trip } from '../models/trip.model';
import { TripRepository } from '../data/trip-repository.service';
import { TripImportService } from '../services/trip-import.service';

@Injectable({ providedIn: 'root' })
export class TripStore {
  private readonly repository = inject(TripRepository);
  private readonly importer = inject(TripImportService);
  private readonly tripsState = signal<Trip[]>([]);

  readonly trips = this.tripsState.asReadonly();
  readonly loading = signal(true);
  readonly importing = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasTrips = computed(() => this.tripsState().length > 0);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.tripsState.set(await this.repository.list());
    } catch {
      this.error.set('Non è stato possibile leggere i viaggi salvati sul dispositivo.');
    } finally {
      this.loading.set(false);
    }
  }

  async import(file: File): Promise<Trip> {
    this.importing.set(true);
    this.error.set(null);
    try {
      const trip = await this.importer.fromZip(file);
      await this.repository.save(trip);
      this.tripsState.update((trips) => [trip, ...trips.filter((item) => item.id !== trip.id)]);
      return trip;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Importazione non riuscita.';
      this.error.set(message);
      throw error;
    } finally {
      this.importing.set(false);
    }
  }

  async find(id: string): Promise<Trip | undefined> {
    return this.tripsState().find((trip) => trip.id === id) ?? this.repository.get(id);
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
    this.tripsState.update((trips) => trips.filter((trip) => trip.id !== id));
  }
}

