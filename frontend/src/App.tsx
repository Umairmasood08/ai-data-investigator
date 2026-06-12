import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./layout/Layout";

import Dashboard from "./pages/Dashboard";
import RiskCases from "./pages/RiskCases";
import Investigation from "./pages/Investigation";
import Graph from "./pages/Graph";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/risk" element={<RiskCases />} />
          <Route path="/graph" element={<Graph />} />
          <Route path="/investigation/:id" element={<Investigation />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}