import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import SellerDashboard from './pages/SellerDashboard';
import InvestorDashboard from './pages/InvestorDashboard';
import Marketplace from './pages/Marketplace';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceDetail from './pages/InvoiceDetail';
import {type User } from './types';

const queryClient = new QueryClient();

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              currentUser ? (
                <Navigate to={currentUser.user_type === 'seller' ? '/seller' : '/investor'} />
              ) : (
                <LandingPage onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/seller"
            element={
              currentUser && (currentUser.user_type === 'seller' || currentUser.user_type === 'both') ? (
                <SellerDashboard user={currentUser} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/investor"
            element={
              currentUser && (currentUser.user_type === 'investor' || currentUser.user_type === 'both') ? (
                <InvestorDashboard user={currentUser} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/marketplace"
            element={
              currentUser ? (
                <Marketplace user={currentUser} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/create-invoice"
            element={
              currentUser && (currentUser.user_type === 'seller' || currentUser.user_type === 'both') ? (
                <CreateInvoice user={currentUser} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/invoice/:id"
            element={
              currentUser ? (
                <InvoiceDetail user={currentUser} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;