import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { getMyInterventions, startIntervention, completeIntervention } from '../services/interventionsService';
import { getFullImageUrl } from '../services/api';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function TechnicianDashboard() {
  const [stats, setStats] = useState({
    assigned: 0,
    inProgress: 0,
    completed: 0,
    total: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0
  });
  const [recent, setRecent] = useState([]);

  // Derived notifications (simple heuristic: assigned or high priority)
  const notifications = recent.filter(i => {
    const p = (i.priority || '').toString().toLowerCase();
    const s = (i.status || '').toString().toLowerCase();
    return s.includes('assign') || p.includes('high') || s.includes('urgent');
  });

  useEffect(() => {
    loadData();
    const intervalId = window.setInterval(() => {
      loadData();
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, []);

  async function loadData() {
    try {
      const res = await getMyInterventions();
      const list = res.data || [];
      const assigned = list.filter(i => i.status === 'Assigned' || i.status === 'Affectée' || i.status === 'Assignée').length;
      const inProgress = list.filter(i => i.status === 'In Progress' || i.status === 'En cours').length;
      const completed = list.filter(i => i.status === 'Completed' || i.status === 'Terminée' || i.status === 'Terminées').length;
      const highPriority = list.filter(i => (i.priority || '').toLowerCase().includes('high') || (i.priority || '').toLowerCase().includes('haute')).length;
      const mediumPriority = list.filter(i => (i.priority || '').toLowerCase().includes('medium') || (i.priority || '').toLowerCase().includes('moyenne')).length;
      const lowPriority = list.filter(i => (i.priority || '').toLowerCase().includes('low') || (i.priority || '').toLowerCase().includes('basse')).length;
      setStats({ assigned, inProgress, completed, total: list.length, highPriority, mediumPriority, lowPriority });
      setRecent(list.slice(0, 5));
    } catch (err) {
      setStats({ pending: 0, assigned: 0, inProgress: 0, completed: 0, urgent: 0, total: 0, highPriority: 0, mediumPriority: 0, lowPriority: 0 });
      setRecent([]);
    }
  }

  async function handleStart(id) {
    try {
      await startIntervention(id);
      await loadData();
    } catch (err) {
      console.error('startIntervention error', err);
    }
  }

  async function handleComplete(id) {
    try {
      await completeIntervention(id);
      await loadData();
    } catch (err) {
      console.error('completeIntervention error', err);
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

  const dashboardItems = [
    {
      title: 'INTERVENTIONS',
      icon: '🔧',
      count: stats.total,
      link: '/technician/interventions'
    },
    {
      title: 'EN ATTENTE',
      icon: '⏳',
      count: stats.assigned,
      link: '/technician/interventions'
    },
    {
      title: 'AFFECTÉES',
      icon: '📌',
      count: stats.assigned,
      link: '/technician/interventions'
    },
    {
      title: 'EN COURS',
      icon: '🚧',
      count: stats.inProgress,
      link: '/technician/interventions'
    },
    {
      title: 'TERMINÉES',
      icon: '✅',
      count: stats.completed,
      link: '/technician/interventions'
    },
    {
      title: 'HAUTE PRIORITÉ',
      icon: '🔴',
      count: stats.highPriority,
      link: '/technician/interventions'
    }
  ];

  return (
    <div className="container-fluid">
      <div className="mb-5">
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          🔧 Tableau de bord Technicien
        </h1>
        <p className="text-muted">Voir vos interventions, urgentes, terminées et votre historique.</p>
      </div>

      <div className="row g-4 mb-5">
        {dashboardItems.map((item, idx) => (
          <div key={idx} className="col-12 col-md-6 col-lg-2">
            <Link to={item.link} style={{ textDecoration: 'none' }}>
              <div className="card h-100 text-center p-3" style={{ cursor: 'pointer', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#e3f2fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px auto',
                  flexDirection: 'column'
                }}>
                  <div style={{ fontSize: '1.5rem' }}>{item.icon}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1976d2' }}>{item.count}</div>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333', textTransform: 'uppercase' }}>{item.title}</div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="row">
        <div className="col-md-4">
          <div className="card p-3 mb-3">
            <h5 className="mb-3">🔔 Notifications</h5>
            {notifications.length === 0 ? (
              <p className="text-muted">Aucune notification.</p>
            ) : (
              <ul className="list-unstyled">
                {notifications.map(n => (
                  <li key={n.id} className="mb-2">
                    <strong>{n.title}</strong>
                    <div className="text-muted small">{n.clientName} • {n.status}</div>
                    <div className="mt-1">
                      <button className="btn-icon btn-icon-primary me-1" title="Démarrer" data-tooltip="Démarrer" onClick={() => handleStart(n.id)}>▶️</button>
                      <Link to={`/technician/interventions/${n.id}`} className="btn-icon btn-icon-info" title="Voir" data-tooltip="Voir">👁️</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="col-md-8">
          <div className="card p-4">
            <h3 className="card-title">🕘 Dernières interventions</h3>
        {recent.length === 0 ? (
          <p className="text-muted">Aucune intervention disponible pour le moment.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Client</th>
                  <th>Statut</th>
                  <th>Priorité</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(item => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.clientName}</td>
                    <td>{item.status}</td>
                    <td>{item.priority}</td>
                    <td>
                      {(item.status === 'Assigned' || item.status === 'Affectée' || item.status === 'Assignée') && (
                        <button className="btn-icon btn-icon-primary me-1" title="Démarrer" data-tooltip="Démarrer" onClick={() => handleStart(item.id)} type="button">▶️</button>
                      )}
                      {(item.status === 'In Progress' || item.status === 'En cours') && (
                        <button className="btn-icon btn-icon-success" title="Terminer" data-tooltip="Terminer" onClick={() => handleComplete(item.id)} type="button">✅</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </div>
        </div>
      </div>

      <div className="row mt-5">
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
      </div>
    </div>
  );
}
