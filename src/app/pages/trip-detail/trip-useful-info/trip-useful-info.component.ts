import { Component, computed, inject, input, output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import type { Trip } from '../../../core/models/trip.model';
import type {
  NewTripUsefulInfo,
  TripAppLink,
  TripUsefulInfo,
} from '../../../core/types/useful-info.type';
import { TripUsefulInfoCategoryEnum } from '../../../core/useful-info-category.enum';
import {
  AddUsefulInfoDialog,
  type AddUsefulInfoDialogData,
} from '../../../shared/components/add-useful-info-dialog/add-useful-info-dialog';

type ShoppingInfo = Extract<TripUsefulInfo, { category: TripUsefulInfoCategoryEnum.Shopping }>;
type AppInfo = Extract<TripUsefulInfo, { category: TripUsefulInfoCategoryEnum.App }>;
type AdviceInfo = Extract<TripUsefulInfo, { category: TripUsefulInfoCategoryEnum.Advice }>;

@Component({
  selector: 'app-trip-useful-info',
  templateUrl: './trip-useful-info.component.html',
  styleUrl: './trip-useful-info.component.scss',
})
export class TripUsefulInfoComponent {
  private readonly dialog = inject(MatDialog);

  readonly trip = input.required<Trip>();
  readonly usefulInfoAdded = output<NewTripUsefulInfo>();
  readonly category = TripUsefulInfoCategoryEnum;
  readonly purchases = computed(() =>
    this.trip().usefulInfo.filter(
      (info): info is ShoppingInfo => info.category === TripUsefulInfoCategoryEnum.Shopping,
    ),
  );
  readonly apps = computed(() =>
    this.trip().usefulInfo.filter(
      (info): info is AppInfo => info.category === TripUsefulInfoCategoryEnum.App,
    ),
  );
  readonly advice = computed(() =>
    this.trip().usefulInfo.filter(
      (info): info is AdviceInfo => info.category === TripUsefulInfoCategoryEnum.Advice,
    ),
  );

  appLinks(item: AppInfo): TripAppLink[] {
    if (item.links?.length) return item.links;
    return item.link ? [item.link] : [];
  }

  async openAddDialog(category?: TripUsefulInfoCategoryEnum): Promise<void> {
    const result = await firstValueFrom(
      this.dialog
        .open<AddUsefulInfoDialog, AddUsefulInfoDialogData, NewTripUsefulInfo>(
          AddUsefulInfoDialog,
          {
            autoFocus: category ? '#useful-info-name' : '#useful-info-category',
            data: { category },
            disableClose: true,
            maxWidth: 'calc(100vw - 32px)',
            panelClass: ['app-dialog', 'useful-info-dialog'],
            width: '560px',
          },
        )
        .afterClosed(),
    );
    if (result) this.usefulInfoAdded.emit(result);
  }
}
