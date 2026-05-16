import { TimesheetListing } from '@/features/timesheets/timesheet-listing';

export const metadata = {
  title: 'Admin: Timesheets',
  description: 'Manage and view timesheets'
};

const TimesheetPage = () => {
  return (
        <TimesheetListing />
  );
};

export default TimesheetPage;