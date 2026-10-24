import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import ClientDashboard from './pages/ClientDashboard';
import AdminStatisticsPage from './pages/AdminStatisticsPage';
import AdminContactPage from './pages/AdminContactPage';
import AdminProfilePage from './pages/AdminProfilePage';
import ClientEquipmentsPage from './pages/ClientEquipmentsPage';
import ClientContactPage from './pages/ClientContactPage';
import ClientProfilePage from './pages/ClientProfilePage';
import ClientsPage from './pages/ClientsPage';
import EquipmentsPage from './pages/EquipmentsPage';
import InterventionsPage from './pages/InterventionsPage';
import ReportsPage from './pages/ReportsPage';
import ReportDetailsPage from './pages/ReportDetailsPage';
import UsersPage from './pages/UsersPage';
import TechnicianProfilePage from './pages/TechnicianProfilePage';
import TechnicianStatisticsPage from './pages/TechnicianStatisticsPage';
import TechnicianContactPage from './pages/TechnicianContactPage';
import Navbar from './components/Navbar';

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}

function AppContent() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute role="Admin">
            <Routes>
              <Route path="" element={<AdminDashboard />} />
              <Route path="profile" element={<AdminProfilePage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="equipements" element={<EquipmentsPage />} />
              <Route path="statistiques" element={<AdminStatisticsPage />} />
              <Route path="contact" element={<AdminContactPage />} />
              <Route path="interventions" element={<InterventionsPage />} />
              <Route path="rapports" element={<ReportsPage />} />
              <Route path="rapports/:reportId" element={<ReportDetailsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="*" element={<AdminDashboard />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      <Route
        path="/technician/*"
        element={
          <ProtectedRoute role="Technician">
            <Routes>
              <Route path="" element={<TechnicianDashboard />} />
              <Route path="profile" element={<TechnicianProfilePage />} />
              <Route path="statistiques" element={<TechnicianStatisticsPage />} />
              <Route path="contact" element={<TechnicianContactPage />} />
              <Route path="interventions" element={<InterventionsPage />} />
              <Route path="rapports" element={<ReportsPage />} />
              <Route path="rapports/:reportId" element={<ReportDetailsPage />} />
              <Route path="*" element={<TechnicianDashboard />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      <Route
        path="/client/*"
        element={
          <ProtectedRoute role="Client">
            <Routes>
              <Route path="" element={<ClientDashboard />} />
              <Route path="profile" element={<ClientProfilePage />} />
              <Route path="equipements" element={<ClientEquipmentsPage />} />
              <Route path="contact" element={<ClientContactPage />} />
              <Route path="interventions" element={<InterventionsPage />} />
              <Route path="rapports" element={<ReportsPage />} />
              <Route path="rapports/:reportId" element={<ReportDetailsPage />} />
              <Route path="*" element={<ClientDashboard />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : user.role === 'Admin' ? (
            <Navigate to="/admin" replace />
          ) : user.role === 'Technician' ? (
            <Navigate to="/technician" replace />
          ) : (
            <Navigate to="/client" replace />
          )
        }
      />

      <Route
        path="*"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : user.role === 'Admin' ? (
            <Navigate to="/admin" replace />
          ) : user.role === 'Technician' ? (
            <Navigate to="/technician" replace />
          ) : (
            <Navigate to="/client" replace />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
