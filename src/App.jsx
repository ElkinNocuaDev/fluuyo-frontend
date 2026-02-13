import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AppHome from "./pages/AppHome";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { ProtectedRoute, PublicOnly } from "./auth/Guards";
import EntryRoute from "./auth/EntryRoute";
import Kyc from "./pages/Kyc";
import LoansAdmin from "./pages/admin/LoansAdmin";
import LoanPaymentsAdmin from "./pages/admin/LoanPaymentsAdmin";
import LoanDetailAdmin from "./pages/admin/LoanDetailAdmin"
import AdminLayout from "./components/AdminLayout";
import CreditAdmin from "./pages/admin/CreditAdmin";
import CreditDetailAdmin from "./pages/admin/CreditDetailAdmin";
import CreditLoansAdmin from "./pages/admin/CreditLoansAdmin";
import KycAdmin from "./pages/admin/KycAdmin";
import KycUserDetailAdmin from "./pages/admin/KycUserDetailAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import UserDetailAdmin from "./pages/admin/UserDetailAdmin";
import EmailNotVerified from "./pages/EmailNotVerified";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Entry inteligente */}
        <Route path="/" element={<EntryRoute />} />

        {/* Public */}
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnly>
              <Register />
            </PublicOnly>
          }
        />

        <Route
          path="/resend-verification"
          element={
            <PublicOnly>
              <EmailNotVerified />
            </PublicOnly>
          }
        />

        <Route
          path="/verify-email"
          element={
            <PublicOnly>
              <VerifyEmail />
            </PublicOnly>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <PublicOnly>
              <ForgotPassword />
            </PublicOnly>
          }
        />
        
        <Route
          path="/reset-password"
          element={
            <PublicOnly>
              <ResetPassword />
            </PublicOnly>
          }
        />

        {/* Protected */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/kyc"
          element={
            <ProtectedRoute>
              <Kyc />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
        
          <Route path="users" element={<UsersAdmin />} />
          <Route path="users/:id" element={<UserDetailAdmin />} />

          <Route path="loans" element={<LoansAdmin />} />
          <Route path="loans/:id" element={<LoanDetailAdmin />} />
          <Route path="loans/:id/payments" element={<LoanPaymentsAdmin />} />
        
          <Route path="credits" element={<CreditAdmin />} />
          <Route path="credits/:userId" element={<CreditDetailAdmin />} />
          <Route path="credits/:userId/loans" element={<CreditLoansAdmin />} />
        
          <Route path="kyc" element={<KycAdmin />} />
          <Route path="kyc/:userId" element={<KycUserDetailAdmin />} />
        </Route>

        {/* Fallback robusto (deep links / PWA) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
