import { useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

export default function AdminDashboardAnalytics({ analytics, filter, onFilterChange, showMetrics = true }) {
  const barData = useMemo(() => ({
    labels: analytics.barChart.labels,
    datasets: [{
      label: 'Interventions terminées',
      data: analytics.barChart.values,
      backgroundColor: 'rgba(15, 118, 110, 0.75)',
      borderColor: 'rgba(15, 118, 110, 1)',
      borderWidth: 1,
      borderRadius: 8,
      maxBarThickness: 45,
    }],
  }), [analytics.barChart.labels, analytics.barChart.values]);

  const pieData = useMemo(() => ({
    labels: analytics.pieChart.labels,
    datasets: [{
      data: analytics.pieChart.values,
      backgroundColor: ['#f59e0b', '#0d6efd', '#10b981'],
      hoverOffset: 6,
    }],
  }), [analytics.pieChart.labels, analytics.pieChart.values]);

  const lineData = useMemo(() => ({
    labels: analytics.lineChart.labels,
    datasets: [{
      label: 'Interventions réalisées',
      data: analytics.lineChart.values,
      borderColor: '#0d6efd',
      backgroundColor: 'rgba(13, 110, 253, 0.15)',
      fill: true,
      tension: 0.35,
      pointRadius: 4,
      pointBackgroundColor: '#0d6efd',
    }],
  }), [analytics.lineChart.labels, analytics.lineChart.values]);

  const workloadData = useMemo(() => ({
    labels: analytics.technicianStats?.map((tech) => tech.name) || [],
    datasets: [{
      label: 'Interventions totales',
      data: analytics.technicianStats?.map((tech) => tech.totalInterventions) || [],
      backgroundColor: 'rgba(59, 130, 246, 0.75)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
      borderRadius: 8,
      maxBarThickness: 45,
    }],
  }), [analytics.technicianStats]);

  const filterOptions = [
    { value: 'today', label: "Aujourd'hui" },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'year', label: 'Cette année' },
  ];

  return (
    <div className="analytics-panel">
      <div className="analytics-header">
        <div>
          <h2>Statistiques et analyses des techniciens</h2>
          <p className="text-muted">Analyse de performance, classement et tendances par technicien.</p>
        </div>
        <div className="filter-group">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              className={`btn btn-sm btn-outline-primary ${filter === option.value ? 'active' : ''}`}
              onClick={() => onFilterChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-summary-grid">
        <div className="card p-4 analytics-summary-card">
          <h3 className="card-title">Interventions réalisées</h3>
          <div style={{ maxHeight: '120px', overflow: 'hidden' }}>
            <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
          </div>
        </div>

        <div className="card p-4 analytics-summary-card">
          <h3 className="card-title">Répartition des interventions</h3>
          <div style={{ maxHeight: '120px', overflow: 'hidden' }}>
            <Doughnut data={pieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
          </div>
        </div>
      </div>

      <div className="analytics-charts-grid">
        {analytics.ranking?.length > 0 && (
          <div className="card p-4 chart-card">
            <h3 className="card-title">Top 3 des techniciens</h3>
            <div className="ranking-list">
              {analytics.ranking.map((tech) => (
                <div key={tech.rank} className="ranking-item p-3" style={{ border: '1px solid #e9ecef', borderRadius: '0.75rem' }}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div>
                      <div className="h5 mb-1">{tech.name}</div>
                      <div className="text-muted">Classement #{tech.rank}</div>
                    </div>
                    <div className="badge bg-primary">{tech.completedInterventions} terminées</div>
                  </div>
                  <div className="d-flex flex-wrap gap-3">
                    <div><strong>Terminées :</strong> {tech.completedInterventions}</div>
                    <div><strong>Temps moyen :</strong> {tech.averageResolutionMinutes ? `${Math.round(tech.averageResolutionMinutes)} min` : 'N/A'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card p-4 chart-card">
          <h3 className="card-title">Charge de travail par technicien</h3>
          <Bar data={workloadData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        </div>
      </div>

      {analytics.technicianStats?.length > 0 && (
        <div className="card p-4 mt-4">
          <h3 className="card-title">Résumé des techniciens</h3>
          <div className="table-responsive analytics-table-wrapper">
            <table className="table table-borderless align-middle mb-0 analytics-table">
              <thead>
                <tr>
                  <th>Technicien</th>
                  <th className="text-end">Terminées</th>
                  <th className="text-end">En cours</th>
                  <th className="text-end">En attente</th>
                  <th className="text-end">Total</th>
                  <th className="text-end">Temps moy.</th>
                </tr>
              </thead>
              <tbody>
                {analytics.technicianStats.map((tech) => (
                  <tr key={tech.id}>
                    <td>{tech.name}</td>
                    <td className="text-end">{tech.completedInterventions}</td>
                    <td className="text-end">{tech.inProgressInterventions}</td>
                    <td className="text-end">{tech.pendingInterventions}</td>
                    <td className="text-end">{tech.totalInterventions}</td>
                    <td className="text-end">{tech.averageResolutionMinutes ? `${Math.round(tech.averageResolutionMinutes)} min` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
