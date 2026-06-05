import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserAuthProvider, useUserAuth } from './context/UserAuthContext';
import { CartProvider } from './context/CartContext';

import AdminLayout   from './components/Layout';
import UserLayout    from './components/UserLayout';
import ErrorBoundary from './components/ErrorBoundary';

// ── Admin pages — lazy loaded ─────────────────────────────────────────────────
const AdminLogin          = lazy(() => import('./pages/admin/Login'));
const AdminRegister       = lazy(() => import('./pages/admin/AdminRegister'));
const Dashboard           = lazy(() => import('./pages/admin/Dashboard'));
const Librat              = lazy(() => import('./pages/admin/Librat'));
const Autoret             = lazy(() => import('./pages/admin/Autoret'));
const Kategorite          = lazy(() => import('./pages/admin/Kategorite'));
const Botuesit            = lazy(() => import('./pages/admin/Botuesit'));
const Gjuhet              = lazy(() => import('./pages/admin/Gjuhet'));
const Seria               = lazy(() => import('./pages/admin/Seria'));
const Klientet            = lazy(() => import('./pages/admin/Klientet'));
const Adresat             = lazy(() => import('./pages/admin/Adresat'));
const Njoftimet           = lazy(() => import('./pages/admin/Njoftimet'));
const Porosite            = lazy(() => import('./pages/admin/Porosite'));
const Kuponat             = lazy(() => import('./pages/admin/Kuponat'));
const Promocionet         = lazy(() => import('./pages/admin/Promocionet'));
const Pagesat             = lazy(() => import('./pages/admin/Pagesat'));
const Dergesat            = lazy(() => import('./pages/admin/Dergesat'));
const Stoku               = lazy(() => import('./pages/admin/Stoku'));
const Kthimet             = lazy(() => import('./pages/admin/Kthimet'));
const Faturat             = lazy(() => import('./pages/admin/Faturat'));
const Vleresimet          = lazy(() => import('./pages/admin/Vleresimet'));
const ChangePassword      = lazy(() => import('./pages/admin/ChangePassword'));
const AdminForgotPassword = lazy(() => import('./pages/admin/ForgotPassword'));
const AdminResetPassword  = lazy(() => import('./pages/admin/ResetPassword'));

// ── User pages — lazy loaded ──────────────────────────────────────────────────
const Home               = lazy(() => import('./pages/user/Home'));
const Books              = lazy(() => import('./pages/user/Books'));
const BookDetail         = lazy(() => import('./pages/user/BookDetail'));
const Cart               = lazy(() => import('./pages/user/Cart'));
const Checkout           = lazy(() => import('./pages/user/Checkout'));
const UserLogin          = lazy(() => import('./pages/user/UserLogin'));
const Register           = lazy(() => import('./pages/user/Register'));
const Profile            = lazy(() => import('./pages/user/Profile'));
const Wishlist           = lazy(() => import('./pages/user/Wishlist'));
const About              = lazy(() => import('./pages/user/About'));
const UserForgotPassword = lazy(() => import('./pages/user/ForgotPassword'));
const UserResetPassword  = lazy(() => import('./pages/user/ResetPassword'));

// ── Loading fallback ──────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Route guards ──────────────────────────────────────────────────────────────
function AdminGuard({ children }) {
  const { user } = useAuth();
  if (!user)                 return <Navigate to="/admin/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function UserGuard({ children }) {
  const { user } = useUserAuth();
  if (!user)                return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  if (user.role !== 'user') return <Navigate to="/admin" replace />;
  return children;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <UserAuthProvider>
          <CartProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login"    element={<UserLogin />} />
                <Route path="/register" element={<Register />} />

                <Route path="/" element={<UserLayout />}>
                  <Route index           element={<Home />} />
                  <Route path="books"    element={<Books />} />
                  <Route path="about"    element={<About />} />
                  <Route path="book/:id" element={<BookDetail />} />
                  <Route path="cart"     element={<Cart />} />
                  <Route path="checkout" element={<UserGuard><Checkout /></UserGuard>} />
                  <Route path="profile"  element={<UserGuard><Profile /></UserGuard>} />
                  <Route path="wishlist" element={<UserGuard><Wishlist /></UserGuard>} />
                </Route>

                <Route path="/admin/login"           element={<AdminLogin />} />
                <Route path="/admin/register"        element={<AdminRegister />} />
                <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
                <Route path="/admin/reset-password"  element={<AdminResetPassword />} />

                <Route path="/forgot-password" element={<UserForgotPassword />} />
                <Route path="/reset-password"  element={<UserResetPassword />} />

                <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
                  <Route index element={<Dashboard />} />

                  <Route path="librat"      element={<Librat />} />
                  <Route path="autoret"     element={<Autoret />} />
                  <Route path="kategorite"  element={<Kategorite />} />
                  <Route path="botuesit"    element={<Botuesit />} />
                  <Route path="gjuhet"      element={<Gjuhet />} />
                  <Route path="seria"       element={<Seria />} />

                  <Route path="klientet"    element={<Klientet />} />
                  <Route path="adresat"     element={<Adresat />} />
                  <Route path="njoftimet"   element={<Njoftimet />} />

                  <Route path="porosite"    element={<Porosite />} />
                  <Route path="kuponat"     element={<Kuponat />} />
                  <Route path="promocionet" element={<Promocionet />} />
                  <Route path="pagesat"     element={<Pagesat />} />

                  <Route path="dergesat"    element={<Dergesat />} />
                  <Route path="stoku"       element={<Stoku />} />
                  <Route path="kthimet"     element={<Kthimet />} />
                  <Route path="faturat"     element={<Faturat />} />

                  <Route path="vleresimet"      element={<Vleresimet />} />
                  <Route path="change-password" element={<ChangePassword />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </Suspense>
            </BrowserRouter>
          </CartProvider>
        </UserAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
