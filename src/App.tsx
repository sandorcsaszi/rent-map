import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider } from "./contexts/AuthContext";
import MapWithPlaces from "./containers/MapWithPlaces";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MapWithPlaces />} />
        </Routes>
        <Analytics />
        <SpeedInsights />
      </Router>
    </AuthProvider>
  );
}

export default App;
