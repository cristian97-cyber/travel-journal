import { TripUsefulInfoCategoryEnum } from '../useful-info-category.enum';

type TripUsefulInfoBase = {
  id: string;
  name: string;
  description: string;
};

export interface TripAppLink {
  href: string;
  title: string;
}

export type TripUsefulInfo =
  | (TripUsefulInfoBase & {
      category: TripUsefulInfoCategoryEnum.Shopping;
      done: boolean;
      expiration?: string;
    })
  | (TripUsefulInfoBase & {
      category: TripUsefulInfoCategoryEnum.App;
      links?: TripAppLink[];
      /** Link legacy mantenuto per i viaggi già presenti nel database. */
      link?: { href: string; title: string };
    })
  | (TripUsefulInfoBase & { category: TripUsefulInfoCategoryEnum.Advice });

type NewTripUsefulInfoBase = Omit<TripUsefulInfoBase, 'id'>;

export type NewTripUsefulInfo =
  | (NewTripUsefulInfoBase & {
      category: TripUsefulInfoCategoryEnum.Shopping;
      expiration?: string;
    })
  | (NewTripUsefulInfoBase & {
      category: TripUsefulInfoCategoryEnum.App;
      links?: TripAppLink[];
    })
  | (NewTripUsefulInfoBase & { category: TripUsefulInfoCategoryEnum.Advice });
