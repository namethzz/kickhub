import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  matchPath,
} from "react-router-dom";
import "./discovery.css";
import "./features/parties/parties.css";
import BottomNav from "./components/Navbar";
import { lazy, Suspense } from "react";
const AuthPage = lazy(() => import("./features/live/AuthPage"));
import LiveFields from "./features/fields/LiveFields";
import LiveFieldDetail from "./features/fields/LiveFieldDetail";
import MyParties from "./features/live/MyParties";
import LiveParties from "./features/live/LiveParties";
import LivePartyDetail from "./features/live/LivePartyDetail";
import LiveRequests from "./features/live/LiveRequests";
import LiveProfile from "./features/live/LiveProfile";
import "./features/profiles/profiles.css";
import PlayerProfile from "./features/profiles/PlayerProfile";
import PartyRequests from "./features/profiles/PartyRequests";
import PartyHub from "./features/parties/PartyHub";
import CreatePartyFlow from "./features/parties/CreatePartyFlow";
import Home from "./components/home";
import Notifications from "./features/live/LiveNotifications";
import Owner from "./features/owner/OwnerDashboard";
import "./responsive.css";
import PolicyPage from "./features/policies/PolicyPages";
import DeleteAccount, { AccountDeleted } from "./features/policies/DeleteAccount";

function AppRoutes() {
  const location = useLocation();
  const hideNavPaths = [
    "/login",
    "/SignUp",
    "/register",
  ];
  const shouldHideNav = hideNavPaths.some((path) =>
    matchPath({ path, end: true }, location.pathname)
  );

  const shouldShowNav = !shouldHideNav;

  return (
    <div className={["/", "/home"].includes(location.pathname) ? "kh-app kh-app--home" : "kh-app"}>
      {shouldShowNav && <BottomNav />}
      <Suspense fallback={<main className="party-app" role="status">กำลังโหลดหน้าเข้าสู่ระบบ…</main>}>
      <Routes>
        
        <Route path="/privacy" element={<PolicyPage kind="privacy" />} />
        <Route path="/terms" element={<PolicyPage kind="terms" />} />
        <Route path="/data-deletion" element={<PolicyPage kind="deletion" />} />
        <Route path="/account/delete" element={<DeleteAccount />} />
        <Route path="/account-deleted" element={<AccountDeleted />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signUp" element={<AuthPage signup />} />
        <Route path="/register" element={<AuthPage signup />} />
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/my-parties" element={<MyParties />} />
        <Route path="/team" element={<LiveParties />} />
        <Route path="/players/:playerId" element={<LiveProfile />} />
        <Route path="/demo/party-requests" element={<PartyRequests />} />
        <Route path="/demo/team" element={<PartyHub />} />
        <Route path="/demo/players/:playerId" element={<PlayerProfile />} />
        <Route path="/profile" element={<LiveProfile own />} />
        <Route path="/parties/:partyId" element={<LivePartyDetail />} />
        <Route path="/party-requests/:partyId" element={<LiveRequests />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/create-party" element={<CreatePartyFlow />} />
        <Route path="/field" element={<LiveFields />} />
        <Route path="/fields/:fieldId" element={<LiveFieldDetail />} />
        <Route path="/Owner" element={<Owner />} />
      </Routes>
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
