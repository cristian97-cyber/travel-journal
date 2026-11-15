import { Injectable } from '@angular/core';
import type { Trip } from '../models/trip.model';
import { travelJournalDatabase } from './travel-journal.database';

@Injectable({ providedIn: 'root' })
export class TripRepository {
  list(): Promise<Trip[]> {
    return travelJournalDatabase.trips.orderBy('importedAt').reverse().toArray();
  }

  get(id: string): Promise<Trip | undefined> {
    return travelJournalDatabase.trips.get(id);
  }

  async save(trip: Trip): Promise<void> {
    await travelJournalDatabase.trips.put(trip);
  }

  async delete(id: string): Promise<void> {
    await travelJournalDatabase.trips.delete(id);
  }
}

