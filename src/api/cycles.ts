import client from './client';
import type { Cycle, CycleReview, CycleReviewInput } from '../types';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export function listCycles(status?: number): Promise<ApiResponse<{ cycles: Cycle[] }>> {
  const params = status !== undefined ? { status } : {};
  return client.get('/cycles', { params });
}

export function createCycle(data: { type: number; start_date: string; end_date: string }): Promise<ApiResponse<Cycle>> {
  return client.post('/cycles/create', data);
}

export function updateCycle(data: { id: number; end_date?: string; start_date?: string; type?: number }): Promise<ApiResponse<Cycle>> {
  return client.post('/cycles/update', data);
}

export function archiveCycle(id: number): Promise<ApiResponse<null>> {
  return client.post('/cycles/archive', { id });
}

export function reactivateCycle(id: number): Promise<ApiResponse<Cycle>> {
  return client.post('/cycles/reactivate', { id });
}

export function getCycleReview(cycleId: number): Promise<ApiResponse<{ review: CycleReview | null }>> {
  return client.get(`/cycles/${cycleId}/review`);
}

export function saveCycleReview(data: CycleReviewInput): Promise<ApiResponse<{ review: CycleReview }>> {
  return client.post('/cycles/review', data);
}

export function reviewAndArchiveCycle(data: CycleReviewInput): Promise<ApiResponse<{ review: CycleReview; archived: boolean }>> {
  return client.post('/cycles/review-and-archive', data);
}
