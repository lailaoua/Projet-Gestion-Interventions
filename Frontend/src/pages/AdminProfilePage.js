import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, LogIn, Edit2, Save, X, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [editedInfo, setEditedInfo] = useState({
    fullName: user?.fullName || user?.FullName || user?.name || user?.Name || '',
    email: user?.email || user?.Email || '',
    phone: user?.phone || user?.Phone || '',
  });


  const fullName = user?.fullName || user?.FullName || user?.name || user?.Name || 'Utilisateur';
  const email = user?.email || user?.Email || '';
  const role = user?.role || 'Admin';
  const userId = user?.id || 'N/A';

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSaveInfo = () => {
    if (editedInfo.password && editedInfo.password.length < 6) {
      setErrorMessage('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setSuccessMessage('Informations mises à jour avec succès');
    setTimeout(() => {
      setSuccessMessage('');
      setIsEditingInfo(false);
      setEditedInfo({ ...editedInfo, password: '' });
    }, 2000);
  };


  const getRoleBadgeColor = () => {
    if (role === 'Admin') return 'role-badge-admin';
    if (role === 'Technicien') return 'role-badge-tech';
    return 'role-badge-client';
  };

  return (
    <div className="container-fluid profile-page">
      <div className="profile-header mb-5">
        <h1 className="profile-title">👤 Mon Profil</h1>
        <p className="profile-subtitle">Gérez vos informations personnelles et vos paramètres de sécurité</p>
      </div>

      {/* Messages de succès/erreur */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show mb-4">
          <CheckCircle size={18} className="me-2" style={{ display: 'inline' }} />
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
        </div>
      )}
      {errorMessage && (
        <div className="alert alert-danger alert-dismissible fade show mb-4">
          <AlertCircle size={18} className="me-2" style={{ display: 'inline' }} />
          {errorMessage}
          <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
        </div>
      )}

      {/* Première Carte - Profil Fullwidth */}
      <div className="profile-card-fullwidth">
        <div className="profile-card-fullwidth-content">
          <div className="profile-card-fullwidth-left">
            <div className="profile-avatar-large">{getInitials(fullName)}</div>
            <div className="profile-info-fullwidth">
              <h2 className="profile-name-fullwidth">{fullName}</h2>
              <p className="profile-email-fullwidth">{email}</p>
              <div className="profile-badges-fullwidth">
                <span className={`badge ${getRoleBadgeColor()}`}>{role}</span>
                <span className="badge badge-status">🟢 Compte actif</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Carte combinée Informations Personnelles et Sécurité */}
      <div className="card profile-card profile-card-fullwidth">
        <div className="card-header-custom">
          <div className="d-flex align-items-center">
            <User size={20} className="me-2" />
            <h3 className="card-title mb-0">Informations Personnelles & Sécurité</h3>
          </div>
          {!isEditingInfo && (
            <button className="btn btn-sm btn-outline-primary" onClick={() => setIsEditingInfo(true)}>
              <Edit2 size={16} className="me-1" style={{ display: 'inline' }} />
              Modifier
            </button>
          )}
        </div>
        <div className="card-body">
          <div className="profile-info-grid">
            <div className="info-group">
              <label className="info-label">Nom complet</label>
              {isEditingInfo ? (
                <input
                  type="text"
                  className="form-control"
                  value={editedInfo.fullName}
                  onChange={(e) => setEditedInfo({ ...editedInfo, fullName: e.target.value })}
                />
              ) : (
                <p className="info-value">{editedInfo.fullName}</p>
              )}
            </div>

            <div className="info-group">
              <label className="info-label">Email</label>
              {isEditingInfo ? (
                <input
                  type="email"
                  className="form-control"
                  value={editedInfo.email}
                  onChange={(e) => setEditedInfo({ ...editedInfo, email: e.target.value })}
                />
              ) : (
                <p className="info-value">{editedInfo.email}</p>
              )}
            </div>

            <div className="info-group">
              <label className="info-label">Téléphone</label>
              {isEditingInfo ? (
                <input
                  type="tel"
                  className="form-control"
                  value={editedInfo.phone}
                  onChange={(e) => setEditedInfo({ ...editedInfo, phone: e.target.value })}
                />
              ) : (
                <p className="info-value">{editedInfo.phone || '—'}</p>
              )}
            </div>

            <div className="info-group">
              <label className="info-label">Rôle</label>
              <p className="info-value"><span className={`badge ${getRoleBadgeColor()}`}>{role}</span></p>
            </div>

            <div className="info-group">
              <label className="info-label">Mot de passe</label>
              {isEditingInfo ? (
                <input
                  type="password"
                  className="form-control"
                  placeholder="Nouveau mot de passe (optionnel)"
                  value={editedInfo.password || ''}
                  onChange={(e) => setEditedInfo({ ...editedInfo, password: e.target.value })}
                />
              ) : (
                <p className="security-value">••••••••••••</p>
              )}
            </div>
          </div>

          {isEditingInfo && (
            <div className="action-buttons mt-4">
              <button className="btn btn-primary" onClick={handleSaveInfo}>
                <Save size={16} className="me-2" style={{ display: 'inline' }} />
                Enregistrer
              </button>
              <button className="btn btn-secondary" onClick={() => setIsEditingInfo(false)}>
                <X size={16} className="me-2" style={{ display: 'inline' }} />
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grille 2 colonnes - Ligne 2 */}
      <div className="profile-cards-grid">
        {/* Carte Activité */}
        <div className="card profile-card">
          <div className="card-header-custom">
            <div className="d-flex align-items-center">
              <LogIn size={20} className="me-2" />
              <h3 className="card-title mb-0">Activité</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="activity-grid">
              <div className="activity-stat">
                <div className="activity-stat-value">15</div>
                <div className="activity-stat-label">Utilisateurs gérés</div>
              </div>
              <div className="activity-stat">
                <div className="activity-stat-value">42</div>
                <div className="activity-stat-label">Interventions supervisées</div>
              </div>
              <div className="activity-stat">
                <div className="activity-stat-value">8</div>
                <div className="activity-stat-label">Rapports créés</div>
              </div>
            </div>
          </div>
        </div>

        {/* Carte Informations du Compte */}
        <div className="card profile-card">
          <div className="card-header-custom">
            <div className="d-flex align-items-center">
              <Calendar size={20} className="me-2" />
              <h3 className="card-title mb-0">Informations du Compte</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="profile-info-grid">
              <div className="info-group">
                <label className="info-label">Date de création</label>
                <p className="info-value">19 juillet 2026</p>
              </div>

              <div className="info-group">
                <label className="info-label">Dernière connexion</label>
                <p className="info-value">Il y a 5 minutes</p>
              </div>

              <div className="info-group">
                <label className="info-label">Statut du compte</label>
                <p className="info-value"><span className="badge badge-success">🟢 Actif</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
