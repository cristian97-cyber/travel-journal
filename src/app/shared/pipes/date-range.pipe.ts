import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateRange' })
export class DateRangePipe implements PipeTransform {
  transform(startDate: string, endDate: string): string {
    const formatter = new Intl.DateTimeFormat('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
    const start = formatter.format(new Date(`${startDate}T00:00:00Z`));
    if (startDate === endDate) return start;
    return `${start} – ${formatter.format(new Date(`${endDate}T00:00:00Z`))}`;
  }
}

