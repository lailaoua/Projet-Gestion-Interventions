import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getReports, createReport, downloadReportPdf, deleteReport } from '../services/reportsService';
import { getInterventions } from '../services/interventionsService';

function isCompletedStatus(status) {
  const normalized = (status || '').toLowerCase();
  return normalized.includes('complete') || normalized.includes('termin') || normalized.includes('done') || normalized.includes('fait');
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ interventionId: '', cause: '', solution: '', diagnostic: '', partsReplaced: '', testsPerformed: '', startTime: '', endTime: '', duration: '', recommendations: '', notes: '' });
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  function loadData() {
    setLoading(true);
    console.log('Loading reports data...');
    Promise.all([getReports(), getInterventions()])
      .then(([rRes, iRes]) => {
        console.log('Reports response:', rRes);
        console.log('Reports data:', rRes.data);
        console.log('Interventions response:', iRes);
        setReports(rRes.data || []);
        setInterventions((iRes.data || []).filter((item) => isCompletedStatus(item.status)));
      })
      .catch(err => {
        console.error('Error loading reports:', err);
        console.error('Error response:', err.response);
        setError(err.response?.data?.message || err.message || 'Erreur');
      })
      .finally(() => setLoading(false));
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.interventionId) return setError('Sélectionnez une intervention');
    if (!form.cause.trim() || !form.solution.trim()) return setError('La cause et la solution sont obligatoires');

    createReport(form.interventionId, {
      cause: form.cause.trim(),
      solution: form.solution.trim(),
      diagnostic: form.diagnostic.trim(),
      partsReplaced: form.partsReplaced.trim(),
      testsPerformed: form.testsPerformed.trim(),
      startTime: form.startTime.trim(),
      endTime: form.endTime.trim(),
      duration: form.duration.trim(),
      recommendations: form.recommendations.trim(),
      notes: form.notes.trim()
    })
      .then(() => {
        setForm({ interventionId: '', cause: '', solution: '', diagnostic: '', partsReplaced: '', testsPerformed: '', startTime: '', endTime: '', duration: '', recommendations: '', notes: '' });
        loadData();
      })
      .catch(err => setError(err.response?.data?.message || err.message || 'Erreur lors de la création du rapport'));
  }

  function handleDownload(reportId) {
    downloadReportPdf(reportId)
      .then((res) => {
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report-${reportId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(async (err) => {
        let msg = 'Impossible de télécharger le rapport.';
        try {
          const data = err.response?.data;
          if (data && data instanceof Blob) {
            const text = await data.text();
            const json = JSON.parse(text);
            msg = json.message || msg;
          } else if (err.response?.data?.message) {
            msg = err.response.data.message;
          }
        } catch (e) {
          // ignore parse errors
        }
        setError(msg);
      });
  }

  function handleDelete(reportId) {
    if (!window.confirm('Voulez-vous vraiment supprimer ce rapport ?')) {
      return;
    }

    deleteReport(reportId)
      .then(() => loadData())
      .catch(() => setError('Impossible de supprimer le rapport.'));
  }

  const filteredReports = (reports || []).filter((r) => {
    const searchText = `${r.intervention?.title || ''} ${r.intervention?.clientName || ''} ${r.cause || ''}`.toLowerCase();
    return searchText.includes(search.toLowerCase());
  });
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const pageReports = filteredReports.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <h1>Rapports</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-3 p-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="form-control" placeholder="Rechercher un rapport" />
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field col-4">
                <label className="form-label">Intervention</label>
                <select name="interventionId" value={form.interventionId} onChange={handleChange} className="form-select">
                  <option value="">-- Choisir --</option>
                  {interventions.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
                </select>
              </div>
              <div className="form-field col-4">
                <label className="form-label">Cause</label>
                <input name="cause" value={form.cause} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-field col-4">
                <label className="form-label">Solution</label>
                <input name="solution" value={form.solution} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-field col-6">
                <label className="form-label">Diagnostic</label>
                <textarea name="diagnostic" value={form.diagnostic} onChange={handleChange} className="form-control" rows={2}></textarea>
              </div>
              <div className="form-field col-6">
                <label className="form-label">Pièces remplacées</label>
                <textarea name="partsReplaced" value={form.partsReplaced} onChange={handleChange} className="form-control" rows={2}></textarea>
              </div>
              <div className="form-field col-6">
                <label className="form-label">Tests réalisés</label>
                <textarea name="testsPerformed" value={form.testsPerformed} onChange={handleChange} className="form-control" rows={2}></textarea>
              </div>
              <div className="form-field col-6">
                <label className="form-label">Recommandations</label>
                <textarea name="recommendations" value={form.recommendations} onChange={handleChange} className="form-control" rows={2}></textarea>
              </div>
              <div className="form-field col-3">
                <label className="form-label">Début</label>
                <input name="startTime" value={form.startTime} onChange={handleChange} className="form-control" placeholder="08:30" />
              </div>
              <div className="form-field col-3">
                <label className="form-label">Fin</label>
                <input name="endTime" value={form.endTime} onChange={handleChange} className="form-control" placeholder="10:15" />
              </div>
              <div className="form-field col-3">
                <label className="form-label">Durée</label>
                <input name="duration" value={form.duration} onChange={handleChange} className="form-control" placeholder="1h45" />
              </div>
              <div className="form-field col-12">
                <label className="form-label">Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} className="form-control" rows={3}></textarea>
              </div>
              <div className="form-field col-12">
                <div className="form-actions">
                  <button className="btn btn-primary" type="submit">➕ Créer rapport</button>
                  <button className="btn btn-outline-secondary" type="button" onClick={() => setForm({ interventionId: '', cause: '', solution: '', diagnostic: '', partsReplaced: '', testsPerformed: '', startTime: '', endTime: '', duration: '', recommendations: '', notes: '' })}>
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {loading ? <div>Chargement...</div> : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Intervention</th>
              <th>Cause</th>
              <th>Solution</th>
              <th>Durée</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pageReports.length === 0 && <tr><td colSpan={6}>Aucun rapport</td></tr>}
            {pageReports.map(r => (
              <tr key={r.id}>
                <td>{r.intervention?.title} - {r.intervention?.clientName}</td>
                <td>{r.cause}</td>
                <td>{r.solution}</td>
                <td>{r.duration}</td>
                <td>{new Date(r.reportDate).toLocaleDateString()}</td>
                <td>
                  <div className="btn-group">
                    <button className="btn-icon btn-icon-primary me-1" title="Voir" data-tooltip="Voir" onClick={() => navigate(`${r.id}`)}>👁️</button>
                    <button className="btn-icon btn-icon-info me-1" title="Télécharger PDF" data-tooltip="Télécharger PDF" onClick={() => handleDownload(r.id)}>📄</button>
                    <button className="btn-icon btn-icon-danger" title="Supprimer" data-tooltip="Supprimer" onClick={() => handleDelete(r.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="d-flex justify-content-between align-items-center mt-3">
        <span className="text-muted">Page {page} / {totalPages}</span>
        <div className="btn-group">
          <button className="btn btn-outline-secondary btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Précédent</button>
          <button className="btn btn-outline-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Suivant</button>
        </div>
      </div>
    </div>
  );
}
