import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SingleFileUpload, UploadedFile } from '@/components/custom/singlefile-upload';

const formSchema = z.object({
  mission_id: z.coerce.number({ required_error: "Please select a mission" }),
  month: z.string({ required_error: "Please select a month" }),
  year: z.coerce.number({ required_error: "Please select a year" }),
  days_nbr: z.coerce.number({ required_error: "Number of days is required" }).min(0, "Days cannot be negative"),
  absense: z.coerce.number({ required_error: "Number of absence days is required" }).min(0, "Absence days cannot be negative"),
  supporting_document_path: z.string().optional(), // Added this field
});

const currentYear = new Date().getFullYear();
const years = [
  { value: (currentYear - 3).toString(), label: (currentYear - 3).toString() },
  { value: (currentYear - 2).toString(), label: (currentYear - 2).toString() },
  { value: (currentYear - 1).toString(), label: (currentYear - 1).toString() },
  { value: currentYear.toString(), label: currentYear.toString() },
];
const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

type FormValues = z.infer<typeof formSchema>;

interface TimesheetFormProps {
  onSubmit: (data: FormValues) => void;
  isLoadingMissions: boolean;
  missionOptions: { id: number; title: string }[];
  isSubmitting: boolean;
  handleFileChange: (file: UploadedFile | null) => void;
  supportingDocument: UploadedFile | null;
}

const TimesheetForm: React.FC<TimesheetFormProps> = ({
                                                       onSubmit,
                                                       isLoadingMissions,
                                                       missionOptions,
                                                       isSubmitting,
                                                       handleFileChange,
                                                       supportingDocument,
                                                     }) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mission_id: undefined,
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear(),
      supporting_document_path: undefined,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Section */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mission Select */}
            <FormField control={form.control} name="mission_id" render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Mission</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()} disabled={isLoadingMissions}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a mission" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingMissions ? (
                      <div>Loading...</div>
                    ) : (
                      missionOptions.map((mission) => (
                        <SelectItem key={mission.id} value={mission.id.toString()}>
                          {mission.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Month Select */}
            <FormField control={form.control} name="month" render={({ field }) => (
              <FormItem>
                <FormLabel>Month</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Year Select */}
            <FormField control={form.control} name="year" render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* Right Section - File Upload */}
          <div className="col-span-1">
            <FormField control={form.control} name="supporting_document_path" render={() => (
              <FormItem>
                <SingleFileUpload
                  label=""
                  onFileChange={handleFileChange}
                  value={supportingDocument}
                  description="Upload a signed supporting document (PDF only)"
                  accept={{ "application/pdf": [".pdf"] }}
                  maxSize={5}
                  previewHeight="h-30"
                  disabled={isSubmitting}
                />
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? 'Submitting...' : 'Submit Timesheet'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TimesheetForm;
