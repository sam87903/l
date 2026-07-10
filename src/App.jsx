import { lazy, Suspense } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ProgressProvider, useProgress } from "./context/ProgressContext.jsx";
import { ToastProvider } from "./components/ui/Toast.jsx";
import { TimerProvider } from "./context/TimerContext.jsx";
import ErrorBoundary from "./components/ui/ErrorBoundary.jsx";
import LoadingScreen from "./components/ui/LoadingScreen.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";

// Code-Splitting: Seiten werden erst bei Bedarf geladen.
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const PlanPage = lazy(() => import("./pages/PlanPage.jsx"));
const DetailPage = lazy(() => import("./pages/DetailPage.jsx"));
const SemesterPage = lazy(() => import("./pages/SemesterPage.jsx"));
const GlossaryPage = lazy(() => import("./pages/GlossaryPage.jsx"));
const StatsPage = lazy(() => import("./pages/StatsPage.jsx"));
const ExamsPage = lazy(() => import("./pages/ExamsPage.jsx"));
const SettingsPage = lazy(() => import("./pages/SettingsPage.jsx"));

/** Wartet auf geladenen Fortschritt, dann Routing. */
function AppRoutes() {
  const { ready } = useProgress();
  if (!ready) return <LoadingScreen />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="plan" element={<PlanPage />} />
          <Route path="detail" element={<DetailPage />} />
          <Route path="semester" element={<SemesterPage />} />
          <Route path="glossar" element={<GlossaryPage />} />
          <Route path="statistik" element={<StatsPage />} />
          <Route path="klausuren" element={<ExamsPage />} />
          <Route path="einstellungen" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

/**
 * App-Wurzel. HashRouter, damit die Single-File-Version auch direkt
 * vom Dateisystem (file://) funktioniert.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ProgressProvider>
          <ToastProvider>
            <TimerProvider>
              <HashRouter>
                <AppRoutes />
              </HashRouter>
            </TimerProvider>
          </ToastProvider>
        </ProgressProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
