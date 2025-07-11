import "./App.css";
import { PaperContextProvider } from "./contexts/PaperContext";
import { PaperReader } from "./containers/PaperReader";
import { useEffect } from "react";
import { TourProvider } from "./contexts/TourContext";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Home } from "./containers/ProjectPage";
import { PapersHub } from "./containers/PapersHub";
import { StorageProvider } from "./contexts/StorageContext";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { AnalysisProvider } from "./contexts/AnalysisContext";

function App() {
  useEffect(() => {
    window.sessionStorage.clear();
  }, []);

  return (
    <StorageProvider>
      <WorkspaceProvider>
        <TourProvider>
          <AnalysisProvider>
            <PaperContextProvider>
              <HashRouter>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/papers" element={<PapersHub />} />
                  <Route path="/paper-reader" element={<PaperReader />} />
                </Routes>
              </HashRouter>
            </PaperContextProvider>
          </AnalysisProvider>
        </TourProvider>
      </WorkspaceProvider>
    </StorageProvider>
  );
}

export default App;
