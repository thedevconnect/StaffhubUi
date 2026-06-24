import { Routes } from '@angular/router';

export const developerRoutes: Routes = [
    { path: 'activity-master', loadComponent: () => import('../components/developer/activity-master/activity-master').then(c => c.ActivityMaster), title: 'Activity Master' },

];