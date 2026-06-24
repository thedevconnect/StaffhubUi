import { Routes } from "@angular/router";




export const payrollRoutes: Routes = [
    {
        path: 'monthly-salary',
        loadComponent: () => import('../components/payroll/monthly-salary/monthly-salary').then(m => m.MonthlySalary)
    }

    // {  path: 'employee-expense-statement',
    //     loadComponent: () => import('../reports/employee-expense-statement/employee-expense-statement').then((m) => m.EmployeeExpenseStatement)
    // },
    // {  path: 'yearly-salary-components',
    //     loadComponent: () => import('../payroll/yearly-salary-components/yearly-salary-components').then((m) => m.YearlySalary)
    // },
    // {  path: 'monthly-salary-components',
    //     loadComponent: () => import('../payroll/monthly-salary-components/monthly-salary-components').then((m) => m.MonthlySalaryComponents)
    // },
    // {  path: 'monthly-salary-preparation',
    //     loadComponent: () => import('../payroll/monthly-salary-preparation/monthly-salary-preparation').then((m) => m.MonthlySalaryPreparation)
    // },
    // {   path: 'monthly-salary-approval',
    //     loadComponent: () => import('../payroll/monthly-salary-approval/monthly-salary-approval').then((m) => m.MonthlySalaryApproval)
    // },
    // {  path: 'employee-salary-preparation',
    //     loadComponent: () => import('../payroll/employee-salary-preparation/employee-salary-preparation').then((m) => m.EmployeeSalaryPreparation)
    // },

];
