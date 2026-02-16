import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { HomePage } from "./pages/HomePage";
import { ItineraryPage } from "./pages/ItineraryPage";
import { AdminPage } from "./pages/AdminPage";
import {
  AdminAuthContext,
  useAdminAuthProvider,
} from "./hooks/useAdminAuth";

export default function App() {
  const adminAuth = useAdminAuthProvider();

  return (
    <AdminAuthContext value={adminAuth}>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/itinerary" element={<ItineraryPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </AdminAuthContext>
  );
}
