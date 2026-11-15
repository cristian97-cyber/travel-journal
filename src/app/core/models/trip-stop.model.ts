export interface TripStop {
  id: string;
  title: string;
  location: string;
  address?: string;
  time?: string;
  duration?: string;
  description?: string;
  imageUrl?: string;
  toBeBooked?: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}
