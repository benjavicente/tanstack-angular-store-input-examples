import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '1-normal-signals',
  },
  {
    path: '1-normal-signals',
    loadComponent: () =>
      import('./pages/1-normal-signals').then(
        (module) => module.NormalSignalsPage,
      ),
  },
  {
    path: '2-breaks-with-inputs',
    loadComponent: () =>
      import('./pages/2-breaks-with-inputs').then(
        (module) => module.BreaksWithInputsPage,
      ),
  },
  {
    path: '3-not-great-effects',
    loadComponent: () =>
      import('./pages/3-not-great-effects').then(
        (module) => module.NotGreatEffectsPage,
      ),
  },
  {
    path: '4-signals-are-lazy',
    loadComponent: () =>
      import('./pages/4-signals-are-lazy').then(
        (module) => module.SignalsAreLazyPage,
      ),
  },
];
