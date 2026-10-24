import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getInterventions,
  getMyInterventions,
  createIntervention,
  updateIntervention,
  assignIntervention,
  startIntervention,
  completeIntervention,
  updateInterventionStatus,
  deleteIntervention
} from '../services/interventionsService';
import { getClients } from '../services/clientsService';
import { getEquipments } from '../services/equipmentsService';
import { getTechnicians } from '../services/usersService';
import { createReport } from '../services/reportsService';

const statusOptions = ['Pending', 'Assigned', 'In Progress', 'Completed'];
const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];

export default function InterventionsPage() {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState([]);
  const [clients, setClients] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: null, title: '', description: '', priority: 'Normal', status: 'Pending', clientId: '', equipmentId: '', technicianId: '' });
  const [clientForm, setClientForm] = useState({ id: null, equipmentId: '', title: '', description: '', priority: 'Medium' });
  const [error, setError] = useState(null);
  const [clientMessage, setClientMessage] = useState('');
  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [reportForm, setReportForm] = useState({ cause: '', solution: '', duration: '', notes: '' });
  const [reportMessage, setReportMessage] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [techFilter, setTechFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [toast, setToast] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 100;
  const filteredInterventions = interventions.filter((item) => {
    const haystack = `${item.title || ''} ${item.clientName || ''} ${item.equipmentName || ''} ${item.technicianName || ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });
  const totalPages = Math.max(1, Math.ceil(filteredInterventions.length / pageSize));
  const pageInterventions = filteredInterventions.slice((page - 1) * pageSize, page * pageSize);
  const isAdmin = user?.role === 'Admin';
  const isTechnician = user?.role === 'Technician';
  const isClient = user?.role === 'Client';

  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, search, statusFilter, priorityFilter, techFilter, clientFilter]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const equipmentId = params.get('equipmentId');
    if (equipmentId && isClient) {
      setClientForm((prev) => ({ ...prev, equipmentId }));
    }
  }, [location.search, isClient]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter, techFilter, clientFilter]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="container py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      if (user?.role === 'Admin') {
        const [intRes, clRes, eqRes, techRes] = await Promise.all([
          getInterventions(search, statusFilter, priorityFilter, techFilter || undefined, clientFilter || undefined),
          getClients(),
          getEquipments(),
          getTechnicians()
        ]);

        console.debug('getInterventions response:', intRes);
        setInterventions(intRes.data || []);
        setClients(clRes.data || []);
        setEquipments(eqRes.data || []);
        setTechnicians(techRes.data || []);
      } else if (user?.role === 'Client') {
        const [intRes, eqRes] = await Promise.all([
          getMyInterventions(search, statusFilter, priorityFilter),
          getEquipments()
        ]);

        console.debug('getMyInterventions response:', intRes);
        setInterventions(intRes.data || []);
        setEquipments(eqRes.data || []);
        setClients([]);
        setTechnicians([]);
      } else if (user?.role === 'Technician') {
        const intRes = await getMyInterventions(search, statusFilter, priorityFilter);
        console.debug('getMyInterventions technician response:', intRes);
        setInterventions(intRes.data || []);
        setClients([]);
        setEquipments([]);
        setTechnicians([]);
      } else {
        const intRes = await getInterventions(search, statusFilter, priorityFilter, undefined, undefined);
        console.debug('getInterventions (other) response:', intRes);
        setInterventions(intRes.data || []);
        setClients([]);
        setEquipments([]);
        setTechnicians([]);
      }
    } catch (err) {
      console.error('loadData error:', err);
      setError(err.response?.data?.message || err.message || `Erreur (${err.response?.status || 'no-status'})`);
    } finally {
      setLoading(false);
    }
  }
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleClientChange(e) {
    setClientForm({ ...clientForm, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description,
      priority: form.priority,
      status: form.status,
      clientId: form.clientId || null,
      equipmentId: form.equipmentId || null,
      technicianId: form.technicianId || null
    };

    try {
      const action = form.id ? updateIntervention(form.id, payload) : createIntervention(payload);
      await action;
      setForm({ id: null, title: '', description: '', priority: 'Medium', status: 'Pending', clientId: '', equipmentId: '', technicianId: '' });
      setToast('Intervention created successfully.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur');
    }
  }

  async function handleClientSubmit(e) {
    e.preventDefault();
    setError(null);
    setClientMessage('');

    try {
      const payload = {
        title: clientForm.title.trim(),
        description: clientForm.description.trim(),
        priority: clientForm.priority,
        status: 'Pending',
        equipmentId: clientForm.equipmentId ? Number(clientForm.equipmentId) : 0,
        clientId: 0,
        technicianId: null
      };

      if (clientForm.id) {
        await updateIntervention(clientForm.id, payload);
        setClientMessage('Votre intervention a bien été modifiée.');
      } else {
        await createIntervention(payload);
        setClientMessage('Votre demande d\'intervention a bien été enregistrée.');
        window.dispatchEvent(new CustomEvent('interventionCreated'));
      }
      
      setClientForm({ id: null, equipmentId: '', title: '', description: '', priority: 'Medium' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de la création de l’intervention.');
    }
  }

  function handleEdit(i) {
    setForm({
      id: i.id,
      title: i.title || '',
      description: i.description || '',
      priority: i.priority || 'Medium',
      status: i.status || 'Pending',
      clientId: i.clientId || '',
      equipmentId: i.equipmentId || '',
      technicianId: i.technicianId || ''
    });
  }

  function handleClientEdit(i) {
    setClientForm({
      id: i.id,
      equipmentId: i.equipmentId || '',
      title: i.title || '',
      description: i.description || '',
      priority: i.priority || 'Medium'
    });
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cette intervention ?')) return;

    try {
      await deleteIntervention(id);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur');
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateInterventionStatus(id, status);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur');
    }
  }

  function openAssignModal(intervention) {
    setAssignTarget(intervention);
    setSelectedTechnicianId(intervention.technicianId || '');
  }

  function closeAssignModal() {
    setAssignTarget(null);
    setSelectedTechnicianId('');
  }

  async function confirmAssign() {
    if (!assignTarget || !selectedTechnicianId) {
      setError('Veuillez sélectionner un technicien.');
      return;
    }

    try {
      await assignIntervention(assignTarget.id, Number(selectedTechnicianId));
      closeAssignModal();
      setToast('Intervention assigned successfully.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur');
    }
  }

  async function handleStart(id) {
    try {
      await startIntervention(id);
      setToast('Status updated to In Progress.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur');
    }
  }

  async function handleComplete(id) {
    try {
      await completeIntervention(id);
      setToast('Intervention terminée avec succès !');
      loadData();
    } catch (err) {
      console.error('Erreur lors de la terminaison de l\'intervention:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors de la terminaison de l\'intervention');
    }
  }

  function selectIntervention(intervention) {
    setSelectedIntervention(intervention);
    setReportMessage('');
    setReportForm({ cause: '', solution: '', duration: '', notes: '' });
    setShowReportForm(false);
  }

  function handleReportChange(e) {
    setReportForm({ ...reportForm, [e.target.name]: e.target.value });
  }

  async function submitReport(e) {
    e.preventDefault();
    if (!selectedIntervention) return;

    try {
      await createReport(selectedIntervention.id, reportForm);
      setReportMessage('Rapport soumis avec succès.');
      setToast('Report created successfully.');
      setReportForm({ cause: '', solution: '', duration: '', notes: '' });
      setShowReportForm(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur');
    }
  }

  const statusClass = {
    Pending: 'bg-warning text-dark',
    'En attente': 'bg-warning text-dark',
    Assigned: 'bg-info text-dark',
    'Affectée': 'bg-info text-dark',
    'In Progress': 'bg-primary text-white',
    'En cours': 'bg-primary text-white',
    Completed: 'bg-success text-white',
    'Terminée': 'bg-success text-white'
  };

  function renderStatusBadge(status) {
    const cls = statusClass[status] || 'bg-secondary text-white';
    // display a French label when possible
    const labelMap = {
      Pending: 'En attente',
      'En attente': 'En attente',
      Assigned: 'Affectée',
      'Affectée': 'Affectée',
      'In Progress': 'En cours',
      'En cours': 'En cours',
      Completed: 'Terminée',
      'Terminée': 'Terminée'
    };
    const label = labelMap[status] || status;
    return <span className={`badge ${cls} rounded-pill px-3 py-1`}>{label}</span>;
  }

  function renderTechnicianTable() {
    if (user?.role !== 'Technician') {
      return null;
    }

    return (
      <div className="card mt-4">
        <div className="card-body">
          <h3>📋 Mes interventions</h3>
          <div className="card mb-3 p-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              placeholder="Rechercher une intervention"
            />
          </div>
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Client</th>
                  <th>Équipement</th>
                  <th>Priorité</th>
                  <th>Statut</th>
                  <th>Créée le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterventions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-muted">Aucune intervention assignée.</td>
                  </tr>
                ) : (
                  filteredInterventions.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>{item.clientName}</td>
                      <td>{item.equipmentName}</td>
                      <td>{item.priority}</td>
                      <td>{renderStatusBadge(item.status)}</td>
                      <td>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <div className="action-buttons">
                          {item.status === 'Assigned' && (
                            <button className="btn-icon btn-icon-primary me-1" title="Démarrer l’intervention" data-tooltip="Démarrer l’intervention" onClick={() => handleStart(item.id)} type="button">▶️</button>
                          )}
                          {item.status === 'In Progress' && (
                            <button className="btn-icon btn-icon-success me-1" title="Compléter l’intervention" data-tooltip="Compléter l’intervention" onClick={() => handleComplete(item.id)} type="button">
                              ✅
                            </button>
                          )}
                          {item.status === 'Completed' && (
                            <button className="btn-icon btn-icon-info" title="Voir le rapport" data-tooltip="Voir le rapport" onClick={() => selectIntervention(item)} type="button">📄</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role === 'Client') {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>🛠️ Gestion des interventions</h1>
            <p className="text-muted mb-0">Déclarez une intervention et consultez l’état de vos demandes.</p>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="card mb-4">
          <div className="card-body">
            <h3>{clientForm.id ? '✏️ Modifier l\'intervention' : '🛠️ Déclarer une intervention'}</h3>
            {clientMessage && <div className="alert alert-success">{clientMessage}</div>}
            <form onSubmit={handleClientSubmit}>
              <div className="form-grid">
                <div className="form-field col-6">
                  <label className="form-label">Équipement concerné</label>
                  <select name="equipmentId" value={clientForm.equipmentId} onChange={handleClientChange} className="form-select" required>
                    <option value="">-- Sélectionner --</option>
                    {equipments.map((item) => (
                      <option key={item.id} value={item.id}>{item.name} — {item.brand || 'Marque inconnue'}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field col-6">
                  <label className="form-label">Priorité</label>
                  <select name="priority" value={clientForm.priority} onChange={handleClientChange} className="form-select">
                    <option>Faible</option>
                    <option>Moyenne</option>
                    <option>Haute</option>
                  </select>
                </div>
                <div className="form-field col-12">
                  <label className="form-label">Titre</label>
                  <input name="title" value={clientForm.title} onChange={handleClientChange} className="form-control" required />
                </div>
                <div className="form-field col-12">
                  <label className="form-label">Description du problème</label>
                  <textarea name="description" value={clientForm.description} onChange={handleClientChange} className="form-control" rows="3" required />
                </div>
                <div className="form-field col-12">
                  <div className="form-actions">
                    <button className='btn btn-primary' type='submit'>{clientForm.id ? '💾 Enregistrer' : 'Créer la demande'}</button>
                    {clientForm.id && <button className='btn btn-outline-secondary' type='button' onClick={() => setClientForm({ id: null, equipmentId: '', title: '', description: '', priority: 'Medium' })}>Annuler</button>}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3>📋 Mes interventions</h3>
            <div className="card mb-3 p-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                placeholder="Rechercher une intervention"
              />
            </div>
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Équipement</th>
                    <th>Statut</th>
                    <th>Technicien</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterventions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-muted">Aucune intervention trouvée.</td>
                    </tr>
                  ) : (
                    pageInterventions.map((item) => (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{item.equipmentName}</td>
                        <td>{renderStatusBadge(item.status)}</td>
                        <td>{item.technicianName || 'Non affecté'}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-icon btn-icon-info me-1" title="Voir les détails" data-tooltip="Voir les détails" onClick={() => setSelectedIntervention(item)}>
                              👁️
                            </button>
                            <button className="btn-icon btn-icon-warning me-1" title="Modifier" data-tooltip="Modifier" onClick={() => handleClientEdit(item)}>
                              ✏️
                            </button>
                            <button className="btn-icon btn-icon-danger" title="Supprimer" data-tooltip="Supprimer" onClick={() => handleDelete(item.id)}>
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {selectedIntervention && (
              <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-dialog-centered" role="document">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Détails de l'intervention</h5>
                      <button type="button" className="btn-close" onClick={() => setSelectedIntervention(null)}></button>
                    </div>
                    <div className="modal-body">
                      <h5>{selectedIntervention.title}</h5>
                      <p className="mb-1"><strong>Description :</strong> {selectedIntervention.description || 'Aucune description'}</p>
                      <p className="mb-1"><strong>Priorité :</strong> {selectedIntervention.priority}</p>
                      <p className="mb-1"><strong>Statut :</strong> {renderStatusBadge(selectedIntervention.status)}</p>
                      <p className="mb-0"><strong>Technicien :</strong> {selectedIntervention.technicianName || 'Non affecté'}</p>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setSelectedIntervention(null)}>Fermer</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (user?.role === 'Technician') {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>🛠️ Interventions assignées</h1>
            <p className="text-muted mb-0">Toutes les interventions assignées à vous.</p>
          </div>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        {renderTechnicianTable()}
      </div>
    );
  }

  // Admin view: form to create/edit interventions + table of all interventions
  if (user?.role === 'Admin') {
    const totalPagesAdmin = Math.max(1, Math.ceil(filteredInterventions.length / pageSize));
    const pageInterventionsAdmin = filteredInterventions.slice((page - 1) * pageSize, page * pageSize);

    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>🛠️ Gestion des interventions</h1>
            <p className="text-muted mb-0">Suivez, affectez et gérez l’ensemble des interventions.</p>
          </div>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="card mb-4">
          <div className="card-body">
            <h3>{form.id ? 'Modifier une intervention' : 'Créer une intervention'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field col-4">
                  <label className="form-label">Client</label>
                  <select name="clientId" value={form.clientId} onChange={handleChange} className="form-select" required>
                    <option value="">-- Sélectionner --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field col-4">
                  <label className="form-label">Équipement</label>
                  <select name="equipmentId" value={form.equipmentId} onChange={handleChange} className="form-select">
                    <option value="">-- Optionnel --</option>
                    {equipments.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field col-4">
                  <label className="form-label">Technicien</label>
                  <select name="technicianId" value={form.technicianId} onChange={handleChange} className="form-select">
                    <option value="">-- Non affecté --</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>{t.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field col-6">
                  <label className="form-label">Titre</label>
                  <input name="title" value={form.title} onChange={handleChange} className="form-control" required />
                </div>
                <div className="form-field col-6">
                  <label className="form-label">Priorité</label>
                  <select name="priority" value={form.priority} onChange={handleChange} className="form-select">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
                <div className="form-field col-12">
                  <label className="form-label">Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} className="form-control" rows="3" />
                </div>
                <div className="form-field col-12">
                  <div className="form-actions">
                    <button className="btn btn-primary" type="submit">{form.id ? '💾 Enregistrer' : '➕ Créer'}</button>
                    {form.id && <button className="btn btn-outline-secondary" type="button" onClick={() => setForm({ id: null, title: '', description: '', priority: 'Medium', status: 'Pending', clientId: '', equipmentId: '', technicianId: '' })}>Annuler</button>}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3>Interventions</h3>
            <div className="card mb-3 p-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                placeholder="Rechercher une intervention"
              />
            </div>
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Client</th>
                    <th>Équipement</th>
                    <th>Priorité</th>
                    <th>Statut</th>
                    <th>Technicien</th>
                    <th>Créée le</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterventions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-muted">Aucune intervention trouvée.</td>
                    </tr>
                  ) : (
                    pageInterventionsAdmin.map((item) => (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{item.clientName}</td>
                        <td>{item.equipmentName}</td>
                        <td>{item.priority}</td>
                        <td>{renderStatusBadge(item.status)}</td>
                        <td>{item.technicianName || 'Non affecté'}</td>
                        <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : ''}</td>
                        <td>
                          <div className="action-buttons">
                            {!item.technicianId ? (
                              <>
                                <button className="btn-icon btn-icon-primary me-1" title="Affecter un technicien" data-tooltip="Affecter un technicien" onClick={() => openAssignModal(item)}>👤</button>
                                <button className="btn-icon btn-icon-danger" title="Supprimer" data-tooltip="Supprimer" onClick={() => handleDelete(item.id)}>🗑️</button>
                              </>
                            ) : (
                              <button className="btn-icon btn-icon-danger" title="Supprimer" data-tooltip="Supprimer" onClick={() => handleDelete(item.id)}>🗑️</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-muted">Page {page} / {totalPagesAdmin}</span>
              <div className="btn-group">
                <button className="btn btn-outline-secondary btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Précédent</button>
                <button className="btn btn-outline-secondary btn-sm" disabled={page === totalPagesAdmin} onClick={() => setPage(page + 1)}>Suivant</button>
              </div>
            </div>
          </div>
        </div>

        {assignTarget && (
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content rounded-4 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Affecter un technicien</h5>
                  <button type="button" className="btn-close" onClick={closeAssignModal}></button>
                </div>
                <div className="modal-body">
                  <label className="form-label">Technicien</label>
                  <select className="form-select" value={selectedTechnicianId} onChange={(e) => setSelectedTechnicianId(e.target.value)}>
                    <option value="">-- Sélectionner --</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>{t.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeAssignModal}>Annuler</button>
                  <button className="btn btn-primary" onClick={confirmAssign}>Affecter</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {!loading && user?.role !== 'Client' && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <span className="text-muted">Page {page} / {totalPages}</span>
          <div className="btn-group">
            <button className="btn btn-outline-secondary btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Précédent</button>
            <button className="btn btn-outline-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Suivant</button>
          </div>
        </div>
      )}
    </div>
  );
}


