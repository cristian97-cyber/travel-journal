import { TripDay } from './trip-day.model';

export interface Trip {
  id: string;
  title: string;
  destination: string;
  description?: string;
  startDate: string;
  endDate: string;
  importedAt: string;
  days: TripDay[];
}
