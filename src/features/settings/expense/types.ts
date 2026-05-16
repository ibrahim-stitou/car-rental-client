export interface Expense {
  id: number;
  title: string;
  description?: string; // Reste description côté backend mais affiché comme "Observation" dans l'UI
}