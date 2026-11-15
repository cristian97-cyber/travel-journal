import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.page').then((module) => module.HomePage),
    title: 'Travel Journal · I tuoi viaggi',
  },
  {
    path: 'trip/:id',
    loadComponent: () =>
      import('./pages/trip-detail/trip-detail.page').then((module) => module.TripDetailPage),
    title: 'Itinerario · Travel Journal',
  },
  { path: '**', redirectTo: '' },
];
