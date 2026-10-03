import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import CitizenLayout from './components/CitizenLayout';

// Landing Page
import LandingPage from './pages/LandingPage';

// Citizen Web Portal Pages
import CitizenHomePage from './pages/citizen/CitizenHomePage';
import CitizenAlertsPage from './pages/citizen/CitizenAlertsPage';
import CitizenIncidentReportPage from './pages/citizen/CitizenIncidentReportPage';
import CitizenCheckInPage from './pages/citizen/CitizenCheckInPage';
import CitizenSheltersPage from './pages/citizen/CitizenSheltersPage';
import CitizenGuidesPage from './pages/citizen/CitizenGuidesPage';
import CitizenProfilePage from './pages/citizen/CitizenProfilePage';

// Operator / Admin Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import NewEventPage from './pages/NewEventPage';
import GuidesPage from './pages/GuidesPage';
import LogsPage from './pages/LogsPage';
import AiAnomalyHubPage from './pages/AiAnomalyHubPage';
import SituationalAwarenessPage from './pages/SituationalAwarenessPage';
import IncidentReportsPage from './pages/IncidentReportsPage';
import SheltersPage from './pages/SheltersPage';
import EmergencyResourcesPage from './pages/EmergencyResourcesPage';
import ResponseOperationsPage from './pages/ResponseOperationsPage';
import SimulationLabPage from './pages/SimulationLabPage';
import ImpactIntelligencePage from './pages/ImpactIntelligencePage';
import RecoveryTrackingPage from './pages/RecoveryTrackingPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Public Citizen Web Portal */}
      <Route path="/citizen" element={<CitizenLayout />}>
        <Route index element={<CitizenHomePage />} />
        <Route path="alerts" element={<CitizenAlertsPage />} />
        <Route path="report" element={<CitizenIncidentReportPage />} />
        <Route path="check-in" element={<CitizenCheckInPage />} />
        <Route path="shelters" element={<CitizenSheltersPage />} />
        <Route path="guides" element={<CitizenGuidesPage />} />
        <Route path="profile" element={<CitizenProfilePage />} />
      </Route>

      {/* Protected Operator / Admin Console */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/ai-hub" element={<AiAnomalyHubPage />} />
        <Route path="/situational-awareness" element={<SituationalAwarenessPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/new" element={<NewEventPage />} />
        <Route path="/incidents" element={<IncidentReportsPage />} />
        <Route path="/shelters" element={<SheltersPage />} />
        <Route path="/resources" element={<EmergencyResourcesPage />} />
        <Route path="/tasks" element={<ResponseOperationsPage />} />
        <Route path="/simulation-lab" element={<SimulationLabPage />} />
        <Route path="/impact-intelligence" element={<ImpactIntelligencePage />} />
        <Route path="/recovery" element={<RecoveryTrackingPage />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/logs" element={<LogsPage />} />
      </Route>

      {/* Catch-all route redirects to public portal */}
      <Route path="*" element={<Navigate to="/citizen" replace />} />
    </Routes>
  );
}
