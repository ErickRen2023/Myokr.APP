import client from './client';
import type { Milestone, ApiResponse } from '../types';

export function listMilestones(key_result_id: number): Promise<ApiResponse<{ milestones: Milestone[] }>> {
  return client.get('/milestones', { params: { key_result_id } });
}

export function createMilestone(data: { key_result_id: number; description: string; sort_order?: number }): Promise<ApiResponse<Milestone>> {
  return client.post('/milestones/create', data);
}

export function toggleMilestone(id: number): Promise<ApiResponse<Milestone>> {
  return client.post('/milestones/toggle', { id });
}

export function updateMilestone(data: { id: number; description?: string }): Promise<ApiResponse<Milestone>> {
  return client.post('/milestones/update', data);
}

export function reorderMilestones(data: { id: number; sort_order: number }[]): Promise<ApiResponse<null>> {
  return client.post('/milestones/reorder', data);
}

export function deleteMilestone(id: number): Promise<ApiResponse<null>> {
  return client.post('/milestones/delete', { id });
}
