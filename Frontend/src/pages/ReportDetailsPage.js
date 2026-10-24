import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getReportById, downloadReportPdf } from '../services/reportsService';
import { useAuth } from '../context/AuthContext';

export default function ReportDetailsPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!reportId) return;
    setLoading(true);
    getReportById(reportId)
      .then((res) => setReport(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, [reportId]);

  function handleDownload() {
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
        let msg = 'Impossible de télécharger le PDF.';
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
          // ignore
        }
        setError(msg);
      });
  }

  function formatValue(value) {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'string' && value.trim() === '') {
      return 'N/A';
    }
    return value;
  }

  function formatDate(value) {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('fr-FR');
    }
    return value;
  }

  if (loading) {
    return <div className="container py-4">Chargement...</div>;
  }

  if (error || !report) {
    return <div className="container py-4"><div className="alert alert-danger">{error || 'Rapport introuvable.'}</div></div>;
  }

  function getPriorityClass(priority) {
    switch ((priority || '').toLowerCase()) {
      case 'haute':
      case 'high':
        return 'badge badge-danger';
      case 'moyenne':
      case 'medium':
        return 'badge badge-warning';
      case 'faible':
      case 'low':
        return 'badge badge-success';
      default:
        return 'badge badge-secondary';
    }
  }

  function getStatusClass(status) {
    switch ((status || '').toLowerCase()) {
      case 'terminée':
      case 'completed':
        return 'badge badge-success';
      case 'en cours':
      case 'in progress':
      case 'en cours':
        return 'badge badge-info';
      case 'en attente':
      case 'pending':
        return 'badge badge-muted';
      default:
        return 'badge badge-secondary';
    }
  }

  return (
    <div className="container py-4 report-detail-page">
      <div className="report-header mb-4">
        <div className="report-headline">
          <div className="report-title">
            <div className="report-logo">IT</div>
            <div>
              <h1>Rapport d'intervention informatique</h1>
              <p className="report-subtitle">Document professionnel de synthèse de l'intervention</p>
            </div>
          </div>
          <div className="report-meta">
            <div><strong>Rapport N°</strong> : {report.reportNumber || `RPT-${report.id}`}</div>
            <div><strong>Date</strong> : {formatDate(report.reportDate)}</div>
            <div><strong>Statut</strong> : <span className={getStatusClass(report.intervention?.status)}>{formatValue(report.intervention?.status)}</span></div>
          </div>
        </div>

        <div className="report-actions">
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>← Retour</button>
          <button className="btn btn-primary" onClick={handleDownload}>Télécharger PDF</button>
        </div>
      </div>

      <div className="report-grid">
        <div className="report-card">
          <div className="report-card-header"><span>Client</span></div>
          <div className="report-card-body">
            <div className="report-row"><span>Nom</span><strong>{formatValue(report.intervention?.clientName)}</strong></div>
            <div className="report-row"><span>Société</span><strong>{formatValue(report.intervention?.clientCompany)}</strong></div>
            <div className="report-row"><span>Email</span><strong>{formatValue(report.intervention?.clientEmail)}</strong></div>
            <div className="report-row"><span>Téléphone</span><strong>{formatValue(report.intervention?.clientPhone)}</strong></div>
            <div className="report-row"><span>Adresse</span><strong>{formatValue(report.intervention?.clientAddress)}</strong></div>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-header"><span>Technicien</span></div>
          <div className="report-card-body">
            <div className="report-row"><span>Nom</span><strong>{formatValue(report.intervention?.technicianName)}</strong></div>
            <div className="report-row"><span>Email</span><strong>{formatValue(report.intervention?.technicianEmail)}</strong></div>
            <div className="report-row"><span>Téléphone</span><strong>{'N/A'}</strong></div>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-header"><span>Équipement</span></div>
          <div className="report-card-body">
            <div className="report-row"><span>Nom</span><strong>{formatValue(report.intervention?.equipmentName)}</strong></div>
            <div className="report-row"><span>Type</span><strong>{formatValue(report.intervention?.equipmentType)}</strong></div>
            <div className="report-row"><span>Marque</span><strong>{formatValue(report.intervention?.equipmentBrand)}</strong></div>
            <div className="report-row"><span>Modèle</span><strong>{formatValue(report.intervention?.equipmentModel)}</strong></div>
            <div className="report-row"><span>Numéro de série</span><strong>{formatValue(report.intervention?.equipmentSerialNumber)}</strong></div>
          </div>
        </div>
      </div>

      <div className="report-card report-card-full">
        <div className="report-card-header"><span>Intervention</span></div>
        <div className="report-card-body report-card-body-flex">
          <div className="report-row"><span>Titre</span><strong>{formatValue(report.intervention?.title)}</strong></div>
          <div className="report-row"><span>Description</span><strong>{formatValue(report.intervention?.description)}</strong></div>
          <div className="report-badges">
            <span className={getPriorityClass(report.intervention?.priority)}>Priorité: {formatValue(report.intervention?.priority)}</span>
            <span className={getStatusClass(report.intervention?.status)}>Statut: {formatValue(report.intervention?.status)}</span>
          </div>
          <div className="report-row"><span>Date de création</span><strong>{formatDate(report.intervention?.createdAt)}</strong></div>
          <div className="report-row"><span>Date de début</span><strong>{formatDate(report.startTime)}</strong></div>
          <div className="report-row"><span>Date de fin</span><strong>{formatDate(report.endTime)}</strong></div>
        </div>
      </div>

      <div className="report-card report-card-full report-card-technical">
        <div className="report-card-header"><span>Rapport technique</span></div>
        <div className="report-card-body report-card-body-technical">
          <div className="report-row"><span>Cause du problème</span><p>{formatValue(report.cause)}</p></div>
          <div className="report-row"><span>Diagnostic</span><p>{formatValue(report.diagnostic)}</p></div>
          <div className="report-row"><span>Solution appliquée</span><p>{formatValue(report.solution)}</p></div>
          <div className="report-row"><span>Pièces remplacées</span><p>{formatValue(report.partsReplaced)}</p></div>
          <div className="report-row"><span>Tests effectués</span><p>{formatValue(report.testsPerformed)}</p></div>
          <div className="report-row"><span>Durée</span><p>{formatValue(report.duration)}</p></div>
          <div className="report-row"><span>Remarques</span><p>{formatValue(report.notes)}</p></div>
          <div className="report-row"><span>Recommandations</span><p>{formatValue(report.recommendations)}</p></div>
        </div>
      </div>

      <div className="report-signature">
        <div>Technicien</div>
        <div className="report-signature-line">_____________________</div>
        <div>{formatValue(report.intervention?.technicianName)}</div>
      </div>
    </div>
  );
}
