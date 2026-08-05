import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

// Pages
import Heute from '@/pages/Heute';
import Kompass from '@/pages/Kompass';
import CheckIn from '@/pages/CheckIn';
import Eingang from '@/pages/Eingang';
import Plan from '@/pages/Plan';
import Mehr from '@/pages/Mehr';
import Aufgaben from '@/pages/Aufgaben';
import Administration from '@/pages/Administration';
import EventEngine from '@/pages/EventEngine';
import Cases from '@/pages/Cases';
import CaseDetail from '@/pages/CaseDetail';
import CaseEngine from '@/pages/CaseEngine';

// Legacy Pages
import Dashboard from '@/pages/Dashboard';
import Documents from '@/pages/Documents';
import DocumentDetail from '@/pages/DocumentDetail';
import Finance from '@/pages/Finance';
import Deadlines from '@/pages/Deadlines';
import Settings from '@/pages/Settings';
import Vehicles from '@/pages/Vehicles';
import CashBook from '@/pages/CashBook';
import Assistant from '@/pages/Assistant';

// Layout
import AppLayout from '@/components/layout/AppLayout';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-muted-foreground">Projekt Atlas wird geladen...</span>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Executive Workspace */}
        <Route path="/" element={<Heute />} />
        <Route path="/kompass" element={<Kompass />} />
        <Route path="/check-in" element={<CheckIn />} />

        {/* Core Modules */}
        <Route path="/eingang" element={<Eingang />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/aufgaben" element={<Aufgaben />} />
        <Route path="/mehr" element={<Mehr />} />

        {/* Cases & Events */}
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/case-engine" element={<CaseEngine />} />
        <Route path="/event-engine" element={<EventEngine />} />

        {/* Administration */}
        <Route path="/administration" element={<Administration />} />

        {/* Legacy / noch zu prüfen */}
        <Route path="/dokumente" element={<Documents />} />
        <Route path="/dokumente/:id" element={<DocumentDetail />} />
        <Route path="/finanzen" element={<Finance />} />
        <Route path="/finanzen/neu" element={<Finance />} />
        <Route path="/fristen" element={<Deadlines />} />
        <Route path="/einstellungen" element={<Settings />} />
        <Route path="/fahrzeuge" element={<Vehicles />} />
        <Route path="/kassenbuch" element={<CashBook />} />
        <Route path="/assistent" element={<Assistant />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
