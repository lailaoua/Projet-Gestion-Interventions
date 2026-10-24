import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode === 'client' ? 'signup' : 'login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'Admin' ? '/admin' : user.role === 'Technician' ? '/technician' : '/client');
    }
  }, [user, navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password: password.trim()
      };
      const response = await api.post('/auth/login', payload);
      login(response.data);
      const role = response.data?.user?.role ?? response.data?.user?.Role;
      navigate(role === 'Admin' ? '/admin' : role === 'Technician' ? '/technician' : '/client');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Échec de la connexion. Vérifiez vos identifiants.';
      setError(`❌ ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        fullName: fullName,
        email: email.trim().toLowerCase(),
        password: password.trim(),
        companyName,
        phone,
        address,
        role: 'Client'
      };
      const response = await api.post('/auth/register', payload);
      login(response.data);
      setSuccess('✅ Compte créé avec succès. Vous êtes redirigé vers votre espace client.');
      navigate('/client');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Impossible de créer le compte.';
      setError(`❌ ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img src="/logo.svg" alt="Logo" className="login-logo" />
            <h1 className="login-title">
              {mode === 'login' ? 'Connexion' : 'Créer un compte'}
            </h1>
            <p className="login-subtitle">Gestion Interventions - Système de maintenance</p>
          </div>

          {error && (
            <div className="alert alert-danger animate-fadeIn" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success animate-fadeIn" role="alert">
              {success}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label className="form-label">Adresse e-mail</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="admin@pfa.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                className="btn login-btn-submit btn-lg w-100"
                disabled={loading}
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="login-form">
              <div className="form-group">
                <label className="form-label">Nom complet</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Votre nom"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Adresse e-mail</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="client@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Créez un mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nom de l'entreprise</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Votre entreprise"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={loading}
                  autoComplete="organization"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Votre téléphone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  autoComplete="tel"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Adresse</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Votre adresse"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={loading}
                  autoComplete="street-address"
                />
              </div>

              <button
                type="submit"
                className="btn login-btn-submit btn-lg w-100"
                disabled={loading}
              >
                {loading ? 'Création du compte...' : 'Créer mon compte client'}
              </button>
            </form>
          )}

          <div className="login-footer">
            <p className="login-footer-text">
              {mode === 'login' 
                ? "Vous n'avez pas encore de compte? Créez-en un ci-dessous."
                : "Vous avez déjà un compte? Connectez-vous ci-dessous."}
            </p>
            <div className="login-mode-buttons">
              {mode === 'login' ? (
                <button
                  type="button"
                  className="login-mode-btn"
                  onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                >
                  Créer un compte
                </button>
              ) : (
                <button
                  type="button"
                  className="login-mode-btn"
                  onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                >
                  Se connecter
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
