import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyMessages, sendContact } from '../services/contactsService';

export default function ClientContactPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);

  const formatDate = (value) => {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return value;
    }
  };

  const loadMessages = async () => {
    try {
      setMessagesLoading(true);
      const data = await getMyMessages();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load messages error:', err);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendContact({
        name: user?.fullName || user?.name || 'Client',
        email: user?.email || user?.Email || '',
        subject,
        message
      });
      setStatus('Votre message a été envoyé avec succès à l\'administrateur.');
      setSubject('');
      setMessage('');
      await loadMessages();
    } catch (err) {
      console.error('Contact send error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de l\'envoi.';
      setStatus(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Contact</h1>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card p-4">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field col-12">
                  <label className="form-label">Nom</label>
                  <input className="form-control" value={user?.fullName || ''} disabled />
                </div>
                <div className="form-field col-12">
                  <label className="form-label">Email</label>
                  <input className="form-control" value={user?.email || ''} disabled />
                </div>
                <div className="form-field col-12">
                  <label className="form-label">Sujet</label>
                  <input className="form-control" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                </div>
                <div className="form-field col-12">
                  <label className="form-label">Message</label>
                  <textarea className="form-control" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} required />
                </div>
                <div className="form-field col-12">
                  <div className="form-actions">
                    <button className="btn btn-primary" type="submit" disabled={loading}>📧 Envoyer</button>
                    <button className="btn btn-outline-secondary" type="button" onClick={() => { setSubject(''); setMessage(''); }}>Effacer</button>
                  </div>
                </div>
              </div>
            </form>

            {status && <div className="alert alert-success mt-3">{status}</div>}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card p-4">
            <h5 className="mb-3">Mes messages envoyés</h5>
            {messagesLoading ? (
              <div className="text-muted">Chargement...</div>
            ) : messages.length === 0 ? (
              <div className="text-muted">Aucun message envoyé pour le moment.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Sujet</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((item) => (
                      <tr key={item.id}>
                        <td>{item.subject || 'Sans sujet'}</td>
                        <td>{formatDate(item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
