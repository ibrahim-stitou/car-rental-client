import { useState, useEffect, useCallback, memo } from 'react';
import { format, getDaysInMonth, isWeekend, addDays, startOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { CheckCircle2, AlertCircle, BriefcaseBusiness, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Type definitions
type Mission = {
  id: string;
  name: string;
  color: string;
};

type DayStatus = 'worked' | 'absence' | 'weekend' | 'dayOff' | 'none';

type DayInfo = {
  date: Date;
  dayKey: string;
  day: string;
  isWeekend: boolean;
  isDayOff: boolean;
};

type DaysStatusType = {
  [key: string]: DayStatus;
};

type MissionsAllocationsType = {
  [dayKey: string]: {
    [missionId: string]: string;
  };
};

type StatsType = {
  worked: number;
  dayOff: number;
  weekend: number;
  none: number;
  absence?: number;
};

type ImprovedTimesheetProps = {
  month: Date;
  missions?: Mission[];
  daysOff?: string[];
};

//@ts-ignore
const TimesheetCell = memo(({
                              dayKey,
                              missionId,
                              value,
                              isWeekend,
                              isDayOff,
                              isAbsence,
                              missionColor,
                              onCellClick
                            }: {
  dayKey: string;
  missionId: string;
  value: string;
  isWeekend: boolean;
  isDayOff: boolean;
  isAbsence: boolean;
  missionColor: string;
  onCellClick: () => void;
}) => {
  const cellValue = value !== "0" ? value : "";
  const hasValue = value !== "0";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onCellClick}
            disabled={isWeekend || isDayOff || isAbsence}
            className={`h-8 w-full text-xs font-medium flex items-center justify-center
              ${isWeekend ? 'bg-gray-100' : isDayOff ? 'bg-amber-100' : 'bg-white'}
              ${isAbsence ? 'bg-red-100' : ''}
              ${hasValue ? `${missionColor} bg-opacity-40 text-gray-700` : ''}
              border border-gray-200 rounded transition-colors
              ${!isWeekend && !isDayOff && !isAbsence ? 'hover:bg-blue-50 hover:border-blue-200' : ''}`}
          >
            {cellValue}
          </button>
        </TooltipTrigger>
        {/*<TooltipContent>*/}
        {/*  {isWeekend ? 'Weekend' :*/}
        {/*    isDayOff ? 'Holiday' :*/}
        {/*      isAbsence ? 'Absence' :*/}
        {/*        'Click to allocate time'}*/}
        {/*</TooltipContent>*/}
      </Tooltip>
    </TooltipProvider>
  );
});

