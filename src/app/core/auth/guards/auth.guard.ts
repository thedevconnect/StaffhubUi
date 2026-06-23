import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');

  if (!token) {
    return router.createUrlTree(['/login']);
  }

  const decoded = authService.decodeToken(token);
  
  if (decoded && decoded.exp) {
    const isExpired = Date.now() >= decoded.exp * 1000;
    if (isExpired) {
      authService.logout();
      return router.createUrlTree(['/login']);
    }
  }

  const targetUrl = state.url.toLowerCase();
  const role = (decoded?.role || authService.selectedRoleId() || '').toLowerCase();

  if (targetUrl.includes('/hradmin') && role !== 'hradmin' && role !== 'hr_admin') {
    return router.createUrlTree([authService.getDashboardRoute()]);
  }

  return authService.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isAuthenticated() ? router.createUrlTree([authService.getDashboardRoute()]) : true;
};
