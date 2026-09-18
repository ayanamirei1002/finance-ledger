import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Ledger from "./pages/Ledger";
import Invoice from "./pages/Invoice";
import Reconciliation from "./pages/Reconciliation";
import Report from "./pages/Report";
import Settings from "./pages/Settings";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="ledger" element={<Ledger />} />
        <Route path="invoice" element={<Invoice />} />
        <Route path="reconciliation" element={<Reconciliation />} />
        <Route path="report" element={<Report />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;