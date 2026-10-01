import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TopNav from './components/TopNav';
import GuidedFooter from './components/GuidedFooter';
import Dashboard from './pages/Dashboard';
import ReconstructionWorkspace from './pages/ReconstructionWorkspace';
import SegmentationWorkspace from './pages/SegmentationWorkspace';
import ResultsView from './pages/ResultsView';
import ExperimentAnalysis from './pages/ExperimentAnalysis';
import AIAssistant from './pages/AIAssistant';
import ResearchReport from './pages/ResearchReport';
import Methodology from './pages/Methodology';
import './styles/globals.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <TopNav />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reconstruction" element={<ReconstructionWorkspace />} />
          <Route path="/segmentation" element={<SegmentationWorkspace />} />
          <Route path="/results" element={<ResultsView />} />
          <Route path="/pipeline" element={<ResultsView />} />
          <Route path="/analysis" element={<ExperimentAnalysis />} />
          <Route path="/assistant" element={<AIAssistant />} />
          <Route path="/report" element={<ResearchReport />} />
          <Route path="/methodology" element={<Methodology />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <GuidedFooter />
      </div>
    </BrowserRouter>
  );
};

export default App;