import api from './api';

export function getDashboardSummary() {
  return api.get('/dashboard/summary');
}

export function getTechnicianAnalytics(filter = 'year') {
  return api.get(`/dashboard/technician-analytics-v2?filter=${encodeURIComponent(filter)}`);
}
