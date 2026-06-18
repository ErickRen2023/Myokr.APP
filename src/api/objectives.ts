import client from './client';
import type { Objective } from '../types';

export function listObjectives(cycle_id: string): Promise<{ code: number; data: { objectives: Objective[] } }> {
  return client.get('/objectives', { params: { cycle_id } });
}

export function createObjective(data: { cycle_id: number; title: string; description?: string; sort_order?: number }): Promise<{ code: number; data: Objective }> {
  return client.post('/objectives/create', data);
}

export function updateObjective(data: { id: number; title?: string; description?: string; cycle_id?: number; sort_order?: number }): Promise<{ code: number; data: Objective }> {
  return client.post('/objectives/update', data);
}

export function archiveObjective(id: number): Promise<{ code: number; data: null }> {
  return client.post('/objectives/archive', { id });
}

export function restoreObjective(id: number): Promise<{ code: number; data: Objective }> {
  return client.post('/objectives/restore', { id });
}
