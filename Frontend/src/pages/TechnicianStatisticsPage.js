import { useState, useEffect, useMemo } from 'react';
import { getMyInterventions } from '../services/interventionsService';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

export default function TechnicianStatisticsPage() {
  const [stats, setStats] = useState({
    assigned: 0,
    inProgress: 0,
    completed: 0,
    total: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await getMyInterventions();
      const list = res.data || [];
      const assigned = list.filter(i => i.status === 'Assigned' || i.status === 'Affectée' || i.status === 'Assignée').length;
      const inProgress = list.filter(i => i.status === 'In Progress' || i.status === 'En cours').length;
      const completed = list.filter(i => i.status === 'Completed' || i.status === 'Terminée' || i.status === 'Terminées').length;
      const highPriority = list.filter(i => (i.priority || '').toLowerCase().includes('high') || (i.priority || '').toLowerCase().includes('haute')).length;
      const mediumPriority = list.filter(i => (i.priority || '').toLowerCase().includes('medium') || (i.priority || '').toLowerCase().includes('moyenne')).length;
      const lowPriority = list.filter(i => (i.priority || '').toLowerCase().includes('low') || (i.priority || '').toLowerCase().includes('basse')).length;
      
      setStats({ 
        assigned, 
        inProgress, 
        completed, 
        total: list.length,
        highPriority,
        mediumPriority,
        lowPriority
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  }

  const statusChartData = useMemo(() => ({
    labels: ['Assignées', 'En cours', 'Terminées'],
    datasets: [
      {
        data: [stats.assigned, stats.inProgress, stats.completed],
        backgroundColor: ['#3B82F6', '#F59E0B', '#10B981'],
        borderWidth: 0,
      },
    ],
  }), [stats.assigned, stats.inProgress, stats.completed]);

  const priorityChartData = useMemo(() => ({
    labels: ['Haute', 'Moyenne', 'Basse'],
    datasets: [
      {
        data: [stats.highPriority, stats.mediumPriority, stats.lowPriority],
        backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
        borderWidth: 0,
      },
    ],
  }), [stats.highPriority, stats.mediumPriority, stats.lowPriority]);

  const simpleChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 13 },
          padding: 15,
          usePointStyle: true,
        },
      },
    },
  }), []);

  return (
    <div className="container-fluid">
      <div className="mb-5">
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          📊 Mes Statistiques
        </h1>
        <p className="text-muted">Vue d'ensemble de vos interventions et performances.</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card p-4 h-100">
              <h3 className="card-title mb-4">Répartition par statut</h3>
              <div style={{ height: '300px', maxWidth: '350px', margin: '0 auto' }}>
                <Pie key="status-pie" data={statusChartData} options={simpleChartOptions} />
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className="card p-4 h-100">
              <h3 className="card-title mb-4">Répartition par priorité</h3>
              <div style={{ height: '300px', maxWidth: '350px', margin: '0 auto' }}>
                <Pie key="priority-pie" data={priorityChartData} options={simpleChartOptions} />
              </div>
            </div>
          </div>

          <div className="col-12 mb-4">
            <div className="card p-4">
              <h3 className="card-title mb-4">Résumé</h3>
              <div className="row text-center">
                <div className="col-md-3 mb-3">
                  <div className="p-3 bg-light rounded">
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3B82F6' }}>{stats.total}</div>
                    <div className="text-muted">Total</div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="p-3 bg-light rounded">
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3B82F6' }}>{stats.assigned}</div>
                    <div className="text-muted">Assignées</div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="p-3 bg-light rounded">
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#F59E0B' }}>{stats.inProgress}</div>
                    <div className="text-muted">En cours</div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="p-3 bg-light rounded">
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>{stats.completed}</div>
                    <div className="text-muted">Terminées</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