// Memoized absence cell component
const AbsenceCell = memo(({
                            dayKey,
                            isWeekend,
                            isDayOff,
                            isAbsence,
                            onCellClick
                          }: {
  dayKey: string;
  isWeekend: boolean;
  isDayOff: boolean;
  isAbsence: boolean;
  onCellClick: () => void;
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onCellClick}
            disabled={isWeekend || isDayOff}
            className={`h-8 w-full text-xs font-medium flex items-center justify-center
              ${isWeekend ? 'bg-gray-100' : isDayOff ? 'bg-amber-100' : 'bg-white'} 
              ${isAbsence ? 'bg-red-100' : ''}
              border border-gray-200 rounded transition-colors
              ${!isWeekend && !isDayOff ? 'hover:bg-red-50 hover:border-red-200' : ''}`}
          >
            {isAbsence && 'A'}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {isWeekend ? 'Weekend' :
            isDayOff ? 'Holiday' :
              'Click to declare absence'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export default function ImprovedTimesheet({
                                            month,
                                            missions = [
                                              { id: "m1", name: "Frontend Development", color: "bg-blue-500" },
                                              { id: "m2", name: "Backend Maintenance", color: "bg-green-500" },
                                              { id: "m3", name: "UI/UX Design", color: "bg-purple-500" },
                                              { id: "m4", name: "DevOps", color: "bg-orange-500" }
                                            ],
                                            daysOff = [
                                              "2025-05-01", // Labor Day
                                              "2025-05-08", // Victory Day
                                              "2025-05-29"  // Ascension Day
                                            ]
                                          }: ImprovedTimesheetProps) {
  const [daysStatus, setDaysStatus] = useState<DaysStatusType>({});
  const [missionsAllocations, setMissionsAllocations] = useState<MissionsAllocationsType>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showErrors, setShowErrors] = useState<boolean>(false);
  const [stats, setStats] = useState<StatsType>({ worked: 0, dayOff: 0, weekend: 0, none: 0 });


  const daysInMonth = getDaysInMonth(month);
  const monthStart = startOfMonth(month);
  const allDays: DayInfo[] = [];
  for (let i = 0; i < daysInMonth; i++) {
    const currentDate = addDays(monthStart, i);
    allDays.push({
      date: currentDate,
      dayKey: format(currentDate, 'yyyy-MM-dd'),
      day: format(currentDate, 'd'),
      isWeekend: isWeekend(currentDate),
      isDayOff: daysOff.includes(format(currentDate, 'yyyy-MM-dd')),
    });
  }
  useEffect(() => {
    const initialDaysStatus: DaysStatusType = {};
    const initialMissionsAllocations: MissionsAllocationsType = {};

    allDays.forEach(({ dayKey, isWeekend, isDayOff }) => {
      if (isWeekend) {
        initialDaysStatus[dayKey] = 'weekend';
      } else if (isDayOff) {
        initialDaysStatus[dayKey] = 'dayOff';
      } else {
        initialDaysStatus[dayKey] = 'none';
      }

      initialMissionsAllocations[dayKey] = {};
      missions.forEach(mission => {
        initialMissionsAllocations[dayKey][mission.id] = "0";
      });
    });

    setDaysStatus(initialDaysStatus);
    setMissionsAllocations(initialMissionsAllocations);
  }, [month, missions]);

  useEffect(() => {
    const newStats = Object.values(daysStatus).reduce((acc: StatsType, status: DayStatus) => {
      if (status) {
        acc[status] = (acc[status] || 0) + 1;
      }
      return acc;
    }, { worked: 0, dayOff: 0, weekend: 0, none: 0 });

    setStats(newStats);
  }, [daysStatus]);
  const handleMissionAllocation = useCallback((dayKey: string, missionId: string) => {
    if (daysStatus[dayKey] === 'weekend' || daysStatus[dayKey] === 'dayOff') return;

    setMissionsAllocations(prev => {
      const currentDayAllocations = { ...prev[dayKey] };
      let totalAllocation = 0;
      Object.entries(currentDayAllocations).forEach(([id, value]) => {
        if (id !== missionId) {
          totalAllocation += parseFloat(value || "0");
        }
      });

      let newValue = "0";
      const currentValue = currentDayAllocations[missionId];

      if (currentValue === "0") {
        if (totalAllocation <= 0.5) {
          newValue = "0.5";
        }
      } else if (currentValue === "0.5") {
        if (totalAllocation === 0) {
          newValue = "1";
        } else {
          newValue = "0";
        }
      } else if (currentValue === "1") {
        newValue = "0";
      }

      const updatedAllocations = {
        ...currentDayAllocations,
        [missionId]: newValue
      };

      // Update status in the next tick
      const hasAllocations = Object.values(updatedAllocations).some(
        value => parseFloat(value) > 0
      );

      setDaysStatus(prevStatus => ({
        ...prevStatus,
        [dayKey]: hasAllocations ? 'worked' : 'none'
      }));

      return {
        ...prev,
        [dayKey]: updatedAllocations
      };
    });
  }, [daysStatus]);

  const handleAbsenceClick = useCallback((dayKey: string) => {
    if (daysStatus[dayKey] === 'weekend' || daysStatus[dayKey] === 'dayOff') return;

    const isAbsent = daysStatus[dayKey] === 'absence';
    const resetAllocations: {[key: string]: string} = {};

    missions.forEach(mission => {
      resetAllocations[mission.id] = "0";
    });

    setMissionsAllocations(prev => ({
      ...prev,
      [dayKey]: resetAllocations
    }));

    setDaysStatus(prev => ({
      ...prev,
      [dayKey]: isAbsent ? 'none' : 'absence'
    }));
  }, [daysStatus, missions]);

  const handleAllocateEntireRow = useCallback((missionId: string) => {
    const workingDays = allDays.filter(day => !day.isWeekend && !day.isDayOff);
    const workingDayKeys = workingDays.map(day => day.dayKey);
    let daysWithHalfAllocation = 0;
    let daysWithFullAllocation = 0;

    workingDayKeys.forEach(dayKey => {
      const currentValue = missionsAllocations[dayKey]?.[missionId] || "0";
      if (currentValue === "0.5") daysWithHalfAllocation++;
      if (currentValue === "1") daysWithFullAllocation++;
    });

    let valueToSet = "0.5";
    if (daysWithHalfAllocation > daysWithFullAllocation) {
      valueToSet = "1";
    } else if (daysWithHalfAllocation === 0 && daysWithFullAllocation > 0) {
      valueToSet = "0";
    }

    setMissionsAllocations(prev => {
      const updatedMissionsAllocations = { ...prev };

      workingDayKeys.forEach(dayKey => {
        if (daysStatus[dayKey] !== 'absence') {
          const currentDayAllocations = { ...updatedMissionsAllocations[dayKey] };
          let totalAllocation = 0;

          Object.entries(currentDayAllocations).forEach(([id, value]) => {
            if (id !== missionId) {
              totalAllocation += parseFloat(value || "0");
            }
          });

          if ((valueToSet === "0.5" && totalAllocation <= 0.5) ||
            (valueToSet === "1" && totalAllocation === 0) ||
            valueToSet === "0") {
            updatedMissionsAllocations[dayKey] = {
              ...currentDayAllocations,
              [missionId]: valueToSet
            };
          }
        }
      });

      return updatedMissionsAllocations;
    });

    // Update statuses separately for better performance
    setDaysStatus(prev => {
      const updatedDaysStatus = { ...prev };

      workingDayKeys.forEach(dayKey => {
        if (daysStatus[dayKey] !== 'absence') {
          const currentDayAllocations = { ...missionsAllocations[dayKey] };
          currentDayAllocations[missionId] = valueToSet;

          const hasAllocations = Object.values(currentDayAllocations).some(
            value => parseFloat(value) > 0
          );

          updatedDaysStatus[dayKey] = hasAllocations ? 'worked' : 'none';
        }
      });

      return updatedDaysStatus;
    });
  }, [allDays, daysStatus, missionsAllocations]);

  const calculateMissionTotal = useCallback((missionId: string): number => {
    let total = 0;
    Object.keys(missionsAllocations).forEach(dayKey => {
      if (missionsAllocations[dayKey]?.[missionId]) {
        total += parseFloat(missionsAllocations[dayKey][missionId]);
      }
    });
    return total;
  }, [missionsAllocations]);

  const handleSubmit = useCallback(() => {
    setIsSubmitting(true);

    try {
      // Validate that all days are accounted for
      const hasUnmarkedDays = Object.entries(daysStatus).some(([day, status]) =>
        status === 'none' && !isWeekend(new Date(day)) && !daysOff.includes(day)
      );

      if (hasUnmarkedDays) {
        setShowErrors(true);
        alert("Please declare all days of the month");
        setIsSubmitting(false);
        return;
      }

      // Success! Here you would normally send the data to your API
      alert("Timesheet submitted successfully");
      console.log("Submitted timesheet:", {
        month: format(month, 'MMMM yyyy', { locale: enUS }),
        days: daysStatus,
        missionsAllocations
      });

      setShowErrors(false);
    } catch (error) {
      alert("An error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [daysStatus, missionsAllocations, month, daysOff]);

  return (
    <Card className="w-full mx-auto shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Timesheet</CardTitle>
            <CardDescription>
              Declare your worked days for the month of {format(month, 'MMMM yyyy', { locale: enUS })}
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="font-medium">Status:</div>
          <Badge variant="outline" className="flex items-center gap-1">
            <BriefcaseBusiness className="h-3 w-3" />
            <span>Worked day: {stats.worked}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-100"></div>
            <span>Holiday: {stats.dayOff}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-100"></div>
            <span>Weekend: {stats.weekend}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-100"></div>
            <span>Absence: {stats.absence || 0}</span>
          </Badge>
          {stats.none > 0 && (
            <Badge variant="outline" className={`flex items-center gap-1 ${showErrors ? 'border-red-500 text-red-500' : ''}`}>
              <AlertCircle className="h-3 w-3" />
              <span>Not declared: {stats.none}</span>
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header row with days */}
          <div className="grid grid-cols-[10rem_repeat(31,2.5rem)_4rem] gap-1 mb-1">
            <div className="font-medium text-sm py-2 text-right pr-2">Day</div>
            {allDays.map(({ day, dayKey, isWeekend, isDayOff }) => (
              <div
                key={dayKey}
                className={`text-center font-medium text-sm py-2 ${
                  isWeekend ? 'bg-gray-100' : isDayOff ? 'bg-amber-100' : ''
                } rounded`}
              >
                {day}
              </div>
            ))}
            <div className="font-medium text-sm py-2 text-center bg-gray-50 rounded">Total</div>
          </div>

          {/* Mission rows */}
          {missions.map(mission => (
            <div key={mission.id} className="grid grid-cols-[10rem_repeat(31,2.5rem)_4rem] gap-1 mb-1">
              <div className="flex items-center gap-2 text-sm font-medium pr-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 p-1 h-6 hover:bg-gray-100"
                  onClick={() => handleAllocateEntireRow(mission.id)}
                >
                  <ChevronRight className="h-3 w-3" />
                  <span className="truncate">{mission.name}</span>
                </Button>
              </div>

              {allDays.map(({ dayKey, isWeekend, isDayOff }) => (
                <TimesheetCell
                  key={`${mission.id}-${dayKey}`}
                  dayKey={dayKey}
                  missionId={mission.id}
                  value={missionsAllocations[dayKey]?.[mission.id] || "0"}
                  isWeekend={isWeekend}
                  isDayOff={isDayOff}
                  isAbsence={daysStatus[dayKey] === 'absence'}
                  missionColor={mission.color}
                  onCellClick={() => handleMissionAllocation(dayKey, mission.id)}
                />
              ))}

              {/* Total column for this mission */}
              <div className="h-8 w-full text-sm font-medium flex items-center justify-center bg-gray-50 border border-gray-200 rounded">
                {calculateMissionTotal(mission.id).toFixed(1)}
              </div>
            </div>
          ))}

          {/* Absence row */}
          <div className="grid grid-cols-[10rem_repeat(31,2.5rem)_4rem] gap-1 mt-2 border-t pt-2">
            <div className="flex items-center gap-2 text-sm font-medium pr-2 justify-end">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Absence</span>
            </div>

            {allDays.map(({ dayKey, isWeekend, isDayOff }) => (
              <AbsenceCell
                key={`absence-${dayKey}`}
                dayKey={dayKey}
                isWeekend={isWeekend}
                isDayOff={isDayOff}
                isAbsence={daysStatus[dayKey] === 'absence'}
                onCellClick={() => handleAbsenceClick(dayKey)}
              />
            ))}

            {/* Empty cell for total column in absence row */}
            <div className="h-8 w-full bg-gray-50 border border-gray-200 rounded"></div>
          </div>

          {/* Status row - visual indicators */}
          <div className="grid grid-cols-[10rem_repeat(31,2.5rem)_4rem] gap-1 mt-2 border-t pt-2">
            <div className="flex items-center gap-2 text-sm font-medium pr-2 justify-end">
              <span>Status</span>
            </div>

            {allDays.map(({ dayKey, isWeekend, isDayOff }) => {
              const status = daysStatus[dayKey];
              let statusColor = '';

              if (isWeekend) {
                statusColor = 'bg-gray-100';
              } else if (isDayOff) {
                statusColor = 'bg-amber-100';
              } else if (status === 'worked') {
                statusColor = 'bg-green-100';
              } else if (status === 'absence') {
                statusColor = 'bg-red-100';
              } else if (showErrors && status === 'none') {
                statusColor = 'bg-red-50';
              }

              return (
                <div
                  key={`status-${dayKey}`}
                  className={`h-4 w-full ${statusColor} rounded-full`}
                >
                  {showErrors && status === 'none' && !isWeekend && !isDayOff && (
                    <div className="flex justify-center">
                      <AlertCircle className="h-3 w-3 text-red-500" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty cell for total column in status row */}
            <div className="h-4 w-full bg-gray-50 rounded-full"></div>
          </div>
        </div>

        {showErrors && stats.none > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>Please declare all days of the month (except weekends and holidays)</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          <p>Click on a cell to allocate time (0 → 0.5 → 1 → 0)</p>
          <p>Each day can be split between two missions (0.5 + 0.5) or marked as absence</p>
          <p>Click on a mission name to allocate time for all working days at once</p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="flex gap-1">
                <div className="h-1 w-1 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-1 w-1 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-1 w-1 rounded-full bg-white animate-bounce"></div>
              </div>
              <span className="ml-2">Submitting...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Submit</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}