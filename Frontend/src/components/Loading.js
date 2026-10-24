export default function Loading({ message = 'Chargement...', size = 'default' }) {
  const sizes = {
    small: { width: '1.5rem', height: '1.5rem', borderWidth: '2px' },
    default: { width: '2.5rem', height: '2.5rem', borderWidth: '3px' },
    large: { width: '3.5rem', height: '3.5rem', borderWidth: '4px' }
  };

  const sizeStyles = sizes[size] || sizes.default;

  return (
    <div className="loading-container animate-fadeIn">
      <div
        className="spinner-border"
        role="status"
        style={{
          width: sizeStyles.width,
          height: sizeStyles.height,
          borderWidth: sizeStyles.borderWidth
        }}
      >
        <span className="visually-hidden">Chargement...</span>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}

export function PageLoading({ message = 'Chargement de la page...' }) {
  return (
    <div className="page-loading animate-fadeIn">
      <div className="loading-spinner-lg"></div>
      <p className="loading-text">{message}</p>
    </div>
  );
}

export function TableLoading({ rows = 5, columns = 5 }) {
  return (
    <div className="table-loading animate-fadeIn">
      <div className="table-loading-header">
        {[...Array(columns)].map((_, index) => (
          <div key={index} className="skeleton skeleton-header"></div>
        ))}
      </div>
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="table-loading-row">
          {[...Array(columns)].map((_, colIndex) => (
            <div key={colIndex} className="skeleton skeleton-text" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardLoading() {
  return (
    <div className="card animate-fadeIn">
      <div className="card-body">
        <div className="skeleton skeleton-card mb-3"></div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text-sm"></div>
        <div className="skeleton skeleton-text-sm" style={{ width: '40%' }}></div>
      </div>
    </div>
  );
}

export function DashboardCardLoading() {
  return (
    <div className="card animate-fadeIn">
      <div className="card-body">
        <div className="skeleton skeleton-icon mb-3"></div>
        <div className="skeleton skeleton-value mb-2"></div>
        <div className="skeleton skeleton-label"></div>
      </div>
    </div>
  );
}

export function FormLoading() {
  return (
    <div className="form-loading animate-fadeIn">
      <div className="skeleton skeleton-label mb-2"></div>
      <div className="skeleton skeleton-input mb-4"></div>
      <div className="skeleton skeleton-label mb-2"></div>
      <div className="skeleton skeleton-input mb-4"></div>
      <div className="skeleton skeleton-label mb-2"></div>
      <div className="skeleton skeleton-input mb-4"></div>
      <div className="skeleton skeleton-button"></div>
    </div>
  );
}
