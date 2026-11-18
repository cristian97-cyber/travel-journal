import { Component, computed, inject, input, output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import type { Trip } from '../../../core/models/trip.model';
import type { NewTripUsefulInfo, TripUsefulInfo } from '../../../core/types/useful-info.type';
import { TripUsefulInfoCategoryEnum } from '../../../core/useful-info-category.enum';
import {
  AddUsefulInfoDialog,
  type AddUsefulInfoDialogData,
} from '../../../shared/components/add-useful-info-dialog/add-useful-info-dialog';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';

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
  readonly usefulInfoUpdated = output<{ id: string; input: NewTripUsefulInfo }>();
  readonly usefulInfoRemoved = output<string>();
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

  async openAddDialog(category?: TripUsefulInfoCategoryEnum): Promise<void> {
    const result = await this.openDetailsDialog({ category });
    if (result) this.usefulInfoAdded.emit(result);
  }

  async openEditDialog(item: TripUsefulInfo): Promise<void> {
    const result = await this.openDetailsDialog({ item });
    if (result) this.usefulInfoUpdated.emit({ id: item.id, input: result });
  }

  async confirmRemoval(item: TripUsefulInfo): Promise<void> {
    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmDialog, {
          autoFocus: '.confirm-dialog__cancel',
          data: {
            title: 'Eliminare questo dettaglio?',
            message: `“${item.name}” verrà rimosso dal viaggio.`,
            confirmLabel: 'Elimina dettaglio',
          },
          maxWidth: 'calc(100vw - 32px)',
          panelClass: 'app-dialog',
          width: '440px',
        })
        .afterClosed(),
    );
    if (confirmed) this.usefulInfoRemoved.emit(item.id);
  }

  private openDetailsDialog(data: AddUsefulInfoDialogData): Promise<NewTripUsefulInfo | undefined> {
    return firstValueFrom(
      this.dialog
        .open<AddUsefulInfoDialog, AddUsefulInfoDialogData, NewTripUsefulInfo>(
          AddUsefulInfoDialog,
          {
            autoFocus: data.category || data.item ? '#useful-info-name' : '#useful-info-category',
            data,
            disableClose: true,
            maxWidth: 'calc(100vw - 32px)',
            panelClass: ['app-dialog', 'useful-info-dialog'],
            width: '560px',
          },
        )
        .afterClosed(),
    );
  }
}
