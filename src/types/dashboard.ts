import type { Cycle, Objective, KeyResult } from './entities';

export interface DashboardStats {
  total_objectives: number;
  completed_objectives: number;
  in_progress_objectives: number;
  total_key_results: number;
  average_kr_progress: number;
}

export interface DashboardData {
  cycles: Cycle[];
  summary: DashboardStats;
  objectives: Objective[];
}
