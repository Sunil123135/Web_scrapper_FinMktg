import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { BriefPage } from "./pages/Brief";
import { DashboardPage } from "./pages/Dashboard";
import { LoginPage } from "./pages/Login";
import { SettingsPage } from "./pages/Settings";
import { SignupPage } from "./pages/Signup";
import { SourcesPage } from "./pages/Sources";

function ProtectedApp() {
  return (
    <>
      <SignedIn>
        <AppShell />
      </SignedIn>
      <SignedOut>
        <Navigate to="/login" replace />
      </SignedOut>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<ProtectedApp />}>
        <Route path="/sources" element={<SourcesPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/brief" element={<BriefPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
