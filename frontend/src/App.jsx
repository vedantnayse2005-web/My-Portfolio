
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import "./App.css";

import About from "./pages/About";
import Skills from "./pages/Skills";
import Projects from "./pages/Projects";
import Experience from "./pages/Experience";
import Contact from "./pages/Contact";
import Certificates from "./pages/Certificates";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import GitHubActivity from "./components/GitHubActivity";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

// Existing portfolio homepage
function Home() {
  return (
    <div className="portfolio-app">
      <Navbar />
      <Hero />
      <About />
      <Skills />
      <Projects />
      <GitHubActivity />
      <Experience />
      <Contact />
      <Footer />
    </div>
  );
}

// Main application
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Portfolio Homepage */}
        <Route path="/" element={<Home />} />
        <Route path="/certificates" element={<Certificates />} />

        {/* Admin Login */}
        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        {/* Protected Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            sessionStorage.getItem("adminToken") ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

