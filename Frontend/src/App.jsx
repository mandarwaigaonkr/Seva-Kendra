import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/shell/AppShell";
import ServerStatusBanner from "./components/ServerStatusBanner";
import { warmUpServer } from "./lib/api";

// Wake the backend as soon as the page opens, while the person is still typing.
warmUpServer();

const pages = {
  SignIn: () => import("./pages/SignIn"),
  Dashboard: () => import("./pages/Dashboard"),
  LegalAid: () => import("./pages/LegalAid"),
  Workshops: () => import("./pages/Workshops"),
  StudyCenters: () => import("./pages/StudyCenters"),
  Teachers: () => import("./pages/Teachers"),
  GroupLeaders: () => import("./pages/GroupLeaders"),
  SCStudents: () => import("./pages/SCStudents"),
  Dropouts: () => import("./pages/Dropouts"),
  Schools: () => import("./pages/Schools"),
  CompetitiveExams: () => import("./pages/CompetitiveExams"),
  BoardPreparation: () => import("./pages/BoardPreparation"),
  ModuleReports: () => import("./pages/ModuleReports"),
  HealthCamps: () => import("./pages/HealthCamps"),
  Elderly: () => import("./pages/Elderly"),
  MotherChild: () => import("./pages/MotherChild"),
  PWD: () => import("./pages/PWD"),
  Adolescents: () => import("./pages/Adolescents"),
  Tuberculosis: () => import("./pages/Tuberculosis"),
  HIV: () => import("./pages/HIV"),
  Leprosy: () => import("./pages/Leprosy"),
  Addiction: () => import("./pages/Addiction"),
  OtherDiseases: () => import("./pages/OtherDiseases"),
  CBUCBODetails: () => import("./pages/CBUCBODetails"),
  Entitlements: () => import("./pages/Entitlements"),
  TrackingDashboard: () => import("./pages/TrackingDashboard"),
  UrgentCases: () => import("./pages/UrgentCases"),
  UserManagement: () => import("./pages/UserManagement"),
};
const SignIn = lazy(pages.SignIn);
const Dashboard = lazy(pages.Dashboard);
const LegalAid = lazy(pages.LegalAid);
const Workshops = lazy(pages.Workshops);
const StudyCenters = lazy(pages.StudyCenters);
const Teachers = lazy(pages.Teachers);
const GroupLeaders = lazy(pages.GroupLeaders);
const SCStudents = lazy(pages.SCStudents);
const Dropouts = lazy(pages.Dropouts);
const Schools = lazy(pages.Schools);
const CompetitiveExams = lazy(pages.CompetitiveExams);
const BoardPreparation = lazy(pages.BoardPreparation);
const ModuleReports = lazy(pages.ModuleReports);
const HealthCamps = lazy(pages.HealthCamps);
const Elderly = lazy(pages.Elderly);
const MotherChild = lazy(pages.MotherChild);
const PWD = lazy(pages.PWD);
const Adolescents = lazy(pages.Adolescents);
const Tuberculosis = lazy(pages.Tuberculosis);
const HIV = lazy(pages.HIV);
const Leprosy = lazy(pages.Leprosy);
const Addiction = lazy(pages.Addiction);
const OtherDiseases = lazy(pages.OtherDiseases);
const CBUCBODetails = lazy(pages.CBUCBODetails);
const Entitlements = lazy(pages.Entitlements);
const TrackingDashboard = lazy(pages.TrackingDashboard);
const UrgentCases = lazy(pages.UrgentCases);
const UserManagement = lazy(pages.UserManagement);

/** Fetch every page chunk once the app is idle so navigation never waits on the network. */
const preloadPages = () => Object.values(pages).forEach((load) => load().catch(() => {}));

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" closeButton toastOptions={{ classNames: { toast: "font-sans" } }} />
      <ServerStatusBanner />
      <Router>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell preload={preloadPages} />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/beneficiaries" element={<Navigate to="/dashboard" replace />} />
              <Route path="/legal-aid" element={<LegalAid />} />
              <Route path="/workshops" element={<Workshops />} />
              <Route path="/reports" element={<Navigate to="/module-reports" replace />} />
              <Route path="/tracking" element={<TrackingDashboard />} />
              <Route path="/tracking/urgent-cases" element={<UrgentCases />} />
              <Route path="/education/study-centers" element={<StudyCenters />} />
              <Route path="/education/teachers" element={<Teachers />} />
              <Route path="/education/group-leaders" element={<GroupLeaders />} />
              <Route path="/education/sc-students" element={<SCStudents />} />
              <Route path="/education/dropouts" element={<Dropouts />} />
              <Route path="/education/schools" element={<Schools />} />
              <Route path="/education/competitive-exams" element={<CompetitiveExams />} />
              <Route path="/education/board-preparation" element={<BoardPreparation />} />
              <Route path="/module-reports" element={<ModuleReports />} />
              <Route path="/health/health-camps" element={<HealthCamps />} />
              <Route path="/health/elderly" element={<Elderly />} />
              <Route path="/health/mother-child" element={<MotherChild />} />
              <Route path="/health/pwd" element={<PWD />} />
              <Route path="/health/adolescents" element={<Adolescents />} />
              <Route path="/health/tuberculosis" element={<Tuberculosis />} />
              <Route path="/health/hiv" element={<HIV />} />
              <Route path="/health/leprosy" element={<Leprosy />} />
              <Route path="/health/addiction" element={<Addiction />} />
              <Route path="/health/other-diseases" element={<OtherDiseases />} />
              <Route path="/social-justice/cbucbo-details" element={<CBUCBODetails />} />
              <Route path="/social-justice/entitlements" element={<Entitlements />} />
              <Route path="/social-justice/legal-aid" element={<LegalAid />} />
              <Route path="/social-justice/workshops" element={<Workshops />} />
              <Route path="/users" element={<UserManagement />} />
            </Route>
            <Route path="/" element={<Navigate to="/signin" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
