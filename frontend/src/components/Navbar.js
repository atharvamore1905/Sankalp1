import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const publicLinks = [
    { name: "Home", path: "/" },
    { name: "Jigyasa", path: "/jigyasa" },
    { name: "Drishtikon", path: "/drishtikon" },
  ];

  const privateLinks = [
    { name: "Margadarshak", path: "/margadarshak" },
    { name: "Samarthya", path: "/samarthya" },
    { name: "Unnati", path: "/unnati" },
    { name: "Sahyog", path: "/sahyog" },
  ];

  const navLinks = user ? [...publicLinks, ...privateLinks] : publicLinks;

  return (
    <nav className="navbar" data-testid="main-navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" data-testid="navbar-logo">
          <img src="/logo.png" alt="Sankalp Logo" className="logo-img" />
        </Link>

        <div className={`nav-menu ${isOpen ? 'active' : ''}`}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              data-testid={`nav-link-${link.name.toLowerCase()}`}
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="nav-auth">
          {user ? (
            <>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                data-testid="btn-dashboard"
                className="user-btn"
              >
                <User size={18} />
                <span>{user.name}</span>
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                data-testid="btn-logout"
              >
                <LogOut size={18} />
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/signin')}
                data-testid="btn-signin-nav"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate('/signup')}
                data-testid="btn-signup-nav"
                className="signup-btn"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>

        <div className="nav-toggle" onClick={() => setIsOpen(!isOpen)} data-testid="nav-toggle">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </div>
      </div>

      <style jsx>{`
        .navbar {
          background: white;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .navbar-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1rem clamp(1rem, 3vw, 2rem);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: #1a1a2e;
          font-weight: 700;
          font-size: 1.5rem;
        }

        .logo-img {
          height: 40px;
          width: auto;
        }

        .nav-auth {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .signup-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .nav-menu {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .nav-link {
          text-decoration: none;
          color: #4a5568;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.3s ease;
          position: relative;
        }

        .nav-link:hover {
          color: #667eea;
          background: rgba(102, 126, 234, 0.05);
        }

        .nav-link.active {
          color: #667eea;
          font-weight: 600;
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 3px;
          background: #667eea;
          border-radius: 2px;
        }

        .nav-toggle {
          display: none;
          cursor: pointer;
          color: #1a1a2e;
        }

        @media (max-width: 968px) {
          .nav-menu {
            position: fixed;
            left: -100%;
            top: 70px;
            flex-direction: column;
            background: white;
            width: 100%;
            text-align: center;
            transition: left 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            padding: 2rem 0;
            gap: 0;
          }

          .nav-menu.active {
            left: 0;
          }

          .nav-link {
            width: 100%;
            padding: 1rem;
          }

          .nav-auth {
            display: none;
          }

          .nav-toggle {
            display: block;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;