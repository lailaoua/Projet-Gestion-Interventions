import { useEffect, useState } from 'react';
import { getClients, createClient, updateClient, deleteClient } from '../services/clientsService';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ id: null, name: '', contactPerson: '', email: '', address: '', phone: '' });
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  function loadClients() {
    setLoading(true);
    getClients()
      .then(res => {
        const normalized = (res.data || []).map(client => ({
          ...client,
          name: client.companyName || client.name || client.CompanyName || ''
        }));
        setClients(normalized);
      })
      .catch(err => setError(err.message || 'Erreur'))
      .finally(() => setLoading(false));
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      companyName: (form.name || '').trim(),
      contactPerson: (form.contactPerson || '').trim(),
      email: (form.email || '').trim().toLowerCase(),
      address: (form.address || '').trim(),
      phone: (form.phone || '').trim()
    };

    if (!payload.companyName) {
      setError('Le nom du client est obligatoire.');
      return;
    }

    const action = form.id ? updateClient(form.id, payload) : createClient(payload);
    action
      .then(() => {
        setForm({ id: null, name: '', contactPerson: '', email: '', address: '', phone: '' });
        setShowForm(false);
        loadClients();
      })
      .catch(err => {
        const backendMessage = err.response?.data?.message || err.response?.data?.title || err.message || 'Erreur';
        setError(backendMessage);
      });
  }

  function handleEdit(client) {
    setForm({
      id: client.id,
      name: client.name || client.companyName || client.CompanyName || '',
      contactPerson: client.contactPerson || '',
      email: client.email || '',
      address: client.address || '',
      phone: client.phone || ''
    });
    setShowForm(true);
  }

  function handleDelete(id) {
    if (!window.confirm('Supprimer ce client ?')) return;
    deleteClient(id)
      .then(() => {
        if (selectedClient?.id === id) setSelectedClient(null);
        loadClients();
      })
      .catch(err => setError(err.message || 'Erreur'));
  }

  function handleView(client) {
    console.log('Viewing client:', client);
    setSelectedClient(client);
  }

  function resetForm() {
    setForm({ id: null, name: '', contactPerson: '', email: '', address: '', phone: '' });
    setShowForm(false);
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>👥 Gestion des Clients</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Annuler' : '+ Ajouter un client'}
        </button>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="card-title">{form.id ? '✏️ Modifier le client' : '➕ Ajouter un nouveau client'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field col-4">
                <label className="form-label">Nom de l'entreprise *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Ex: Entreprise ABC"
                  required
                />
              </div>
              <div className="form-field col-4">
                <label className="form-label">Personne de contact</label>
                <input
                  name="contactPerson"
                  value={form.contactPerson}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Ex: Jean Dupont"
                />
              </div>
              <div className="form-field col-4">
                <label className="form-label">Email</label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Ex: contact@entreprise.fr"
                />
              </div>
              <div className="form-field col-6">
                <label className="form-label">Adresse</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Ex: 123 rue de la Paix, Paris"
                />
              </div>
              <div className="form-field col-6">
                <label className="form-label">Téléphone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Ex: 01 23 45 67 89"
                />
              </div>
              <div className="form-field col-12">
                <div className="form-actions">
                  <button className="btn btn-primary" type="submit">
                    {form.id ? '💾 Enregistrer' : '➕ Ajouter'}
                  </button>
                  <button className="btn btn-outline-secondary" type="button" onClick={resetForm}>
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="card mb-4 p-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="form-control" placeholder="Rechercher un client" />
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : clients.length === 0 ? (
        <div className="card text-center p-5">
          <p className="text-muted mb-0">Aucun client pour le moment. Cliquez sur "Ajouter un client" pour commencer.</p>
        </div>
      ) : (
        <>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Nom de l'entreprise</th>
                <th>Personne de contact</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Adresse</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.filter(client => `${client.name || client.companyName || ''} ${client.email || ''}`.toLowerCase().includes(search.toLowerCase())).map(client => (
                <tr key={client.id}>
                  <td>{client.companyName || client.name || '-'}</td>
                  <td>{client.contactPerson || '-'}</td>
                  <td>{client.email || '-'}</td>
                  <td>{client.phone || '-'}</td>
                  <td>{client.address || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon btn-icon-info me-1"
                        title="Voir les détails"
                        data-tooltip="Voir les détails"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Button clicked for client:', client);
                          handleView(client);
                        }}
                        type="button"
                      >
                        👁️
                      </button>
                      <button 
                        className="btn-icon btn-icon-primary me-1"
                        title="Modifier"
                        data-tooltip="Modifier"
                        onClick={() => handleEdit(client)}
                        type="button"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-icon btn-icon-danger"
                        title="Supprimer"
                        data-tooltip="Supprimer"
                        onClick={() => handleDelete(client.id)}
                        type="button"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedClient && (
            <>
              <div 
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  zIndex: 1050
                }}
                onClick={() => setSelectedClient(null)}
              />
              <div 
                className="modal-dialog modal-lg" 
                role="document"
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '60%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1051,
                  margin: 0,
                  maxWidth: '800px',
                  width: '90%'
                }}
              >
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">📋 Détails du client</h5>
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => setSelectedClient(null)}
                    >
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <strong>Nom de l'entreprise :</strong>
                      <p className="mb-0">{selectedClient.companyName || selectedClient.name}</p>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <strong>👤 Personne de contact</strong>
                        <p className="mb-0">{selectedClient.contactPerson || '-'}</p>
                      </div>
                      <div className="col-md-6 mb-3">
                        <strong>📧 Email</strong>
                        <p className="mb-0">{selectedClient.email || '-'}</p>
                      </div>
                      <div className="col-md-6 mb-3">
                        <strong>📱 Téléphone</strong>
                        <p className="mb-0">{selectedClient.phone || '-'}</p>
                      </div>
                      <div className="col-md-6 mb-3">
                        <strong>🏠 Adresse</strong>
                        <p className="mb-0">{selectedClient.address || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setSelectedClient(null)}
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
