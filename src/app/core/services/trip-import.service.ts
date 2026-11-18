import { Injectable } from '@angular/core';
import Ajv, { type ErrorObject, type JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';
import { strFromU8, unzipSync } from 'fflate';
import type { Trip } from '../models/trip.model';
import { TripDay } from '../models/trip-day.model';
import { TripStop } from '../models/trip-stop.model';
import type { TripAppLink, TripUsefulInfo } from '../types/useful-info.type';
import { TripUsefulInfoCategoryEnum } from '../useful-info-category.enum';

type TripJsonUsefulInfoBase = {
  id?: string;
  name: string;
  description: string;
};

type TripJsonUsefulInfo =
  | (TripJsonUsefulInfoBase & {
      category: TripUsefulInfoCategoryEnum.Shopping;
      done?: boolean;
      expiration?: string;
    })
  | (TripJsonUsefulInfoBase & {
      category: TripUsefulInfoCategoryEnum.App;
      link?: { href: string; title: string };
      links?: TripAppLink[];
    })
  | (TripJsonUsefulInfoBase & { category: TripUsefulInfoCategoryEnum.Advice });

interface TripJsonStop {
  id?: string;
  title?: string;
  name?: string;
  location?: string;
  address?: string;
  time?: string;
  duration?: string;
  transport?: string;
  description?: string;
  notes?: string;
  imageUrl?: string;
  toBeBooked?: boolean;
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
  usefulInfo?: TripJsonUsefulInfo[];
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
    usefulInfo: {
      type: 'array',
      items: {
        oneOf: [
          {
            type: 'object',
            required: ['category', 'name', 'description'],
            properties: {
              id: { type: 'string', minLength: 1 },
              category: { const: TripUsefulInfoCategoryEnum.Shopping },
              name: { type: 'string', minLength: 1 },
              description: { type: 'string', minLength: 1 },
              done: { type: 'boolean' },
              expiration: { type: 'string', minLength: 1 },
            },
            additionalProperties: true,
          },
          {
            type: 'object',
            required: ['category', 'name', 'description'],
            properties: {
              id: { type: 'string', minLength: 1 },
              category: { const: TripUsefulInfoCategoryEnum.App },
              name: { type: 'string', minLength: 1 },
              description: { type: 'string', minLength: 1 },
              link: {
                type: 'object',
                required: ['href', 'title'],
                properties: {
                  href: { type: 'string', format: 'uri' },
                  title: { type: 'string', minLength: 1 },
                },
                additionalProperties: true,
              },
              links: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['href', 'title'],
                  properties: {
                    href: { type: 'string', format: 'uri' },
                    title: { type: 'string', minLength: 1 },
                  },
                  additionalProperties: true,
                },
              },
            },
            additionalProperties: true,
          },
          {
            type: 'object',
            required: ['category', 'name', 'description'],
            properties: {
              id: { type: 'string', minLength: 1 },
              category: { const: TripUsefulInfoCategoryEnum.Advice },
              name: { type: 'string', minLength: 1 },
              description: { type: 'string', minLength: 1 },
            },
            additionalProperties: true,
          },
        ],
      },
    },
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
                transport: { type: 'string' },
                description: { type: 'string' },
                notes: { type: 'string' },
                imageUrl: { type: 'string', format: 'uri' },
                toBeBooked: { type: 'boolean' },
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
      usefulInfo: (input.usefulInfo ?? []).map((info, index) =>
        this.normalizeUsefulInfo(info, index),
      ),
    };
  }

  private normalizeUsefulInfo(info: TripJsonUsefulInfo, index: number): TripUsefulInfo {
    const common = {
      id: info.id?.trim() || this.createId(`useful-info-${index + 1}`),
      name: info.name.trim(),
      description: info.description.trim(),
    };

    switch (info.category) {
      case TripUsefulInfoCategoryEnum.Shopping:
        return {
          ...common,
          category: info.category,
          done: info.done ?? false,
          expiration: info.expiration?.trim() || undefined,
        };
      case TripUsefulInfoCategoryEnum.App:
        const links =
          info.links?.map((link) => ({
            href: link.href.trim(),
            title: link.title.trim(),
          })) ??
          (info.link
            ? [
                {
                  href: info.link.href.trim(),
                  title: info.link.title.trim(),
                },
              ]
            : []);
        return {
          ...common,
          category: info.category,
          links: links.length ? links : undefined,
        };
      case TripUsefulInfoCategoryEnum.Advice:
        return { ...common, category: info.category };
    }
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
    const coordinates =
      stop.coordinates ??
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
      transport: stop.transport?.trim() || undefined,
      description: (stop.description ?? stop.notes)?.trim() || undefined,
      imageUrl: stop.imageUrl?.trim() || undefined,
      toBeBooked: stop.toBeBooked,
      coordinates,
    };
  }

  private createId(prefix: string): string {
    const id =
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${id}`;
  }

  private formatValidationErrors(errors: ErrorObject[] | null | undefined): string {
    const first = errors?.[0];
    if (!first) return 'Il file trip.json non rispetta lo schema previsto.';
    const location = first.instancePath || 'radice';
    return `trip.json non valido: ${location} ${first.message ?? 'non è valido'}.`;
  }
}
