import { ConsultantTimesheetListing } from '@/features/consultant/timesheets/timesheet-listing';

export const metadata = {
  title: 'Consultant: Timesheets'
};

const TimesheetPage = () => {
  return (
    <ConsultantTimesheetListing />
  );
};

export default TimesheetPage;