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
import Notifications from "./components/Notification";
import Partybuffet from "./components/Partybuffet";
import PartyRole from "./components/Partyrole";
import CreateParty from "./components/CreateParty";
import CreateParty2 from "./components/CreateParty2";
import Field from "./components/field";
import CountdownTimer from "./components/CountdownTimer";
import Owner from "./components/OwnerFieldManager";

function AppRoutes() {
  const location = useLocation();
  const hideNavPaths = [
    "/login",
    "/SignUp",
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
      <Routes>
        
        <Route path="/login" element={<Login />} />
        <Route path="/signUp" element={<SignUp />} />
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/partybuffet/:id" element={<Partybuffet />} />
        <Route path="/partyrole/:id" element={<PartyRole />} />
        <Route path="/team" element={<PartyHub />} />
        <Route path="/players/:playerId" element={<PlayerProfile />} />
        <Route path="/party-requests" element={<PartyRequests />} />
        <Route path="/legacy/team" element={<FindCreateParty />} />
        <Route path="/Findandcreate" element={<FindandCreate />} />
        <Route path="/test/:id" element={<Test2 />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/historybuffet/:id" element={<Partybuffet />} />
        <Route path="/historyrole/:id" element={<PartyRole />} />
        <Route path="/create-party" element={<CreatePartyFlow />} />
        <Route path="/legacy/create-party" element={<CreateParty />} />
        <Route path="/create-party2" element={<CreateParty2 />} />
        <Route path="/field" element={<Home />} />
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
