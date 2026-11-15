export interface TripStop {
  id: string;
  title: string;
  location: string;
  address?: string;
  time?: string;
  duration?: string;
  description?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}
