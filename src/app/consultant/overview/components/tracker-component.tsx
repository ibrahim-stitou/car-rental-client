'use client';

import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface MonthData {
  month: string;
  invoice: number;
  payment: number;
  managementFees: number;
  employeeSocialContribution: number;
  employerSocialContribution: number;
  netSalary: number;
  flatRateExpenses: number;
  mileageExpenses: number;
  otherExpenses: number;
  effectiveBalance: number;
  subcontractorInvoices: number;
  insuranceFees: number;
  thirteenthMonth: number;
  chequeRepas: number;
  taxes: number;
  paymentStatus?: 'paid' | 'unpaid' | null;
}

interface ExpenseRow {
  name: string;
  key: keyof MonthData;
  icon: React.ReactNode;
  color: string;
  style?: string;
}

interface ExpensesByMonthProps {
  activeYear: string;
  salaryData: { [year: string]: MonthData[] };
  expenseRows: ExpenseRow[];
  calculateColumnTotal: (field: keyof MonthData) => number;
  formatCurrency: (value: string | number | 'paid' | 'unpaid') => string;
  t: (key: string) => string;
}

export default function ExpensesByMonth({
                                          activeYear,
                                          salaryData,
                                          expenseRows,
                                          calculateColumnTotal,
                                          formatCurrency,
                                          t
                                        }: ExpensesByMonthProps) {
  const renderMonthName = (monthNumber: number) => {
    return t(`common.months.${monthNumber}`);
  };
  return (
    <Card className='shadow-lg transition-shadow hover:shadow-xl p-0 rounded-md'>
      <CardHeader className='bg-gray-50 p-6 pb-0'>
        <CardTitle className='flex items-center text-xl font-semibold text-gray-800'>
          <Calendar className='mr-2 h-5 w-5 text-indigo-600' />
          {t('consultant.tracker.expenses.breakdown')} {activeYear}
        </CardTitle>
      </CardHeader>
      <div className='overflow-x-auto p-6 pt-0'>
        <table className='w-full text-sm border-none'>
          <thead>
          <tr className='border-b border-gray-200'>
            <th className='px-4 py-3 text-left font-semibold text-gray-600'>

            </th>
            {salaryData[activeYear]?.map((monthData) => (
              <th
                key={monthData.month}
                className='px-4 py-3 text-right font-semibold text-gray-600'
              >
                {t(`common.months.${monthData.month}`)} {/* // ici les mois sont affichés*/}
              </th>
            ))}
            <th className='px-4 py-3 text-right font-semibold text-gray-600'>
              {t('consultant.tracker.expenses.total')}
            </th>
          </tr>
          </thead>
          <tbody>
          {expenseRows.map((row) => (
            <tr
              key={row.key}
              className={`border-b border-gray-100 hover:bg-gray-50 ${row?.style}`}
            >
              <td className='flex items-center gap-2 px-4 py-3 font-medium text-gray-700'>
                {row.name}
              </td>
              {salaryData[activeYear]?.map((monthData) => (
                <td
                  key={`${row.key}-${monthData.month}`}
                  className={`px-4 py-3 text-right ${row.color}`}
                >
                  {formatCurrency(monthData[row.key] || 0)}
                </td>
              ))}
              <td
                className={`px-4 py-3 text-right font-medium ${row.color}`}
              >
                {formatCurrency(calculateColumnTotal(row.key))}
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}