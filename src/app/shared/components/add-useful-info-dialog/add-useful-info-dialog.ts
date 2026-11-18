import { Component, inject } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import type {
  NewTripUsefulInfo,
  TripAppLink,
  TripUsefulInfo,
} from '../../../core/types/useful-info.type';
import { TripUsefulInfoCategoryEnum } from '../../../core/useful-info-category.enum';

export interface AddUsefulInfoDialogData {
  category?: TripUsefulInfoCategoryEnum;
  item?: TripUsefulInfo;
}

@Component({
  selector: 'app-add-useful-info-dialog',
  imports: [MatButtonModule, MatDialogModule, ReactiveFormsModule],
  templateUrl: './add-useful-info-dialog.html',
  styleUrl: './add-useful-info-dialog.scss',
})
export class AddUsefulInfoDialog {
  private readonly dialogRef = inject(MatDialogRef<AddUsefulInfoDialog, NewTripUsefulInfo>);

  readonly data = inject<AddUsefulInfoDialogData>(MAT_DIALOG_DATA);
  readonly category = TripUsefulInfoCategoryEnum;
  readonly isEditing = this.data.item !== undefined;
  readonly categoryLocked = this.data.category !== undefined || this.isEditing;
  readonly categories = [
    { value: TripUsefulInfoCategoryEnum.Shopping, label: 'Shopping' },
    { value: TripUsefulInfoCategoryEnum.App, label: 'App' },
    { value: TripUsefulInfoCategoryEnum.Advice, label: 'Advice' },
  ];
  readonly links = new FormArray<ReturnType<AddUsefulInfoDialog['createLinkForm']>>([]);
  readonly form = new FormGroup({
    category: new FormControl<TripUsefulInfoCategoryEnum | null>(
      this.data.item?.category ?? this.data.category ?? null,
      { validators: [Validators.required] },
    ),
    name: new FormControl(this.data.item?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
    description: new FormControl(this.data.item?.description ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
    expiration: new FormControl(
      this.data.item?.category === TripUsefulInfoCategoryEnum.Shopping
        ? (this.data.item.expiration ?? '')
        : '',
      { nonNullable: true },
    ),
    links: this.links,
  });

  constructor() {
    this.form.controls.category.valueChanges.subscribe((category) => {
      if (category === TripUsefulInfoCategoryEnum.App) {
        this.links.enable({ emitEvent: false });
      } else {
        this.links.disable({ emitEvent: false });
      }
    });

    if (this.data.item?.category === TripUsefulInfoCategoryEnum.App) {
      (this.data.item.links ?? []).forEach((link) => this.links.push(this.createLinkForm(link)));
    }

    if (this.form.controls.category.value === TripUsefulInfoCategoryEnum.App) {
      this.links.enable({ emitEvent: false });
    } else {
      this.links.disable({ emitEvent: false });
    }
  }

  categoryLabel(category: TripUsefulInfoCategoryEnum): string {
    return this.categories.find((option) => option.value === category)?.label ?? category;
  }

  addLink(): void {
    this.links.push(this.createLinkForm());
  }

  removeLink(index: number): void {
    this.links.removeAt(index);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const common = {
      name: value.name.trim(),
      description: value.description.trim(),
    };

    if (!value.category || !common.name || !common.description) return;

    let result: NewTripUsefulInfo;
    switch (value.category) {
      case TripUsefulInfoCategoryEnum.Shopping:
        result = {
          ...common,
          category: value.category,
          expiration: value.expiration || undefined,
        };
        break;
      case TripUsefulInfoCategoryEnum.App:
        const links: TripAppLink[] = value.links.map((link) => ({
          href: link.href.trim(),
          title: link.title.trim(),
        }));
        result = {
          ...common,
          category: value.category,
          links: links.length ? links : undefined,
        };
        break;
      case TripUsefulInfoCategoryEnum.Advice:
        result = { ...common, category: value.category };
        break;
    }

    this.dialogRef.close(result);
  }

  private createLinkForm(link?: TripAppLink) {
    return new FormGroup({
      title: new FormControl(link?.title ?? '', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/\S/)],
      }),
      href: new FormControl(link?.href ?? '', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^https?:\/\/\S+$/i)],
      }),
    });
  }
}
