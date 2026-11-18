import { computed, inject, Injectable, signal } from '@angular/core';
import type { Trip } from '../models/trip.model';
import type { NewTripUsefulInfo, TripUsefulInfo } from '../types/useful-info.type';
import { TripUsefulInfoCategoryEnum } from '../useful-info-category.enum';
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

  async addUsefulInfo(tripId: string, input: NewTripUsefulInfo): Promise<Trip> {
    this.error.set(null);
    try {
      const trip =
        this.tripsState().find((item) => item.id === tripId) ?? (await this.repository.get(tripId));
      if (!trip) throw new Error('Viaggio non trovato.');

      const item = this.createUsefulInfo(input);
      const updatedTrip = { ...trip, usefulInfo: [...trip.usefulInfo, item] };
      await this.repository.save(updatedTrip);
      this.tripsState.update((trips) => {
        const tripIsLoaded = trips.some((current) => current.id === tripId);
        return tripIsLoaded
          ? trips.map((current) => (current.id === tripId ? updatedTrip : current))
          : [updatedTrip, ...trips];
      });
      return updatedTrip;
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Non è stato possibile aggiungere il dettaglio.',
      );
      throw error;
    }
  }

  async updateUsefulInfo(
    tripId: string,
    usefulInfoId: string,
    input: NewTripUsefulInfo,
  ): Promise<Trip> {
    this.error.set(null);
    try {
      const trip = await this.getTripOrThrow(tripId);
      const current = trip.usefulInfo.find((item) => item.id === usefulInfoId);
      if (!current) throw new Error('Dettaglio non trovato.');
      if (current.category !== input.category) {
        throw new Error('La categoria del dettaglio non può essere modificata.');
      }

      const item = this.createUpdatedUsefulInfo(current, input);
      const updatedTrip = {
        ...trip,
        usefulInfo: trip.usefulInfo.map((currentItem) =>
          currentItem.id === usefulInfoId ? item : currentItem,
        ),
      };
      return await this.saveUpdatedTrip(updatedTrip);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Non è stato possibile modificare il dettaglio.',
      );
      throw error;
    }
  }

  async removeUsefulInfo(tripId: string, usefulInfoId: string): Promise<Trip> {
    this.error.set(null);
    try {
      const trip = await this.getTripOrThrow(tripId);
      if (!trip.usefulInfo.some((item) => item.id === usefulInfoId)) {
        throw new Error('Dettaglio non trovato.');
      }

      return await this.saveUpdatedTrip({
        ...trip,
        usefulInfo: trip.usefulInfo.filter((item) => item.id !== usefulInfoId),
      });
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Non è stato possibile eliminare il dettaglio.',
      );
      throw error;
    }
  }

  private createUsefulInfo(input: NewTripUsefulInfo): TripUsefulInfo {
    const common = {
      id: this.createId('useful-info'),
      name: input.name,
      description: input.description,
    };

    if (input.category === TripUsefulInfoCategoryEnum.Shopping) {
      return { ...common, ...input, done: false };
    }
    return { ...common, ...input };
  }

  private createUpdatedUsefulInfo(
    current: TripUsefulInfo,
    input: NewTripUsefulInfo,
  ): TripUsefulInfo {
    if (
      current.category === TripUsefulInfoCategoryEnum.Shopping &&
      input.category === TripUsefulInfoCategoryEnum.Shopping
    ) {
      return { ...input, id: current.id, done: current.done };
    }
    if (input.category === TripUsefulInfoCategoryEnum.App) {
      return { ...input, id: current.id };
    }
    if (input.category === TripUsefulInfoCategoryEnum.Advice) {
      return { ...input, id: current.id };
    }
    throw new Error('Categoria del dettaglio non valida.');
  }

  private async getTripOrThrow(tripId: string): Promise<Trip> {
    const trip =
      this.tripsState().find((item) => item.id === tripId) ?? (await this.repository.get(tripId));
    if (!trip) throw new Error('Viaggio non trovato.');
    return trip;
  }

  private async saveUpdatedTrip(updatedTrip: Trip): Promise<Trip> {
    await this.repository.save(updatedTrip);
    this.tripsState.update((trips) => {
      const tripIsLoaded = trips.some((current) => current.id === updatedTrip.id);
      return tripIsLoaded
        ? trips.map((current) => (current.id === updatedTrip.id ? updatedTrip : current))
        : [updatedTrip, ...trips];
    });
    return updatedTrip;
  }

  private createId(prefix: string): string {
    const suffix =
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${suffix}`;
  }
}
