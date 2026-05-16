'use client';

import { format, getDaysInMonth, isWeekend, addDays, startOfMonth, getDay } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';

type DayStatus = 'worked' | 'absent' | 'weekend' | 'vacation' | 'daysoff' | 'none';

interface MonthlyTimesheetProps {
  selectedMonth: Date;
  daysOff?: string[];
  onDaysChange?: (days: Record<string, string>) => void;
  showValidationErrors?: boolean;
}

export default function MonthlyTimesheet({
                                           selectedMonth,
                                           daysOff = [],
                                           onDaysChange,
                                           showValidationErrors = false,
                                         }: MonthlyTimesheetProps) {
  const [daysStatus, setDaysStatus] = useState<Record<string, DayStatus>>({});
  const [stats, setStats] = useState({
    worked: 0,
    absent: 0,
    weekend: 0,
    vacation: 0,
    daysoff: 0,
    none: 0,
  });

  // Initialisation des jours du mois
  useEffect(() => {
    const initialDaysStatus: Record<string, DayStatus> = {};
    const firstDay = startOfMonth(selectedMonth);
    const daysInMonth = getDaysInMonth(selectedMonth);

    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = addDays(firstDay, i);
      const dayKey = format(currentDate, 'yyyy-MM-dd');

      if (isWeekend(currentDate)) {
        initialDaysStatus[dayKey] = 'weekend';
      } else if (daysOff.includes(dayKey)) {
        initialDaysStatus[dayKey] = 'daysoff';
      } else {
        initialDaysStatus[dayKey] = 'none';
      }
    }

    setDaysStatus(initialDaysStatus);
  }, [selectedMonth, daysOff]);

  // Calcul des stats + appel de onDaysChange
  useEffect(() => {
    const newStats = Object.values(daysStatus).reduce(
      (acc, status) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { worked: 0, absent: 0, weekend: 0, vacation: 0, daysoff: 0, none: 0 }
    );

    setStats(newStats);

    if (onDaysChange && Object.keys(daysStatus).length > 0) {
      onDaysChange(daysStatus);
    }
  }, [daysStatus, onDaysChange]);

  // Changement de statut au clic
  const toggleDayStatus = (day: string) => {
    setDaysStatus((prevDaysStatus) => {
      const currentStatus = prevDaysStatus[day];

      if (currentStatus === 'weekend' || currentStatus === 'daysoff') {
        return prevDaysStatus;
      }

      const statusOrder: DayStatus[] = ['none', 'worked', 'absent', 'vacation'];
      let currentIndex = statusOrder.indexOf(currentStatus);
      if (currentIndex === -1) currentIndex = 0;

      const nextIndex = (currentIndex + 1) % statusOrder.length;
      const newStatusValue = statusOrder[nextIndex];

      return {
        ...prevDaysStatus,
        [day]: newStatusValue,
      };
    });
  };

  // Rendu des jours
  const renderDays = () => {
    const days = [];
    const firstDay = startOfMonth(selectedMonth);
    const daysInMonth = getDaysInMonth(selectedMonth);
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // En-têtes des jours
    dayNames.forEach((dayName) => {
      days.push(
        <div key={`header-${dayName}`} className="text-center font-medium text-sm py-2">
          {dayName}
        </div>
      );
    });

    // Jours vides avant le début du mois
    const firstDayOfWeek = getDay(firstDay);
    const emptyDays = (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1);
    for (let i = 0; i < emptyDays; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 border border-transparent"></div>);
    }

    // Jours du mois
    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = addDays(firstDay, i);
      const dayKey = format(currentDate, 'yyyy-MM-dd');
      const dayNum = format(currentDate, 'd');
      const isWeekendDay = isWeekend(currentDate);
      const isDayOff = daysOff.includes(dayKey);
      const status = daysStatus[dayKey] || 'none';

      let bgColor = 'bg-white';
      let hoverEffect = 'hover:bg-purple-100';
      let textColor = '';
      let borderColor = 'border-gray-100';

      if (status === 'worked') {
        bgColor = 'bg-purple-500';
        hoverEffect = 'hover:bg-purple-600';
        textColor = 'text-white';
      } else if (status === 'absent') {
        bgColor = 'bg-amber-500';
        hoverEffect = 'hover:bg-amber-600';
        textColor = 'text-white';
      } else if (status === 'vacation') {
        bgColor = 'bg-green-500';
        hoverEffect = 'hover:bg-green-600';
        textColor = 'text-white';
      } else if (isDayOff) {
        bgColor = 'bg-gray-300';
        hoverEffect = '';
        borderColor = 'border-gray-300';
      } else if (isWeekendDay) {
        bgColor = 'bg-gray-200';
        hoverEffect = '';
        borderColor = 'border-gray-200';
      } else if (status === 'none' && showValidationErrors) {
        bgColor = 'bg-red-50';
        borderColor = 'border-red-300';
        hoverEffect = 'hover:bg-red-100';
      }

      days.push(
        <TooltipProvider key={dayKey}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                onClick={() => !isWeekendDay && !isDayOff && toggleDayStatus(dayKey)}
                className={`h-12 w-full flex items-center justify-center ${bgColor} ${hoverEffect} border ${borderColor} rounded-md transition-colors ${!isWeekendDay && !isDayOff ? 'cursor-pointer' : 'cursor-not-allowed'} ${status === 'none' && showValidationErrors ? 'animate-pulse' : ''}`}
              >
                <span className={`font-medium ${textColor}`}>{dayNum}</span>
                {status === 'none' && showValidationErrors && (
                  <span className="absolute top-1 right-1">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isWeekendDay
                ? 'Weekend'
                : isDayOff
                  ? 'Public Holiday'
                  : status === 'worked'
                    ? 'Worked'
                    : status === 'absent'
                      ? 'Absent'
                      : status === 'vacation'
                        ? 'Vacation'
                        : (showValidationErrors ? '⚠️ Unmarked - Please select a status' : 'Unmarked')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return days;
  };

  return (
    <div className="w-full mx-auto p-0">
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mt-1 mb-0">
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Worked: {stats.worked}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Absent: {stats.absent}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Vacation: {stats.vacation}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span>Public Holidays: {stats.daysoff}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <span>Weekend: {stats.weekend}</span>
          </Badge>
          {stats.none > 0 && (
            <Badge
              variant="outline"
              className={`flex items-center gap-1 ${
                showValidationErrors ? 'border-red-500 text-red-500' : ''
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  showValidationErrors ? 'bg-red-500' : 'bg-gray-100'
                }`}
              ></div>
              <span>Unmarked: {stats.none}</span>
            </Badge>
          )}
        </div>
      </div>

      <div>
        <div className="grid grid-cols-7 gap-1 border rounded-md p-2">
          {renderDays()}
        </div>

        {showValidationErrors && stats.none > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>
              <strong>Attention:</strong> Veuillez marquer tous les jours ouvrables du mois
              (il reste {stats.none} jour{stats.none > 1 ? 's' : ''} non marqué{stats.none > 1 ? 's' : ''}).
            </span>
          </div>
        )}
      </div>
    </div>
  );
}