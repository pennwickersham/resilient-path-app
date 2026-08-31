import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { SubscriptionProvider } from './context/SubscriptionContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import WorkbookForms from './pages/WorkbookForms';
import Chatbot from './pages/Chatbot';
import EmergencyGuidance from './pages/EmergencyGuidance';
import HealthTools from './pages/HealthTools';
import CopingTools from './pages/CopingTools';
import FlareMode from './pages/FlareMode';
import Onboarding from './pages/Onboarding';
import DisclaimerPopup from './components/DisclaimerPopup';
import BackButtonHandler from './components/BackButtonHandler';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <SubscriptionProvider>
      <Router>
        <BackButtonHandler />
        <ScrollToTop />
        <DisclaimerPopup />
        <Routes>
          {/* Full-screen first-launch flow — outside Layout so no nav chrome */}
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="workbook" element={<WorkbookForms />} />
            <Route path="chatbot" element={<Chatbot />} />
            <Route path="emergency" element={<EmergencyGuidance />} />
            <Route path="health-tools" element={<HealthTools />} />
            <Route path="coping-tools" element={<CopingTools />} />
            {/* Flare Mode is deliberately ungated — never paywall a crisis */}
            <Route path="flare" element={<FlareMode />} />
          </Route>
        </Routes>
      </Router>
    </SubscriptionProvider>
  );
}

export default App;
