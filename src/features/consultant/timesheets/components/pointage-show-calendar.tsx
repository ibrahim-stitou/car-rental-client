import { useState } from 'react';
import { Calendar, Eye, Download, Printer } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

// This type matches the data structure from MonthlyTimesheet
interface TimesheetData {
  month: Date;
  days: Record<string, 'worked' | 'absent' | 'weekend' | 'vacation' | 'daysoff' | 'none'>;
}

interface TimesheetDisplayProps {
  timesheets: TimesheetData[];
  onViewDetails?: (timesheet: TimesheetData) => void;
}

export default function TimesheetDisplay({ timesheets, onViewDetails }: TimesheetDisplayProps) {
  const [activeTab, setActiveTab] = useState<string>("calendar");

  // Sort timesheets by month (most recent first)
  const sortedTimesheets = [...timesheets].sort((a, b) =>
    new Date(b.month).getTime() - new Date(a.month).getTime()
  );

  // Get the most recent timesheet
  const currentTimesheet = sortedTimesheets.length > 0 ? sortedTimesheets[0] : null;

  // Utility functions to replace date-fns
  const formatDate = (date: Date | string, format: string): string => {
    const d = new Date(date);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (format === 'MMMM yyyy') {
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    if (format === 'MMM d, yyyy') {
      return `${shortMonths[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
    if (format === 'EEEE, MMM d') {
      return `${days[d.getDay()]}, ${shortMonths[d.getMonth()]} ${d.getDate()}`;
    }
    if (format === 'yyyy-MM-dd') {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    if (format === 'd') {
      return String(d.getDate());
    }
    return d.toLocaleDateString();
  };

  const getDaysInMonth = (date: Date | string) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  };

  const startOfMonth = (date: Date | string) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  };

  const addDays = (date: Date | string, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const isWeekend = (date: Date | string) => {
    const d = new Date(date);
    return d.getDay() === 0 || d.getDay() === 6;
  };

  if (!currentTimesheet) {
    return (
      <Card className="w-full mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Timesheet History</CardTitle>
          <CardDescription>No timesheet declarations found</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p>No timesheet data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics for the current timesheet
  const stats = Object.values(currentTimesheet.days).reduce((acc, status) => {
    if (status) {
      acc[status] = (acc[status] || 0) + 1;
    }
    return acc;
  }, { worked: 0, absent: 0, weekend: 0, vacation: 0, daysoff: 0, none: 0 });

  const renderCalendarView = (timesheet: TimesheetData) => {
    const daysInMonth = getDaysInMonth(timesheet.month);
    const firstDay = startOfMonth(timesheet.month);
    const days = [];

    // Weekday headers
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    dayNames.forEach(day => {
      days.push(
        <div key={`header-${day}`} className="text-center font-medium text-sm py-2">
          {day}
        </div>
      );
    });

    // Calculate empty days at the start
    const firstDayOfWeek = firstDay.getDay();
    const emptyDays = (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1);

    for (let i = 0; i < emptyDays; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 border border-transparent"></div>);
    }

    // Render days
    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = addDays(firstDay, i);
      const dayKey = formatDate(currentDate, 'yyyy-MM-dd');
      const dayNum = formatDate(currentDate, 'd');
      const status = timesheet.days[dayKey] || 'none';

      let bgColor = 'bg-white';
      let textColor = '';
      let borderColor = 'border-gray-100';

      if (status === 'worked') {
        bgColor = 'bg-purple-500';
        textColor = 'text-white';
      } else if (status === 'absent') {
        bgColor = 'bg-amber-500';
        textColor = 'text-white';
      } else if (status === 'vacation') {
        bgColor = 'bg-green-500';
        textColor = 'text-white';
      } else if (status === 'daysoff') {
        bgColor = 'bg-gray-300';
        borderColor = 'border-gray-300';
      } else if (status === 'weekend') {
        bgColor = 'bg-gray-200';
        borderColor = 'border-gray-200';
      }

      days.push(
        <TooltipProvider key={dayKey}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`h-12 w-full flex items-center justify-center ${bgColor} border ${borderColor} rounded-md`}
              >
                <span className={`font-medium ${textColor}`}>{dayNum}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {status === 'weekend' ? 'Weekend' :
                status === 'daysoff' ? 'Public Holiday' :
                  status === 'worked' ? 'Worked' :
                    status === 'absent' ? 'Absent' :
                      status === 'vacation' ? 'Vacation' : 'Unmarked'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    );
  };

  const renderListView = (timesheet: TimesheetData) => {
    const daysInMonth = getDaysInMonth(timesheet.month);
    const firstDay = startOfMonth(timesheet.month);
    const workItems = [];

    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = addDays(firstDay, i);
      const dayKey = formatDate(currentDate, 'yyyy-MM-dd');
      const status = timesheet.days[dayKey] || 'none';

      // Skip weekends in list view
      if (status === 'weekend') continue;

      let statusColor = '';
      let statusText = '';

      if (status === 'worked') {
        statusColor = 'bg-purple-500';
        statusText = 'Worked';
      } else if (status === 'absent') {
        statusColor = 'bg-amber-500';
        statusText = 'Absent';
      } else if (status === 'vacation') {
        statusColor = 'bg-green-500';
        statusText = 'Vacation';
      } else if (status === 'daysoff') {
        statusColor = 'bg-gray-300';
        statusText = 'Public Holiday';
      } else {
        statusColor = 'bg-gray-100';
        statusText = 'Unmarked';
      }

      workItems.push(
        <div key={dayKey} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
            <span>{formatDate(currentDate, 'EEEE, MMM d')}</span>
          </div>
          <Badge variant={status === 'none' ? 'outline' : 'secondary'}>
            {statusText}
          </Badge>
        </div>
      );
    }

    return (
      <div className="max-h-96 overflow-y-auto pr-2">
        {workItems}
      </div>
    );
  };

  const renderTimesheetHistory = () => {
    return (
      <div className="max-h-96 overflow-y-auto">
        {sortedTimesheets.map((timesheet, index) => {
          const workedDays = Object.values(timesheet.days).filter(s => s === 'worked').length;
          const totalWorkingDays = Object.values(timesheet.days).filter(s => !['weekend', 'daysoff'].includes(s)).length;

          return (
            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <h3 className="font-medium">
                  {formatDate(timesheet.month, 'MMMM yyyy')}
                </h3>
                <p className="text-sm text-gray-500">
                  {workedDays} days worked out of {totalWorkingDays} working days
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails && onViewDetails(timesheet)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="w-full mx-auto shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">Timesheet History</CardTitle>
            <CardDescription>
              Viewing timesheet for {formatDate(currentTimesheet.month, 'MMMM yyyy')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Worked: {stats.worked || 0}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Absent: {stats.absent || 0}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Vacation: {stats.vacation || 0}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span>Public Holidays: {stats.daysoff || 0}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <span>Weekend: {stats.weekend || 0}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-0">
            {renderCalendarView(currentTimesheet)}
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            {renderListView(currentTimesheet)}
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            {renderTimesheetHistory()}
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Last updated: {formatDate(new Date(), 'MMM d, yyyy')}
        </p>
        {onViewDetails && (
          <Button
            onClick={() => onViewDetails(currentTimesheet)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            <span>View Details</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}