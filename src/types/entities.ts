export interface Cycle {
  id: number;
  name: string;
  type: number;
  start_date: string;
  end_date: string;
  status: number;
  objective_count?: number;
  remaining_days?: number;
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
  description: string;
  type: number;
  target: Record<string, unknown>;
  current_value: number | null;
  is_achieved: boolean;
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
