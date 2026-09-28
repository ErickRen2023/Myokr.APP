export interface Cycle {
  id: number;
  name: string;
  type: number;
  start_date: string;
  end_date: string;
  status: number;
  objective_count?: number;
  remaining_days?: number;
  review?: CycleReview | null;
}

export interface CycleReview {
  cycle_id: number;
  summary: string;
  highlights: string;
  blockers: string;
  learnings: string;
  next_steps: string;
  updated_at?: string | null;
}

export type CycleReviewInput = Omit<CycleReview, 'updated_at'>;

export interface CycleReviewDraft extends Omit<CycleReviewInput, 'cycle_id'> {
}

export interface Milestone {
  id: number;
  description: string;
  completed: boolean;
  sort_order: number;
  is_deleted: number;
}

export interface KeyResult {
  id: number;
  title: string;
  description: string;
  type: number;
  target: Record<string, unknown>;
  current_value: number | null;
  is_achieved: boolean;
  sort_order: number;
  status: number;
  progress: number;
  milestones?: Milestone[];
}

export interface Objective {
  id: number;
  title: string;
  description: string | null;
  sort_order: number;
  status: number;
  progress: number;
  key_results: KeyResult[];
}
