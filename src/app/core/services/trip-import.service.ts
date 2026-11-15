import { Injectable } from '@angular/core';
import Ajv, { type ErrorObject, type JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';
import { strFromU8, unzipSync } from 'fflate';
import type { Trip, TripDay, TripStop } from '../models/trip.model';

interface TripJsonStop {
  id?: string;
  title?: string;
  name?: string;
  location?: string;
  address?: string;
  time?: string;
  duration?: string;
  description?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: { latitude: number; longitude: number };
}

interface TripJsonDay {
  id?: string;
  date: string;
  title?: string;
  name?: string;
  summary?: string;
  notes?: string;
  stops: TripJsonStop[];
}

interface TripJson {
  id?: string;
  title?: string;
  name?: string;
  destination?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  days: TripJsonDay[];
}

const tripSchema = {
  type: 'object',
  required: ['days'],
  anyOf: [{ required: ['title'] }, { required: ['name'] }],
  properties: {
    id: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
    destination: { type: 'string' },
    description: { type: 'string' },
    startDate: { type: 'string', format: 'date' },
    endDate: { type: 'string', format: 'date' },
    days: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['date', 'stops'],
        properties: {
          id: { type: 'string', minLength: 1 },
          date: { type: 'string', format: 'date' },
          title: { type: 'string' },
          name: { type: 'string' },
          summary: { type: 'string' },
          notes: { type: 'string' },
          stops: {
            type: 'array',
            items: {
              type: 'object',
              anyOf: [{ required: ['title'] }, { required: ['name'] }],
              properties: {
                id: { type: 'string', minLength: 1 },
                title: { type: 'string', minLength: 1 },
                name: { type: 'string', minLength: 1 },
                location: { type: 'string' },
                address: { type: 'string' },
                time: { type: 'string' },
                duration: { type: 'string' },
                description: { type: 'string' },
                notes: { type: 'string' },
                latitude: { type: 'number', minimum: -90, maximum: 90 },
                longitude: { type: 'number', minimum: -180, maximum: 180 },
                coordinates: {
                  type: 'object',
                  required: ['latitude', 'longitude'],
                  properties: {
                    latitude: { type: 'number', minimum: -90, maximum: 90 },
                    longitude: { type: 'number', minimum: -180, maximum: 180 },
                  },
                  additionalProperties: true,
                },
              },
              additionalProperties: true,
            },
          },
        },
        additionalProperties: true,
      },
    },
  },
  additionalProperties: true,
} as const;

export class TripImportError extends Error {}

@Injectable({ providedIn: 'root' })
export class TripImportService {
  private readonly validate: ReturnType<Ajv['compile']>;

  constructor() {
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    this.validate = ajv.compile(tripSchema as unknown as JSONSchemaType<TripJson>);
  }

  async fromZip(file: File): Promise<Trip> {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      throw new TripImportError('Seleziona un archivio in formato .zip.');
    }

    if (file.size > 50 * 1024 * 1024) {
      throw new TripImportError('L’archivio supera il limite di 50 MB.');
    }

    let entries: Record<string, Uint8Array>;
    try {
      entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
    } catch {
      throw new TripImportError('Non è stato possibile leggere l’archivio ZIP.');
    }

    const tripEntry = Object.entries(entries).find(
      ([path]) => path.split('/').at(-1)?.toLowerCase() === 'trip.json',
    );
    if (!tripEntry) {
      throw new TripImportError('Nell’archivio non è presente il file trip.json.');
    }

    let input: unknown;
    try {
      input = JSON.parse(strFromU8(tripEntry[1]));
    } catch {
      throw new TripImportError('Il file trip.json non contiene JSON valido.');
    }

    if (!this.validate(input)) {
      throw new TripImportError(this.formatValidationErrors(this.validate.errors));
    }

    return this.normalize(input as TripJson);
  }

  private normalize(input: TripJson): Trip {
    const days = input.days
      .map((day, dayIndex) => this.normalizeDay(day, dayIndex))
      .sort((left, right) => left.date.localeCompare(right.date));
    const title = (input.title ?? input.name ?? '').trim();
    const startDate = input.startDate ?? days[0].date;
    const endDate = input.endDate ?? days.at(-1)?.date ?? startDate;

    return {
      id: input.id?.trim() || this.createId('trip'),
      title,
      destination: input.destination?.trim() || title,
      description: input.description?.trim() || undefined,
      startDate,
      endDate,
      importedAt: new Date().toISOString(),
      days,
    };
  }

  private normalizeDay(day: TripJsonDay, index: number): TripDay {
    return {
      id: day.id?.trim() || this.createId(`day-${index + 1}`),
      date: day.date,
      title: (day.title ?? day.name)?.trim() || `Giorno ${index + 1}`,
      summary: (day.summary ?? day.notes)?.trim() || undefined,
      stops: day.stops.map((stop, stopIndex) => this.normalizeStop(stop, stopIndex)),
    };
  }

  private normalizeStop(stop: TripJsonStop, index: number): TripStop {
    const coordinates = stop.coordinates ??
      (stop.latitude !== undefined && stop.longitude !== undefined
        ? { latitude: stop.latitude, longitude: stop.longitude }
        : undefined);
    return {
      id: stop.id?.trim() || this.createId(`stop-${index + 1}`),
      title: (stop.title ?? stop.name ?? '').trim(),
      location: stop.location?.trim() || stop.address?.trim() || '',
      address: stop.address?.trim() || undefined,
      time: stop.time?.trim() || undefined,
      duration: stop.duration?.trim() || undefined,
      description: (stop.description ?? stop.notes)?.trim() || undefined,
      coordinates,
    };
  }

  private createId(prefix: string): string {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${id}`;
  }

  private formatValidationErrors(errors: ErrorObject[] | null | undefined): string {
    const first = errors?.[0];
    if (!first) return 'Il file trip.json non rispetta lo schema previsto.';
    const location = first.instancePath || 'radice';
    return `trip.json non valido: ${location} ${first.message ?? 'non è valido'}.`;
  }
}

