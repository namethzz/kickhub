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
import Login from "./components/Login";
import Test1 from "./components/test";
import Test2 from "./components/test2";
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
import Party from "./components/party";
import Reserve from "./components/reserve";
import Promptpay from "./components/prompypay";
import ProtectedRoute from "./components/ProtectedRoute";
import SignUp from "./components/SignUp";
import FindCreateParty from "./components/FindCreateParty";
import FindandCreate from "./components/FindandCreate";
import Notifications from "./features/live/LiveNotifications";
import Partybuffet from "./components/Partybuffet";
import PartyRole from "./components/Partyrole";
import CreateParty from "./components/CreateParty";
import CreateParty2 from "./components/CreateParty2";
import Field from "./components/field";
import CountdownTimer from "./components/CountdownTimer";
import Owner from "./features/owner/OwnerDashboard";
import "./responsive.css";

function AppRoutes() {
  const location = useLocation();
  const hideNavPaths = [
    "/login",
    "/SignUp",
    "/register",
    "/reserve",
    "/promptpay",
    "/partybuffet/:id",
    "/partyrole/:id",
    "/historybuffet/:id",
    "/historyrole/:id",
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
        
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signUp" element={<AuthPage signup />} />
        <Route path="/register" element={<AuthPage signup />} />
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/partybuffet/:id" element={<Partybuffet />} />
        <Route path="/partyrole/:id" element={<PartyRole />} />
        <Route path="/my-parties" element={<MyParties />} />
        <Route path="/team" element={<LiveParties />} />
        <Route path="/players/:playerId" element={<LiveProfile />} />
        <Route path="/demo/party-requests" element={<PartyRequests />} />
        <Route path="/demo/team" element={<PartyHub />} />
        <Route path="/demo/players/:playerId" element={<PlayerProfile />} />
        <Route path="/profile" element={<LiveProfile own />} />
        <Route path="/parties/:partyId" element={<LivePartyDetail />} />
        <Route path="/party-requests/:partyId" element={<LiveRequests />} />
        <Route path="/legacy/team" element={<FindCreateParty />} />
        <Route path="/Findandcreate" element={<FindandCreate />} />
        <Route path="/test/:id" element={<Test2 />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/historybuffet/:id" element={<Partybuffet />} />
        <Route path="/historyrole/:id" element={<PartyRole />} />
        <Route path="/create-party" element={<CreatePartyFlow />} />
        <Route path="/legacy/create-party" element={<CreateParty />} />
        <Route path="/create-party2" element={<CreateParty2 />} />
        <Route path="/field" element={<LiveFields />} />
        <Route path="/fields/:fieldId" element={<LiveFieldDetail />} />
        <Route path="/legacy/field" element={<Field />} />
        <Route path="/countdown" element={<CountdownTimer />} />
        <Route path="/Owner" element={<Owner />} />

        <Route
          path="/test"
          element={
            <ProtectedRoute>
              <Test1 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/party"
          element={
            <ProtectedRoute>
              <Party />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reserve"
          element={
            <ProtectedRoute>
              <Reserve />
            </ProtectedRoute>
          }
        />
        <Route
          path="/promptpay"
          element={
            <ProtectedRoute>
              <Promptpay />
            </ProtectedRoute>
          }
        />
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
