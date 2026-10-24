import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyClientProfile } from '../services/clientsService';
import { getMyEquipments, getAvailableEquipments } from '../services/equipmentsService';
import { getMyInterventions } from '../services/interventionsService';
import { getFullImageUrl } from '../services/api';

export default function ClientDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [equipments, setEquipments] = useState([]);
  const [availableEquipments, setAvailableEquipments] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    if (user.role !== 'Client') {
      setError('Accès non autorisé. Cette page est réservée aux clients.');
      setLoading(false);
      return;
    }
    loadData();
  }, [user, token]);

  useEffect(() => {
    function onCreated() {
      loadData();
    }
    window.addEventListener('interventionCreated', onCreated);
    return () => window.removeEventListener('interventionCreated', onCreated);
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [profileRes, equipmentsRes, availableRes, interventionsRes] = await Promise.all([
        getMyClientProfile(),
        getMyEquipments(),
        getAvailableEquipments(),
        getMyInterventions()
      ]);
      setProfile(profileRes.data);
      setEquipments(equipmentsRes.data || []);
      setAvailableEquipments(availableRes.data || []);
      setInterventions(interventionsRes.data || []);
      console.log('Equipments loaded:', equipmentsRes.data);
      console.log('Available equipments loaded:', availableRes.data);
      console.log('Equipment photoUrls:', equipmentsRes.data?.map(e => ({ name: e.name, photoUrl: e.photoUrl })));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Erreur lors du chargement des données: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  }

  const notifications = useMemo(() => {
    return interventions
      .filter((item) => item.status === 'Assigned' || item.status === 'In Progress' || item.status === 'Completed')
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.title,
        message: item.status === 'Completed'
          ? 'Votre intervention est terminée.'
          : item.status === 'In Progress'
            ? 'Votre intervention est en cours.'
            : 'Un technicien a été affecté à votre intervention.'
      }));
  }, [interventions]);

  const inProgressCount = useMemo(() => {
    return interventions.filter((it) => it.status === 'In Progress').length;
  }, [interventions]);

  const assignedCount = useMemo(() => {
    return interventions.filter((it) => it.status === 'Assigned' || it.status === 'Affectée' || it.status === 'Assignée').length;
  }, [interventions]);

  const pendingCount = useMemo(() => {
    return interventions.filter((it) => it.status === 'Pending' || it.status === 'En attente').length;
  }, [interventions]);

  const completedCount = useMemo(() => {
    return interventions.filter((it) => it.status === 'Completed' || it.status === 'Terminée' || it.status === 'Terminées').length;
  }, [interventions]);

  const totalInterventions = useMemo(() => {
    return interventions.length || profile?.interventionCount || 0;
  }, [interventions, profile]);

  if (loading) {
    return <div className="container py-4">Chargement de votre espace client...</div>;
  }

  return (
    <div className="container py-4 client-dashboard" style={{ maxWidth: '100%', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
      <div className="client-dashboard-header" style={{ backgroundColor: "#1E293B", color: "#FFFFFF", padding: "0.75rem", borderRadius: "12px", marginBottom: "0.75rem" }}>
        <h1 style={{ color: "#FFFFFF", marginBottom: "0.25rem", fontSize: "1rem" }}>👤 Espace client</h1>
        <p style={{ color: "#94A3B8", marginBottom: "0", fontSize: "0.75rem" }}>Suivez vos equipements et l'etat de vos demandes.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {profile && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <Link to="/client/equipements" style={{ textDecoration: 'none', flex: '1 1 calc(50% - 0.25rem)', minWidth: '120px' }}>
            <div className="card text-center p-2" style={{ cursor: 'pointer', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📦</div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1976d2' }}>{profile.equipmentCount}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#333', textTransform: 'uppercase', marginTop: '0.25rem' }}>ÉQUIPEMENTS</div>
            </div>
          </Link>

          <Link to="/client/interventions" style={{ textDecoration: 'none', flex: '1 1 calc(50% - 0.25rem)', minWidth: '120px' }}>
            <div className="card text-center p-2" style={{ cursor: 'pointer', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🛠️</div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1976d2' }}>{totalInterventions}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#333', textTransform: 'uppercase', marginTop: '0.25rem' }}>INTERVENTIONS</div>
            </div>
          </Link>

          <Link to="/client/interventions" style={{ textDecoration: 'none', flex: '1 1 calc(50% - 0.25rem)', minWidth: '120px' }}>
            <div className="card text-center p-2" style={{ cursor: 'pointer', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>⏳</div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1976d2' }}>{pendingCount}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#333', textTransform: 'uppercase', marginTop: '0.25rem' }}>EN ATTENTE</div>
            </div>
          </Link>

          <Link to="/client/interventions" style={{ textDecoration: 'none', flex: '1 1 calc(50% - 0.25rem)', minWidth: '120px' }}>
            <div className="card text-center p-2" style={{ cursor: 'pointer', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📌</div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1976d2' }}>{assignedCount}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#333', textTransform: 'uppercase', marginTop: '0.25rem' }}>AFFECTÉES</div>
            </div>
          </Link>

          <Link to="/client/interventions" style={{ textDecoration: 'none', flex: '1 1 calc(50% - 0.25rem)', minWidth: '120px' }}>
            <div className="card text-center p-2" style={{ cursor: 'pointer', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🚧</div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1976d2' }}>{inProgressCount}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#333', textTransform: 'uppercase', marginTop: '0.25rem' }}>EN COURS</div>
            </div>
          </Link>

          <Link to="/client/interventions" style={{ textDecoration: 'none', flex: '1 1 calc(50% - 0.25rem)', minWidth: '120px' }}>
            <div className="card text-center p-2" style={{ cursor: 'pointer', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>✅</div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1976d2' }}>{completedCount}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#333', textTransform: 'uppercase', marginTop: '0.25rem' }}>TERMINÉES</div>
            </div>
          </Link>
        </div>
      )}

      <div className="row g-2 g-sm-3 g-md-4">
        <div className="col-12">
          <div className="card client-panel p-2 p-sm-3 mb-3 mb-sm-4">
            <div className="d-flex justify-content-between align-items-center mb-2 mb-sm-3">
              <h3 className="mb-0" style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)' }}>📦 Mes équipements</h3>
            </div>
            <div className="text-center mb-3">
              <Link to="/client/equipements" className="text-success text-decoration-none fw-semibold">
                Voir tous les équipements
              </Link>
            </div>
            {equipments.length === 0 ? (
              <>
                {availableEquipments.length === 0 ? (
                  <p className="text-muted">Aucun équipement enregistré.</p>
                ) : (
                  <>
                    <p className="text-muted">Vous n’avez pas d’équipement attribué. Voici trois équipements disponibles :</p>
                    <div className="row g-2 g-sm-3">
                      {availableEquipments.slice(0, 3).map((item) => (
                        <div key={item.id} className="col-6 col-sm-4 col-md-4 col-xl-2">
                          <div className="card border-0 shadow-sm h-100 text-center rounded-4" style={{ transition: 'transform 0.2s ease' }}>
                            <div className="card-body d-flex flex-column align-items-center justify-content-between p-2 p-sm-3">
                              {item.photoUrl ? (
                                <img
                                  src={getFullImageUrl(item.photoUrl)}
                                  alt={item.name}
                                  className="img-fluid rounded-4 mb-2 mb-sm-3"
                                  style={{ width: 'clamp(60px, 18vw, 120px)', height: 'clamp(60px, 18vw, 120px)', objectFit: 'cover' }}
                                  onError={(e) => {
                                    console.log('Image load error for:', item.photoUrl);
                                    e.target.src = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop';
                                  }}
                                />
                              ) : (
                                <div className="rounded-4 bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center mb-2 mb-sm-3" style={{ width: 'clamp(60px, 18vw, 120px)', height: 'clamp(60px, 18vw, 120px)' }}>
                                  <span className="fs-2 text-secondary" style={{ fontSize: 'clamp(1rem, 4vw, 2rem)' }}>⚙️</span>
                                </div>
                              )}
                              <h6 className="fw-bold mb-2 mb-sm-3" style={{ fontSize: 'clamp(0.7rem, 2vw, 1rem)', lineHeight: '1.2' }}>{item.name}</h6>
                              <button className="btn btn-outline-primary btn-sm w-100 mt-auto" style={{ fontSize: 'clamp(0.65rem, 2vw, 0.875rem)', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.5rem, 2vw, 1rem)' }} onClick={() => setSelectedEquipment(item)}>
                                Voir détails
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="row g-2 g-sm-3">
                  {equipments.slice(0, 5).map((item) => (
                    <div key={item.id} className="col-6 col-sm-4 col-md-4 col-xl-2">
                      <div className="card border-0 shadow-sm h-100 text-center rounded-4" style={{ transition: 'transform 0.2s ease' }}>
                        <div className="card-body d-flex flex-column align-items-center justify-content-between p-2 p-sm-3">
                          {item.photoUrl ? (
                            <img
                              src={getFullImageUrl(item.photoUrl)}
                              alt={item.name}
                              className="img-fluid rounded-4 mb-2 mb-sm-3"
                              style={{ width: 'clamp(60px, 18vw, 120px)', height: 'clamp(60px, 18vw, 120px)', objectFit: 'cover' }}
                              onError={(e) => {
                                console.log('Image load error for:', item.photoUrl);
                                e.target.src = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop';
                              }}
                            />
                          ) : (
                            <div className="rounded-4 bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center mb-2 mb-sm-3" style={{ width: 'clamp(60px, 18vw, 120px)', height: 'clamp(60px, 18vw, 120px)' }}>
                              <span className="fs-2 text-secondary" style={{ fontSize: 'clamp(1rem, 4vw, 2rem)' }}>⚙️</span>
                            </div>
                          )}
                          <h6 className="fw-bold mb-2 mb-sm-3" style={{ fontSize: 'clamp(0.7rem, 2vw, 1rem)', lineHeight: '1.2' }}>{item.name}</h6>
                          <button className="btn btn-outline-primary btn-sm w-100 mt-auto" style={{ fontSize: 'clamp(0.65rem, 2vw, 0.875rem)', padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.5rem, 2vw, 1rem)' }} onClick={() => setSelectedEquipment(item)}>
                            Voir détails
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card h-100" style={{ border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', borderRadius: '16px' }}>
            <div className="card-header border-0 pb-2 pb-sm-3" style={{ backgroundColor: 'transparent' }}>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold" style={{ color: '#1E293B', fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>🔔 Notifications</h5>
                <Link to="/client/interventions" style={{ textDecoration: 'none', color: '#2563EB', fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)', fontWeight: '500' }}>
                  Voir tout
                </Link>
              </div>
            </div>
            <div className="card-body pt-0" style={{ maxHeight: 'clamp(300px, 50vh, 400px)', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div className="text-center py-4 py-sm-5">
                  <div style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: 'clamp(0.5rem, 1vw, 1rem)' }}>📭</div>
                  <p className="text-muted mb-0" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}>Aucune notification pour le moment.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2 gap-sm-3">
                  {notifications.map((item) => {
                    const icon = item.message.includes('terminée') ? '✅' : 
                                 item.message.includes('en cours') ? '🔄' : 
                                 item.message.includes('affecté') ? '⏳' : '⚠️';
                    const bgColor = item.message.includes('terminée') ? '#DCFCE7' : 
                                    item.message.includes('en cours') ? '#DBEAFE' : 
                                    item.message.includes('affecté') ? '#FEF3C7' : '#FEE2E2';
                    return (
                      <div key={item.id} className="p-2 p-sm-3 rounded-3" style={{ 
                        backgroundColor: bgColor, 
                        border: '1px solid rgba(0,0,0,0.05)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}>
                        <div className="d-flex align-items-start gap-2 gap-sm-3">
                          <div style={{ 
                            width: 'clamp(32px, 8vw, 40px)', 
                            height: 'clamp(32px, 8vw, 40px)', 
                            borderRadius: '50%', 
                            backgroundColor: 'rgba(255,255,255,0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                            flexShrink: 0
                          }}>
                            {icon}
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-semibold mb-1" style={{ color: '#1E293B', fontSize: 'clamp(0.8rem, 2vw, 0.95rem)' }}>
                              {item.title}
                            </div>
                            <div className="small mb-2" style={{ color: '#64748B', lineHeight: '1.4', fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)' }}>
                              {item.message}
                            </div>
                            <div className="small" style={{ color: '#94A3B8', fontSize: 'clamp(0.7rem, 1.5vw, 0.75rem)' }}>
                              {new Date().toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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

        <div className="col-12 col-lg-7">
          <div className="card h-100" style={{ border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', borderRadius: '16px' }}>
            <div className="card-header border-0 pb-2 pb-sm-3" style={{ backgroundColor: 'transparent' }}>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold" style={{ color: '#1E293B', fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>🗂️ Dernières interventions</h5>
                <Link to="/client/interventions" style={{ textDecoration: 'none', color: '#2563EB', fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)', fontWeight: '500' }}>
                  Voir tout
                </Link>
              </div>
            </div>
            <div className="card-body pt-0" style={{ maxHeight: 'clamp(300px, 50vh, 400px)', overflowY: 'auto' }}>
              {interventions.length === 0 ? (
                <div className="text-center py-4 py-sm-5">
                  <div style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: 'clamp(0.5rem, 1vw, 1rem)' }}>📋</div>
                  <p className="text-muted mb-0" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}>Aucune intervention récente.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2 gap-sm-3">
                  {interventions.slice(0, 5).map((item) => {
                    const statusColor = item.status === 'Completed' || item.status === 'Terminée' ? '#22C55E' :
                                      item.status === 'In Progress' || item.status === 'En cours' ? '#2563EB' :
                                      item.status === 'Pending' || item.status === 'En attente' ? '#F59E0B' : '#64748B';
                    const statusBg = item.status === 'Completed' || item.status === 'Terminée' ? '#DCFCE7' :
                                     item.status === 'In Progress' || item.status === 'En cours' ? '#DBEAFE' :
                                     item.status === 'Pending' || item.status === 'En attente' ? '#FEF3C7' : '#F1F5F9';
                    const priorityColor = (item.priority || '').toLowerCase().includes('haute') || (item.priority || '').toLowerCase().includes('high') ? '#EF4444' :
                                        (item.priority || '').toLowerCase().includes('moyenne') || (item.priority || '').toLowerCase().includes('medium') ? '#F59E0B' : '#22C55E';
                    return (
                      <div key={item.id} className="p-3 p-sm-4 rounded-3" style={{ 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid #E5E7EB',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <div style={{ 
                              width: 'clamp(28px, 7vw, 36px)', 
                              height: 'clamp(28px, 7vw, 36px)', 
                              borderRadius: '8px', 
                              backgroundColor: '#F1F5F9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                            }}>
                              🔧
                            </div>
                            <div className="fw-semibold" style={{ color: '#1E293B', fontSize: 'clamp(0.8rem, 2vw, 0.95rem)' }}>
                              {item.title}
                            </div>
                          </div>
                          <div style={{ 
                            padding: 'clamp(2px, 0.5vw, 4px) clamp(6px, 1.5vw, 12px)',
                            borderRadius: '20px',
                            backgroundColor: statusBg,
                            color: statusColor,
                            fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {item.status}
                          </div>
                        </div>
                        <div className="small mb-2" style={{ color: '#64748B', lineHeight: '1.4', fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)' }}>
                          {item.description || item.equipmentName || 'Équipement non renseigné'}
                        </div>
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                          <div className="d-flex gap-2 gap-sm-3">
                            <div className="small" style={{ color: '#94A3B8', fontSize: 'clamp(0.7rem, 1.5vw, 0.875rem)' }}>
                              <span style={{ color: '#64748B' }}>👤</span> {item.technicianName || 'Non affecté'}
                            </div>
                            <div className="small" style={{ color: '#94A3B8', fontSize: 'clamp(0.7rem, 1.5vw, 0.875rem)' }}>
                              <span style={{ color: '#64748B' }}>📅</span> {item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : '—'}
                            </div>
                          </div>
                          <div style={{ 
                            padding: 'clamp(2px, 0.5vw, 4px) clamp(6px, 1.5vw, 10px)',
                            borderRadius: '12px',
                            backgroundColor: priorityColor + '20',
                            color: priorityColor,
                            fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            {item.priority || 'Moyenne'}
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
      </div>

      {selectedEquipment && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm" role="document" style={{ maxWidth: '90vw' }}>
            <div className="modal-content rounded-4 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>Détails de l'équipement</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedEquipment(null)}></button>
              </div>
              <div className="modal-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="mb-0" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>{selectedEquipment.name}</h5>
                    <p className="text-muted small mb-0" style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)' }}>{selectedEquipment.type || 'Type non renseigné'}</p>
                  </div>
                  <span className={`badge ${selectedEquipment.status === 'Out of Service' ? 'bg-danger' : selectedEquipment.status === 'Under Maintenance' ? 'bg-warning text-dark' : 'bg-success'}`} style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.875rem)' }}>
                    {selectedEquipment.status || 'Available'}
                  </span>
                </div>
                <p className="mb-2" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}><strong>Marque :</strong> {selectedEquipment.brand || '—'}</p>
                <p className="mb-2" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}><strong>Modèle :</strong> {selectedEquipment.model || '—'}</p>
                <p className="mb-2" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}><strong>Numéro de série :</strong> {selectedEquipment.serialNumber || '—'}</p>
                <p className="mb-2" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}><strong>Date d'installation :</strong> {selectedEquipment.installationDate ? new Date(selectedEquipment.installationDate).toLocaleDateString() : '—'}</p>
                <p className="mb-2" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}><strong>Photo :</strong> {selectedEquipment.photoUrl ? <a href={getFullImageUrl(selectedEquipment.photoUrl)} target="_blank" rel="noreferrer">Voir photo</a> : 'Aucune photo'}</p>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary" onClick={() => setSelectedEquipment(null)}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
