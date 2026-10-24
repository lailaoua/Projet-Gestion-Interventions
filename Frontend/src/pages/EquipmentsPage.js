import { useEffect, useState } from 'react';
import { getEquipments, createEquipment, updateEquipment, deleteEquipment } from '../services/equipmentsService';
import { getClients } from '../services/clientsService';
import { getFullImageUrl } from '../services/api';

export default function EquipmentsPage() {
  const [equipments, setEquipments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: null, name: '', type: '', brand: '', model: '', serialNumber: '', clientId: '', photo: null, existingPhotoUrl: '' });
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignClientId, setAssignClientId] = useState('');
  const [detailsTarget, setDetailsTarget] = useState(null);

  useEffect(() => {
    loadData();
    loadClients();
  }, []);

  function loadData() {
    setLoading(true);
    getEquipments()
      .then(eqRes => {
        setEquipments(eqRes.data);
      })
      .catch(err => setError(err.message || 'Erreur'))
      .finally(() => setLoading(false));
  }

  function loadClients() {
    getClients()
      .then(res => setClients(res.data || []))
      .catch(() => setClients([]));
  }

  function handleChange(e) {
    const { name, value, files, type } = e.target;
    if (name === 'photo' && files?.length) {
      setForm({ ...form, photo: files[0] });
      return;
    }

    setForm({ ...form, [name]: value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name: form.name,
      type: form.type,
      brand: form.brand,
      model: form.model,
      serialNumber: form.serialNumber,
      clientId: form.clientId ? Number(form.clientId) : null,
      photo: form.photo
    };
    const action = form.id ? updateEquipment(form.id, payload) : createEquipment(payload);
    action.then(() => {
      setForm({ id: null, name: '', type: '', brand: '', model: '', serialNumber: '', clientId: '', photo: null, existingPhotoUrl: '' });
      loadData();
    }).catch(err => setError(err.response?.data?.message || err.message || 'Erreur'));
  }

  function handleEdit(eqp) {
    setForm({
      id: eqp.id,
      name: eqp.name || '',
      type: eqp.type || '',
      brand: eqp.brand || '',
      model: eqp.model || '',
      serialNumber: eqp.serialNumber || '',
      clientId: eqp.clientId ? String(eqp.clientId) : '',
      photo: null,
      existingPhotoUrl: eqp.photoUrl || ''
    });
  }

  function handleDelete(id) {
    if (!window.confirm('Supprimer cet équipement ?')) return;
    deleteEquipment(id).then(() => loadData()).catch(err => setError(err.message || 'Erreur'));
  }

  function openAssignModal(eqp) {
    setAssignTarget(eqp);
    setAssignClientId(eqp.clientId ? String(eqp.clientId) : '');
  }

  function closeAssignModal() {
    setAssignTarget(null);
    setAssignClientId('');
  }

  function openDetailsModal(eqp) {
    setDetailsTarget(eqp);
  }

  function closeDetailsModal() {
    setDetailsTarget(null);
  }

  function confirmAssign() {
    if (!assignTarget) {
      setError('Aucun équipement sélectionné.');
      return;
    }

    if (!assignClientId) {
      setError('Veuillez choisir un client avant de confirmer.');
      return;
    }

    const payload = {
      name: assignTarget.name,
      type: assignTarget.type,
      brand: assignTarget.brand,
      model: assignTarget.model,
      serialNumber: assignTarget.serialNumber,
      clientId: Number(assignClientId)
    };

    updateEquipment(assignTarget.id, payload)
      .then(() => {
        closeAssignModal();
        loadData();
      })
      .catch(err => setError(err.response?.data?.message || err.message || 'Erreur lors de l’affectation.'));
  }

  return (
    <div>
      <h1>Équipements</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-3">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field col-3">
                <label className="form-label">Nom</label>
                <input name="name" value={form.name} onChange={handleChange} className="form-control" required />
              </div>
              <div className="form-field col-2">
                <label className="form-label">Type</label>
                <input name="type" value={form.type} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-field col-2">
                <label className="form-label">Marque</label>
                <input name="brand" value={form.brand} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-field col-2">
                <label className="form-label">Modèle</label>
                <input name="model" value={form.model} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-field col-2">
                <label className="form-label">N° série</label>
                <input name="serialNumber" value={form.serialNumber} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-field col-2">
                <label className="form-label">Client</label>
                <select name="clientId" value={form.clientId} onChange={handleChange} className="form-select">
                  <option value="">Aucun client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.companyName}</option>
                  ))}
                </select>
              </div>
              <div className="form-field col-4">
                <label className="form-label">Photo</label>
                <input name="photo" type="file" accept="image/*" className="form-control" onChange={handleChange} />
                {form.existingPhotoUrl && !form.photo && (
                  <div className="mt-2">
                    <small>Photo actuelle :</small>
                    <div className="mt-1">
                      <img src={getFullImageUrl(form.existingPhotoUrl)} alt="Photo équipement" style={{ maxWidth: '120px', borderRadius: '0.75rem', border: '1px solid #dde3ee' }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="form-field col-12">
                <div className="form-actions">
                  <button className="btn btn-primary" type="submit">{form.id ? '💾 Enregistrer' : '➕ Ajouter'}</button>
                  <button className="btn btn-outline-secondary" type="button" onClick={() => setForm({ id: null, name: '', type: '', brand: '', model: '', serialNumber: '', clientId: '', photo: null, existingPhotoUrl: '' })}>
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card mb-3 p-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="form-control" placeholder="Rechercher un équipement" />
      </div>

      {loading ? <div>Chargement...</div> : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Nom</th>
              <th>Type</th>
              <th>Marque</th>
              <th>Modèle</th>
              <th>Client</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {equipments.length === 0 && (
              <tr><td colSpan={7}>Aucun équipement</td></tr>
            )}
            {equipments.filter(eq => `${eq.name || ''} ${eq.brand || ''} ${eq.model || ''} ${eq.clientName || ''}`.toLowerCase().includes(search.toLowerCase())).map(eq => (
              <tr key={eq.id}>
                <td style={{ width: 120 }}>
                  <img
                    src={eq.photoUrl ? getFullImageUrl(eq.photoUrl) : 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop'}
                    alt={eq.name}
                    style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #dee2e6' }}
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop'; }}
                  />
                </td>
                <td>{eq.name}</td>
                <td>{eq.type}</td>
                <td>{eq.brand}</td>
                <td>{eq.model}</td>
                <td>{eq.clientName || 'Aucun client'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon btn-icon-secondary me-1" title="Modifier" data-tooltip="Modifier" onClick={() => handleEdit(eq)}>✏️</button>
                    {!eq.clientName && (
                      <button
                        className="btn-icon btn-icon-success me-1"
                        title="Affecter un client"
                        data-tooltip="Affecter un client"
                        onClick={() => openAssignModal(eq)}
                      >
                        👤
                      </button>
                    )}
                    <button className="btn-icon btn-icon-info me-1" title="Voir détails" data-tooltip="Voir détails" onClick={() => openDetailsModal(eq)}>👁️</button>
                    <button className="btn-icon btn-icon-danger" title="Supprimer" data-tooltip="Supprimer" onClick={() => handleDelete(eq.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {assignTarget && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content rounded-4 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title">Affecter un client</h5>
                <button type="button" className="btn-close" onClick={closeAssignModal}></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">Équipement : <strong>{assignTarget.name}</strong></p>
                <div className="mb-3">
                  <label className="form-label">Client</label>
                  <select className="form-select" value={assignClientId} onChange={(e) => setAssignClientId(e.target.value)}>
                    <option value="">Sélectionner un client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.companyName}</option>
                    ))}
                  </select>
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary" onClick={closeAssignModal}>Annuler</button>
                <button className="btn btn-primary" onClick={confirmAssign}>Confirmer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailsTarget && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content rounded-4 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title">Détails de l’équipement</h5>
                <button type="button" className="btn-close" onClick={closeDetailsModal}></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-3">
                  <img
                    src={detailsTarget.photoUrl ? getFullImageUrl(detailsTarget.photoUrl) : 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop'}
                    alt={detailsTarget.name}
                    className="img-fluid rounded-4"
                    style={{ maxHeight: '220px', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop'; }}
                  />
                </div>
                <h5 className="mb-2">{detailsTarget.name || 'Nom indisponible'}</h5>
                <p className="mb-1"><strong>Type :</strong> {detailsTarget.type || '—'}</p>
                <p className="mb-1"><strong>Marque :</strong> {detailsTarget.brand || '—'}</p>
                <p className="mb-1"><strong>Modèle :</strong> {detailsTarget.model || '—'}</p>
                <p className="mb-1"><strong>Numéro de série :</strong> {detailsTarget.serialNumber || '—'}</p>
                <p className="mb-1"><strong>Client :</strong> {detailsTarget.clientName || 'Aucun client'}</p>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary" onClick={closeDetailsModal}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
