import { TripUsefulInfoCategoryEnum } from '../useful-info-category.enum';

type TripUsefulInfoBase = {
  id: string;
  name: string;
  description: string;
};

export type TripUsefulInfo =
  | (TripUsefulInfoBase & {
      category: TripUsefulInfoCategoryEnum.Shopping;
      done: boolean;
      expiration?: string;
    })
  | (TripUsefulInfoBase & {
      category: TripUsefulInfoCategoryEnum.App;
      link?: { href: string; title: string };
    })
  | (TripUsefulInfoBase & { category: TripUsefulInfoCategoryEnum.Advice });
