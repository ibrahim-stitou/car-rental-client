'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export function CreateExpenseModal({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    mission_id: '',
  });
  const [missions, setMissions] = useState<{ id: number; title: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Fetch missions from the API
    const fetchMissions = async () => {
      try {
        const response = await apiClient.get(apiRoutes.consultant.missions.selectOptions);
        setMissions(response.data.data);
      } catch (error) {
        console.error('Failed to fetch missions:', error);
      }
    };

    fetchMissions();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string[]> = {};

    // Validate year
    if (!formData.year || isNaN(Number(formData.year))) {
      newErrors.year = ['Year must be a valid number'];
    } else if (Number(formData.year) < 2000 || Number(formData.year) > 2100) {
      newErrors.year = ['Year must be between 2000 and 2100'];
    }

    // Validate month
    if (!formData.month || isNaN(Number(formData.month))) {
      newErrors.month = ['Month must be a valid number'];
    } else if (Number(formData.month) < 1 || Number(formData.month) > 12) {
      newErrors.month = ['Month must be between 1 and 12'];
    }

    // Validate mission_id
    if (!formData.mission_id) {
      newErrors.mission_id = ['Mission is required'];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const numericData = {
        year: parseInt(formData.year),
        month: parseInt(formData.month),
        mission_id: parseInt(formData.mission_id),
      };

      const response = await apiClient.post(
        apiRoutes.consultant.rechargeableExpenses.create,
        numericData
      );

      if (response.data.success) {
        toast.success('Rechargeable expense created successfully');
        router.push(`rechargeable-expenses/${response.data.expense_id}`);
      } else {
        toast.error(response.data.message || 'Failed to create expense');
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error('An error occurred while creating the expense');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">New Rechargeable Expense</DialogTitle>
          </DialogHeader>

          <Alert className="mb-6 bg-blue-50 border-blue-200 w-full">
            <AlertDescription className="text-blue-700">
              Please select the year, month, and mission to begin your declaration
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="mission_id">Mission</Label>
              <Select
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, mission_id: value }))
                }
              >
                <SelectTrigger className={errors.mission_id ? 'border-red-500 w-full' : 'w-full'}>
                  <SelectValue placeholder="Select a mission" />
                </SelectTrigger>
                <SelectContent>
                  {missions.map((mission) => (
                    <SelectItem key={mission.id} value={mission.id.toString()}>
                      {mission.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.mission_id && (
                <p className="text-sm text-red-500">{errors.mission_id[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                name="year"
                type="number"
                min="2000"
                max="2100"
                value={formData.year}
                onChange={handleChange}
                className={errors.year ? 'border-red-500' : ''}
              />
              {errors.year && (
                <p className="text-sm text-red-500">{errors.year[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Input
                id="month"
                name="month"
                type="number"
                min="1"
                max="12"
                value={formData.month}
                onChange={handleChange}
                className={errors.month ? 'border-red-500' : ''}
              />
              {errors.month && (
                <p className="text-sm text-red-500">{errors.month[0]}</p>
              )}
            </div>


            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[100px]"
              >
                {isLoading ? 'Creating...' : 'Continue'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}