import { TripDay } from './trip-day.model';
import { TripUsefulInfo } from '../types/useful-info.type';

export interface Trip {
  id: string;
  title: string;
  destination: string;
  description?: string;
  startDate: string;
  endDate: string;
  importedAt: string;
  days: TripDay[];
  usefulInfo: TripUsefulInfo[];
}
