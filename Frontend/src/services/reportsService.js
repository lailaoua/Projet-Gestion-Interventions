import api from './api';

export function getReports() {
  return api.get('/reports');
}

export function createReport(interventionId, payload) {
  return api.post('/reports', { interventionId, ...payload });
}

export function getReportById(reportId) {
  return api.get(`/reports/${reportId}`);
}

export function downloadReportPdf(reportId) {
  return api.get(`/reports/${reportId}/pdf`, { responseType: 'blob' });
}

export function deleteReport(reportId) {
  return api.delete(`/reports/${reportId}`);
}
