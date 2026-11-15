import { TripStop } from './trip-stop.model';

export interface TripDay {
  id: string;
  date: string;
  title: string;
  summary?: string;
  stops: TripStop[];
}
