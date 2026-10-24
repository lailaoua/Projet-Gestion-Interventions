import api from './api';

export function getInterventions(search, status, priority, technicianId, clientId) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (priority) params.append('priority', priority);
  if (technicianId) params.append('technicianId', technicianId);
  if (clientId) params.append('clientId', clientId);
  return api.get(`/interventions${params.toString() ? `?${params.toString()}` : ''}`);
}

export function getMyInterventions(search, status, priority) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (priority) params.append('priority', priority);
  return api.get(`/interventions/my${params.toString() ? `?${params.toString()}` : ''}`);
}

export function getUnassignedInterventions() {
  return api.get('/interventions/unassigned');
}

export function createIntervention(payload) {
  return api.post('/interventions', payload);
}

export function updateIntervention(id, payload) {
  return api.put(`/interventions/${id}`, payload);
}

export function assignIntervention(id, technicianId) {
  return api.put(`/interventions/${id}/assign`, { technicianId });
}

export function startIntervention(id) {
  return api.put(`/interventions/${id}/start`);
}

export function completeIntervention(id) {
  return api.put(`/interventions/${id}/complete`);
}

export function updateInterventionStatus(id, status) {
  return api.patch(`/interventions/${id}/status`, { status });
}

export function deleteIntervention(id) {
  return api.delete(`/interventions/${id}`);
}
