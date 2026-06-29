import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');

  console.log('authGuard called for:', state.url);
  console.log('token exists:', !!token);

  if (!token) {
    console.log('No token, redirecting to login');
    return router.createUrlTree(['/login']);
  }

  const decoded = authService.decodeToken(token);
  console.log('decoded token:', decoded);
  
  if (decoded && decoded.exp) {
    const isExpired = Date.now() >= decoded.exp * 1000;
    if (isExpired) {
      console.log('Token is expired, redirecting to login');
      authService.logout();
      return router.createUrlTree(['/login']);
    }
  }

  const targetUrl = state.url.toLowerCase();
  const activeRole = authService.selectedRoleId().toLowerCase();

  console.log('targetUrl:', targetUrl, 'activeRole:', activeRole);

  if (targetUrl.includes('/hradmin') && activeRole !== 'hradmin' && activeRole !== 'hr_admin') {
    console.log('HR Admin access denied, redirecting to dashboard');
    return router.createUrlTree([authService.getDashboardRoute()]);
  }

  if (targetUrl.includes('/ess') && activeRole !== 'ess') {
    console.log('ESS access denied, redirecting to dashboard');
    return router.createUrlTree([authService.getDashboardRoute()]);
  }

  if (targetUrl.includes('/developer') && activeRole !== 'developer') {
    console.log('Developer access denied, redirecting to dashboard');
    return router.createUrlTree([authService.getDashboardRoute()]);
  }

  if (targetUrl.includes('/superadmin') && activeRole !== 'superadmin' && activeRole !== 'super_admin') {
    console.log('Super Admin access denied, redirecting to dashboard');
    return router.createUrlTree([authService.getDashboardRoute()]);
  }

  const isAuth = authService.isAuthenticated();
  console.log('isAuthenticated:', isAuth);

  return isAuth ? true : router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isAuthenticated() ? router.createUrlTree([authService.getDashboardRoute()]) : true;
};
