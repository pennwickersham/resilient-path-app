import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { SubscriptionProvider } from './context/SubscriptionContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import WorkbookForms from './pages/WorkbookForms';
import Chatbot from './pages/Chatbot';
import EmergencyGuidance from './pages/EmergencyGuidance';
import HealthTools from './pages/HealthTools';
import DisclaimerPopup from './components/DisclaimerPopup';
import BackButtonHandler from './components/BackButtonHandler';

function App() {
  return (
    <SubscriptionProvider>
      <Router>
        <BackButtonHandler />
        <DisclaimerPopup />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="workbook" element={<WorkbookForms />} />
            <Route path="chatbot" element={<Chatbot />} />
            <Route path="emergency" element={<EmergencyGuidance />} />
            <Route path="health-tools" element={<HealthTools />} />
          </Route>
        </Routes>
      </Router>
    </SubscriptionProvider>
  );
}

export default App;
