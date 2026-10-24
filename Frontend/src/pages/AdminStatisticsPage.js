import { useEffect, useState } from 'react';
import AdminDashboardAnalytics from './AdminDashboardAnalytics';
import { getTechnicianAnalytics } from '../services/dashboardService';

export default function AdminStatisticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [filter, setFilter] = useState('year');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics(filter);
  }, []);

  async function loadAnalytics(selectedFilter) {
    setLoading(true);
    setError('');
    try {
      const res = await getTechnicianAnalytics(selectedFilter);
      setAnalytics(res.data);
      setFilter(selectedFilter);
    } catch (err) {
      setError('Impossible de charger les statistiques des techniciens.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
      ) : analytics ? (
        <AdminDashboardAnalytics analytics={analytics} filter={filter} onFilterChange={loadAnalytics} showMetrics={true} />
      ) : null}
    </div>
  );
}
