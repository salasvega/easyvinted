import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { NotificationBanner } from './components/NotificationBanner';

const DashboardPageV2 = lazy(() => import('./pages/DashboardPageV2').then(m => ({ default: m.DashboardPageV2 })));
const ArticleFormPageV2 = lazy(() => import('./pages/ArticleFormPageV2').then(m => ({ default: m.ArticleFormPageV2 })));
const PreviewPage = lazy(() => import('./pages/PreviewPage').then(m => ({ default: m.PreviewPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const PlannerPage = lazy(() => import('./pages/PlannerPage').then(m => ({ default: m.PlannerPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const FamilyMembersPage = lazy(() => import('./pages/FamilyMembersPage').then(m => ({ default: m.FamilyMembersPage })));
const PhotoStudioPage = lazy(() => import('./pages/PhotoStudioPage').then(m => ({ default: m.PhotoStudioPage })));
const AdminPageV2 = lazy(() => import('./pages/AdminPageV2').then(m => ({ default: m.AdminPageV2 })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const StructureFormPage = lazy(() => import('./pages/StructureFormPage').then(m => ({ default: m.StructureFormPage })));
const LotStructureFormPage = lazy(() => import('./pages/LotStructureFormPage').then(m => ({ default: m.LotStructureFormPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Pages publiques */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Onboarding (protégée mais sans AppLayout) */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            {/* Pages protégées */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <NotificationBanner />
                  <AppLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <Routes>
                        <Route path="/dashboard-v2" element={<DashboardPageV2 />} />
                        <Route path="/admin-v2" element={<AdminPageV2 />} />
                        <Route path="/articles/new-v2" element={<ArticleFormPageV2 />} />
                        <Route path="/articles/:id/edit-v2" element={<ArticleFormPageV2 />} />
                        <Route path="/articles/:id/preview" element={<PreviewPage />} />
                        <Route path="/articles/:id/structure" element={<StructureFormPage />} />
                        <Route path="/lots/:id/structure" element={<LotStructureFormPage />} />
                        <Route path="/analytics" element={<AnalyticsPage />} />
                        <Route path="/planner" element={<PlannerPage />} />
                        <Route path="/photo-studio" element={<PhotoStudioPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/family" element={<FamilyMembersPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/admin-v2" replace />} />
                      </Routes>
                    </Suspense>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
