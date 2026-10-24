import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminDashboardAnalytics from './AdminDashboardAnalytics';
import { getDashboardSummary, getTechnicianAnalytics } from '../services/dashboardService';
import { getFullImageUrl } from '../services/api';

const initialStats = {
  clients: 0,
  equipments: 0,
  technicians: 0,
  interventions: 0,
  reportsCreated: 0,
  pending: 0,
  assigned: 0,
  inProgress: 0,
  completed: 0,
  recentInterventions: [],
  recentClients: [],
  availableEquipments: [],
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(initialStats);
  const [analytics, setAnalytics] = useState(null);
  const [filter, setFilter] = useState('year');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSummary();
    loadAnalytics(filter);
    const intervalId = window.setInterval(() => {
      loadSummary();
      loadAnalytics(filter);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, []);

  async function loadSummary() {
    setLoading(true);
    setError('');
    try {
      const res = await getDashboardSummary();
      setStats({ ...initialStats, ...res.data });
    } catch (err) {
      setError('Impossible de charger les données du tableau de bord.');
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics(selectedFilter) {
    try {
      const res = await getTechnicianAnalytics(selectedFilter);
      setAnalytics(res.data);
      setFilter(selectedFilter);
    } catch (err) {
      console.error(err);
    }
  }

  const dashboardItems = [
    { 
      title: 'CLIENTS', 
      icon: '👥', 
      count: stats.clients, 
      link: '/admin/clients'
    },
    { 
      title: 'TECHNICIENS', 
      icon: '👷', 
      count: stats.technicians, 
      link: '/admin/techniciens'
    },
    { 
      title: 'ÉQUIPEMENTS', 
      icon: '⚙️', 
      count: stats.equipments, 
      link: '/admin/equipements'
    },
    { 
      title: 'INTERVENTIONS', 
      icon: '🔧', 
      count: stats.interventions, 
      link: '/admin/interventions'
    },
    { 
      title: 'RAPPORTS CRÉÉS', 
      icon: '📄', 
      count: stats.reportsCreated, 
      link: '/admin/rapports'
    },
    { 
      title: 'EN ATTENTE', 
      icon: '⏳', 
      count: stats.pending, 
      link: '/admin/interventions'
    },
    { 
      title: 'AFFECTÉES', 
      icon: '📌', 
      count: stats.assigned, 
      link: '/admin/interventions'
    },
    { 
      title: 'EN COURS', 
      icon: '🚧', 
      count: stats.inProgress, 
      link: '/admin/interventions'
    },
    { 
      title: 'TERMINÉES', 
      icon: '✅', 
      count: stats.completed, 
      link: '/admin/interventions'
    },
  ];

  return (
    <div className="container-fluid">
      <div className="mb-5">
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          📊 Tableau de bord Administrateur
        </h1>
        <p className="text-muted">Bienvenue ! Voici un aperçu de votre système de gestion.</p>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <>
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

          <div className="row admin-dashboard-row">
            <div className="col-md-12 mb-4">
              <div className="card p-4">
                <h3 className="card-title">🆕 Équipements disponibles</h3>
                {stats.availableEquipments.length === 0 ? (
                  <p className="text-muted mb-0">Aucun équipement disponible pour le moment.</p>
                ) : (
                  <>
                    <div className="equipment-cards-grid">
                      {stats.availableEquipments.slice(0, 6).map((equipment) => {
                        const status = equipment.clientId ? 'assigned' : 'available';
                        const statusLabel = equipment.clientId ? 'Affecté' : 'Disponible';
                        const icon = equipment.type?.toLowerCase().includes('imprimante') ? '🖨️' :
                                     equipment.type?.toLowerCase().includes('ordinateur') ? '💻' :
                                     equipment.type?.toLowerCase().includes('scanner') ? '📷' :
                                     equipment.type?.toLowerCase().includes('serveur') ? '🖥️' :
                                     equipment.type?.toLowerCase().includes('routeur') ? '📡' :
                                     '⚙️';
                        return (
                          <div key={equipment.id} className="equipment-card">
                            <div className="equipment-card-image-container">
                              {equipment.photoUrl ? (
                                <img src={getFullImageUrl(equipment.photoUrl)} alt={equipment.name} className="equipment-card-image" />
                              ) : (
                                <div className="equipment-card-icon">{icon}</div>
                              )}
                            </div>
                            <div className="equipment-card-name">{equipment.name}</div>
                            <div className="equipment-card-type">{equipment.type || 'Équipement'}</div>
                            <div className="equipment-card-meta">
                              <span className={`status-badge ${status}`}>{statusLabel}</span>
                              <span className="equipment-card-date">
                                {equipment.createdAt ? new Date(equipment.createdAt).toLocaleDateString('fr-FR') : '—'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Link to="/admin/equipements" className="view-all-btn">
                      Voir tous les équipements
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="col-md-12 mb-4">
              <div className="card p-4">
                <h3 className="card-title">📈 Dernières activités</h3>
                {stats.recentInterventions.length === 0 ? (
                  <p className="text-muted mb-0">Aucune activité récente.</p>
                ) : (
                  <div className="activity-timeline">
                    {stats.recentInterventions.slice(0, 6).map((intervention) => {
                      const statusClass = intervention.status === 'Completed' ? 'completed' :
                                          intervention.status === 'InProgress' ? 'in-progress' :
                                          intervention.status === 'Pending' ? 'pending' : 'new';
                      const statusIcon = intervention.status === 'Completed' ? '✅' :
                                        intervention.status === 'InProgress' ? '🟡' :
                                        intervention.status === 'Pending' ? '🔴' : '🟢';
                      const statusLabel = intervention.status === 'Completed' ? 'Terminée' :
                                        intervention.status === 'InProgress' ? 'En cours' :
                                        intervention.status === 'Pending' ? 'En attente' : 'Nouvelle';
                      const formatDate = (date) => {
                        if (!date) return '—';
                        const d = new Date(date);
                        const now = new Date();
                        const diffMs = now - d;
                        const diffMins = Math.floor(diffMs / 60000);
                        const diffHours = Math.floor(diffMs / 3600000);
                        const diffDays = Math.floor(diffMs / 86400000);
                        
                        if (diffMins < 60) return `Il y a ${diffMins} min`;
                        if (diffHours < 24) return `Il y a ${diffHours} h`;
                        if (diffDays < 7) return `Il y a ${diffDays} j`;
                        return d.toLocaleDateString('fr-FR');
                      };
                      return (
                        <div key={intervention.id} className={`activity-item ${statusClass}`}>
                          <div className="activity-item-header">
                            <div className="activity-item-icon">{statusIcon}</div>
                            <div className="activity-item-content">
                              <div className="activity-item-client">
                                {intervention.clientName || 'Client inconnu'}
                              </div>
                              <div className="activity-item-title">{intervention.title}</div>
                              <div className="activity-item-meta">
                                <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
                                <span className="activity-item-time">
                                  🕐 {formatDate(intervention.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {analytics && (
            <div className="mb-5">
              <AdminDashboardAnalytics analytics={analytics} filter={filter} onFilterChange={loadAnalytics} showMetrics={false} />
            </div>
          )}

        </>
      )}
    </div>
  );
}
