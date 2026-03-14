import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import BuyerDashboard from "./pages/BuyerDashboard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import VendorDashboard from "./pages/VendorDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/vendor"
        element={
          <ProtectedRoute role="vendor">
            <VendorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/buyer"
        element={
          <ProtectedRoute role="buyer">
            <BuyerDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
