import { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/usersService';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: null, fullName: '', email: '', phone: '', role: 'Technician', password: '' });
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { loadUsers(); }, []);

  function loadUsers() {
    setLoading(true);
    getUsers().then(res => setUsers(res.data)).catch(err => setError(err.message || 'Erreur')).finally(() => setLoading(false));
  }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = { fullName: form.fullName, email: form.email, phone: form.phone, role: form.role, password: form.password };
    const action = form.id ? updateUser(form.id, payload) : createUser(payload);
    action.then(() => { setForm({ id: null, fullName: '', email: '', phone: '', role: 'Technician', password: '' }); loadUsers(); }).catch(err => setError(err.message || 'Erreur'));
  }

  function handleEdit(u) { setForm({ id: u.id, fullName: u.fullName, email: u.email, phone: u.phone || '', role: u.role, password: '' }); }
  function handleDelete(id) { if (!window.confirm('Supprimer cet utilisateur ?')) return; deleteUser(id).then(() => loadUsers()).catch(err => setError(err.message || 'Erreur')); }

  return (
    <div>
      <h1>Utilisateurs</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card mb-3">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field col-4">
                <label className="form-label">Nom complet</label>
                <input name="fullName" value={form.fullName} onChange={handleChange} className="form-control" required />
              </div>
              <div className="form-field col-4">
                <label className="form-label">Email</label>
                <input name="email" value={form.email} onChange={handleChange} className="form-control" type="email" required />
              </div>
              <div className="form-field col-4">
                <label className="form-label">Téléphone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="form-control" type="tel" />
              </div>
              <div className="form-field col-4">
                <label className="form-label">Mot de passe</label>
                <input name="password" value={form.password} onChange={handleChange} className="form-control" type="password" required={!form.id} />
              </div>
              <div className="form-field col-4">
                <label className="form-label">Rôle</label>
                <select name="role" value={form.role} onChange={handleChange} className="form-select">
                  <option value="Admin">Admin</option>
                  <option value="Technician">Technician</option>
                </select>
              </div>
              <div className="form-field col-12">
                <div className="form-actions">
                  <button className="btn btn-primary">{form.id ? '💾 Enregistrer' : '➕ Créer'}</button>
                  {form.id && <button className="btn btn-outline-secondary" type="button" onClick={() => setForm({ id: null, fullName: '', email: '', phone: '', role: 'Technician', password: '' })}>Annuler</button>}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card mb-3 p-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="form-control" placeholder="Rechercher un utilisateur" />
      </div>

      {loading ? <div>Chargement...</div> : (
        <table className="table table-striped">
          <thead><tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Rôle</th><th></th></tr></thead>
          <tbody>
            {users.length === 0 && <tr><td colSpan={5}>Aucun utilisateur</td></tr>}
            {users.filter(u => `${u.fullName || ''} ${u.email || ''} ${u.phone || ''} ${u.role || ''}`.toLowerCase().includes(search.toLowerCase())).map(u => (
              <tr key={u.id}><td>{u.fullName}</td><td>{u.email}</td><td>{u.phone || '—'}</td><td>{u.role}</td><td>
                <button className="btn-icon btn-icon-secondary me-1" title="Modifier" data-tooltip="Modifier" onClick={() => handleEdit(u)}>✏️</button>
                <button className="btn-icon btn-icon-danger" title="Supprimer" data-tooltip="Supprimer" onClick={() => handleDelete(u.id)}>🗑️</button>
              </td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
