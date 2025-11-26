import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@/App.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import { Toaster } from "@/components/ui/sonner";
import Home from "./pages/Home";
import Jigyasa from "./pages/Jigyasa";
import CollegeDetail from "./pages/CollegeDetail";
import SkillDetail from "./pages/SkillDetail";
import JobDetail from "./pages/JobDetail";
import Margadarshak from "./pages/Margadarshak";
import Samarthya from "./pages/Samarthya";
import Drishtikon from "./pages/Drishtikon";
import Sahyog from "./pages/Sahyog";
import Unnati from "./pages/Unnati";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <div className="app-wrapper">
      <Navbar />
      <main className="main-content">
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jigyasa" element={<Jigyasa />} />
        <Route path="/jigyasa/college/:id" element={<CollegeDetail />} />
        <Route path="/jigyasa/skill/:id" element={<SkillDetail />} />
        <Route path="/jigyasa/job/:id" element={<JobDetail />} />
        <Route path="/drishtikon" element={<Drishtikon />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/margadarshak" 
          element={
            <ProtectedRoute>
              <Margadarshak />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/samarthya" 
          element={
            <ProtectedRoute>
              <Samarthya />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/unnati" 
          element={
            <ProtectedRoute>
              <Unnati />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/sahyog" 
          element={
            <ProtectedRoute>
              <Sahyog />
            </ProtectedRoute>
          } 
        />
      </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;