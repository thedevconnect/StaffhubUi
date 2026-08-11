import { Routes } from "@angular/router";

export const payrollRoutes: Routes = [
    {
        path: '',
        redirectTo: 'payroll-dashboard',
        pathMatch: 'full'
    },
    {
        path: 'employee-salary-preparation',
        title: 'Master Salary Preparation',
        loadComponent: () => import('../payroll/employee-salary-preparation/employee-salary-preparation').then((m) => m.EmployeeSalaryPreparation)
    },
    {
        path: 'payroll-dashboard',
        loadComponent: () => import('../dashboard/payroll-dashboard/payroll-dashboard').then(m => m.PayrollDashboard)
    },
    {
        path: 'monthly-salary-components',
        title: 'Monthly Salary Components',
        loadComponent: () => import('../payroll/monthly-salary-components/monthly-salary-components').then((m) => m.MonthlySalaryComponents)
    },
    {
        path: 'yearly-salary-components',
        title: 'Yearly Salary Components',
        loadComponent: () => import('../payroll/yearly-salary-components/yearly-salary-components').then((m) => m.YearlySalary)
    },
    {
        path: 'employee-expense-statement',
        title: 'Employee Expense Statement',
        loadComponent: () => import('../reports/employee-expense-statement/employee-expense-statement').then((m) => m.EmployeeExpenseStatement)
    }
];
