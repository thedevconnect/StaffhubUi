import { Routes } from '@angular/router';

export const developerRoutes: Routes = [
    { path: 'activity-master', loadComponent: () => import('../components/developer/activity-master/activity-master').then(c => c.ActivityMaster), title: 'Activity Master' },
    { path: 'menu-master', loadComponent: () => import('../components/developer/menu-master/menu-master').then(c => c.MenuMaster), title: 'Menu Master' },
    { path: 'user-role-mapping', loadComponent: () => import('../components/developer/role-activity-mapping/role-activity-mapping').then(c => c.RoleActivityMapping), title: 'Role Activity Mapping' },
    { path: 'role-activity-master', loadComponent: () => import('../components/developer/role-activity-master/role-activity-master').then(c => c.RoleActivityMaster), title: 'Role Activity Mapping' },
    { path: 'role-master', loadComponent: () => import('../components/developer/role-master/role-master').then(c => c.RoleMaster), title: 'Role Master' },

];