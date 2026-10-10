import { Navigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // ✅ ใช้ named import

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const publicPaths = ["/login", "/signup"];

  const rawToken = localStorage.getItem("token");
  let token = null;
  let isExpired = false;

  // 🧠 ตรวจว่า token เป็น object หรือ string
  try {
    token = JSON.parse(rawToken); // custom token: { accessToken, expiry }
  } catch {
    token = rawToken; // JWT string
  }

  // 🔍 ตรวจหมดอายุ
  if (typeof token === "string") {
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        isExpired = true;
      }
    } catch {
      isExpired = true;
    }
  } else if (typeof token === "object" && token?.expiry) {
    if (Date.now() > token.expiry) {
      isExpired = true;
    }
  }

  // 🧹 ลบ token ถ้าหมดอายุ
  if (isExpired) {
    localStorage.removeItem("token");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 🛡️ ไม่มี token และไม่ใช่ public path → redirect
  // if (!token && !publicPaths.includes(location.pathname)) {
  //   return <Navigate to="/login" replace state={{ from: location }} />;
  // }

  // 🚫 มี token แล้วเข้า /login หรือ /signup → redirect ไปหน้าแรก
  if (token && publicPaths.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
