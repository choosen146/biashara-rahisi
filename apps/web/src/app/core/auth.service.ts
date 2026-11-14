import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Perm } from './models';
import { Store } from './store';

export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  return store.membership() ? true : inject(Router).parseUrl('/login');
};

export const guestGuard: CanActivateFn = () => {
  const store = inject(Store);
  return store.membership() ? inject(Router).parseUrl('/') : true;
};

/** Route-level permission check; the store enforces the same rule on every mutation. */
export const permGuard: CanActivateFn = (route) => {
  const store = inject(Store);
  const perm = route.data['perm'] as Perm | undefined;
  return !perm || store.can(perm) ? true : inject(Router).parseUrl('/forbidden');
};
