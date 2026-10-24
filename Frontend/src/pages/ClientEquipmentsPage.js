import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAvailableEquipments, getMyEquipments } from '../services/equipmentsService';
import { getFullImageUrl } from '../services/api';

export default function ClientEquipmentsPage() {
  const { user } = useAuth();
  const [availableEquipments, setAvailableEquipments] = useState([]);
  const [myEquipments, setMyEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'Client') {
      setError('Veuillez vous connecter en tant que client pour consulter vos équipements.');
      setLoading(false);
      return;
    }

    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [availableRes, myRes] = await Promise.all([getAvailableEquipments(), getMyEquipments()]);
      setAvailableEquipments(availableRes.data || []);
      setMyEquipments(myRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Impossible de charger les équipements.');
    } finally {
      setLoading(false);
    }
  }

  const filteredAvailableEquipments = useMemo(() => {
    return availableEquipments.filter((equipment) =>
      `${equipment.name || ''}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [availableEquipments, search]);

  const filteredMyEquipments = useMemo(() => {
    return myEquipments.filter((equipment) =>
      `${equipment.name || ''}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [myEquipments, search]);

  const renderEquipmentCard = (equipment) => (
    <div key={equipment.id} className="col-12 col-md-6 col-xl-4">
      <div className="card h-100 border-0 shadow-sm rounded-4">
        <img
          src={equipment.photoUrl ? getFullImageUrl(equipment.photoUrl) : 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop'}
          alt={equipment.name}
          className="card-img-top rounded-top-4"
          style={{ height: '220px', objectFit: 'cover' }}
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop'; }}
        />
        <div className="card-body d-flex flex-column justify-content-between">
          <div>
            <h5 className="fw-bold mb-3 text-center">{equipment.name}</h5>
          </div>
          <button className="btn btn-outline-primary btn-sm mt-auto" onClick={() => setSelectedEquipment(equipment)}>
            Voir les détails
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h1 className="mb-1">Mes équipements</h1>
          <p className="text-muted mb-0">Consultez les équipements disponibles et ceux déjà attribués à votre compte.</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Rechercher un équipement</label>
              <input
                className="form-control"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher par nom"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="row g-4 mb-4">
            <div className="col-12">
              <div className="card shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
                    <div>
                      <h2 className="h5 mb-1">Équipements disponibles</h2>
                      <div className="small text-muted">{filteredAvailableEquipments.length} équipement(s) disponible(s)</div>
                    </div>
                  </div>

                  {filteredAvailableEquipments.length === 0 ? (
                    <div className="alert alert-light mb-0">Aucun équipement disponible ne correspond à votre recherche.</div>
                  ) : (
                    <div className="row g-4">{filteredAvailableEquipments.map(renderEquipmentCard)}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12">
              <div className="card shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
                    <div>
                      <h2 className="h5 mb-1">Mes équipements</h2>
                      <div className="small text-muted">{filteredMyEquipments.length} équipement(s) attribué(s)</div>
                    </div>
                  </div>

                  {filteredMyEquipments.length === 0 ? (
                    <div className="alert alert-light mb-0">Vous n’avez aucun équipement attribué pour le moment.</div>
                  ) : (
                    <div className="row g-4">{filteredMyEquipments.map(renderEquipmentCard)}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedEquipment && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content rounded-4 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title">Détails de l’équipement</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedEquipment(null)}></button>
              </div>
              <div className="modal-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="mb-0">{selectedEquipment.name}</h5>
                    <p className="text-muted small mb-0">{selectedEquipment.type || 'Type non renseigné'}</p>
                  </div>
                  <span className={`badge ${selectedEquipment.status === 'Out of Service' ? 'bg-danger' : selectedEquipment.status === 'Under Maintenance' ? 'bg-warning text-dark' : 'bg-success'}`}>
                    {selectedEquipment.status || 'Available'}
                  </span>
                </div>
                <p className="mb-2"><strong>Marque :</strong> {selectedEquipment.brand || '—'}</p>
                <p className="mb-2"><strong>Modèle :</strong> {selectedEquipment.model || '—'}</p>
                <p className="mb-2"><strong>Numéro de série :</strong> {selectedEquipment.serialNumber || '—'}</p>
                <p className="mb-2"><strong>Date d’installation :</strong> {selectedEquipment.installationDate ? new Date(selectedEquipment.installationDate).toLocaleDateString() : '—'}</p>
                {selectedEquipment.photoUrl && (
                  <p className="mb-2"><strong>Photo :</strong> <a href={selectedEquipment.photoUrl} target="_blank" rel="noreferrer">Voir photo</a></p>
                )}
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
