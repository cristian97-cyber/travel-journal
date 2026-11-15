import Dexie, { type EntityTable } from 'dexie';
import type { Trip } from '../models/trip.model';

export class TravelJournalDatabase extends Dexie {
  trips!: EntityTable<Trip, 'id'>;

  constructor() {
    super('travel-journal');
    this.version(1).stores({
      trips: 'id, title, destination, startDate, importedAt',
    });
  }
}

export const travelJournalDatabase = new TravelJournalDatabase();

