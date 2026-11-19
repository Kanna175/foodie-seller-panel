import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import SplashScreen from './components/SplashScreen';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MenuPage from './pages/MenuPage';
import OrdersHistory from './pages/OrdersHistory';
import Earnings from './pages/Earnings';
import Profile from './pages/Profile';

function Protected({ children }) {
  const { session } = useAuth();
  return session ? children : <Navigate to="/login" replace />;
}

export default function App() {
  // Dark "foodie" splash, like the mobile app.
  const [booting, setBooting] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 1300);
    return () => clearTimeout(t);
  }, []);

  if (booting) return <SplashScreen />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<OrdersHistory />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
