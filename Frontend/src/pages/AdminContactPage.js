import { useEffect, useState } from 'react';
import { getAllMessages, getMessage, markAsRead, replyMessage, deleteMessage } from '../services/contactsService';

function formatDate(dt) {
  return new Date(dt).toLocaleString('fr-FR');
}

export default function AdminContactPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllMessages();
      setMessages(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openMessage = async (id) => {
    const dto = await getMessage(id);
    setSelected(dto);
    setReplyText(dto.response || '');
  };

  const doMarkAsRead = async (id) => {
    await markAsRead(id);
    load();
  };

  const doReply = async () => {
    if (!selected) return;
    await replyMessage(selected.id, { response: replyText });
    setSelected(null);
    load();
  };

  const doDelete = async (id) => {
    if (!confirm('Supprimer ce message ?')) return;
    await deleteMessage(id);
    load();
  };

  return (
    <div className="container">
      <h1>Contact - Messages clients</h1>

      <div className="card p-3">
        {loading ? <div>Chargement...</div> : (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Sujet</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id} className={m.status === 'NonLu' ? 'table-warning' : ''}>
                    <td>{m.name || 'Non renseigné'}</td>
                    <td>{m.email || 'Non renseigné'}</td>
                    <td>{m.phone || 'Non renseigné'}</td>
                    <td>{m.subject}</td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.message}</td>
                    <td>{formatDate(m.createdAt)}</td>
                    <td>
                      <button className="btn-icon btn-icon-primary me-1" title="Voir" data-tooltip="Voir" onClick={() => openMessage(m.id)} type="button">👁️</button>
                      <button className="btn-icon btn-icon-success me-1" title="Marquer lu" data-tooltip="Marquer lu" onClick={() => doMarkAsRead(m.id)} type="button">✅</button>
                      <button className="btn-icon btn-icon-danger" title="Supprimer" data-tooltip="Supprimer" onClick={() => doDelete(m.id)} type="button">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="modal show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Message de {selected.name}</h5>
                <button type="button" className="btn-close" onClick={() => setSelected(null)}></button>
              </div>
              <div className="modal-body">
                <p><strong>De :</strong> {selected.name || 'Client inconnu'} &lt;{selected.email || 'non renseigné'}&gt;</p>
                <p><strong>Sujet :</strong> {selected.subject}</p>
                <p><strong>Message :</strong></p>
                <p>{selected.message}</p>
                <hr />
                <div>
                  <label className="form-label">Réponse</label>
                  <textarea className="form-control" rows={6} value={replyText} onChange={(e) => setReplyText(e.target.value)}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>Fermer</button>
                <button type="button" className="btn btn-primary" onClick={doReply}>Répondre</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
