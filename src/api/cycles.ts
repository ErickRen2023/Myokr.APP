import client from './client';
import type { Cycle } from '../types';

export function listCycles(status?: number): Promise<{ code: number; data: { cycles: Cycle[] } }> {
  const params = status !== undefined ? { status } : {};
  return client.get('/cycles', { params });
}

export function createCycle(data: { type: number; start_date: string; end_date: string }): Promise<{ code: number; data: Cycle }> {
  return client.post('/cycles/create', data);
}

export function updateCycle(data: { id: number; end_date?: string; start_date?: string; type?: number }): Promise<{ code: number; data: Cycle }> {
  return client.post('/cycles/update', data);
}

export function archiveCycle(id: number): Promise<{ code: number; data: null }> {
  return client.post('/cycles/archive', { id });
}

export function reactivateCycle(id: number): Promise<{ code: number; data: Cycle }> {
  return client.post('/cycles/reactivate', { id });
}
