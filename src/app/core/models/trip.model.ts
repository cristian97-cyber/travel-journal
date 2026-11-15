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

export interface TripDay {
  id: string;
  date: string;
  title: string;
  summary?: string;
  stops: TripStop[];
}

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

