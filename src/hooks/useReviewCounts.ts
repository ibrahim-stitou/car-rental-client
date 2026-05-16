// src/hooks/useReviewCounts.ts
import { useState, useEffect } from 'react';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient  from '@/lib/api';
interface ReviewCounts {
  expenses: number;
  mileage_expenses: number;
  timesheets: number;
  rechargeable_expenses: number;
}
export const useReviewCounts = () => {
  const [counts, setCounts] = useState<ReviewCounts>({
    expenses: 0,
    mileage_expenses: 0,
    timesheets: 0,
    rechargeable_expenses: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(apiRoutes.admin.counts);
      setCounts(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch review counts'));
      console.error('Error fetching review counts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
    const intervalId = setInterval(fetchCounts, 2* 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  return { counts, loading, error, refetch: fetchCounts };
};