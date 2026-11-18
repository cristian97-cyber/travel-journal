import { Component, computed, input } from '@angular/core';
import type { Trip } from '../../../core/models/trip.model';
import type { TripUsefulInfo } from '../../../core/types/useful-info.type';
import { TripUsefulInfoCategoryEnum } from '../../../core/useful-info-category.enum';

type ShoppingInfo = Extract<TripUsefulInfo, { category: TripUsefulInfoCategoryEnum.Shopping }>;
type AppInfo = Extract<TripUsefulInfo, { category: TripUsefulInfoCategoryEnum.App }>;
type AdviceInfo = Extract<TripUsefulInfo, { category: TripUsefulInfoCategoryEnum.Advice }>;

@Component({
  selector: 'app-trip-useful-info',
  templateUrl: './trip-useful-info.component.html',
  styleUrl: './trip-useful-info.component.scss',
})
export class TripUsefulInfoComponent {
  readonly trip = input.required<Trip>();
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
}
