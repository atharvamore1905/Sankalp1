import { Link } from "react-router-dom";
import { Mail, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "Jigyasa", path: "/jigyasa" },
    { name: "Drishtikon", path: "/drishtikon" },
    { name: "Sign In", path: "/signin" },
    { name: "Sign Up", path: "/signup" }
  ];

  return (
    <footer className="footer" data-testid="footer">
      <div className="footer-content">
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-section brand-section">
            <div className="footer-logo">
              <img src="/logo.png" alt="Sankalp Logo" />
            </div>
            <h3>Sankalp</h3>
            <p>Your AI-Powered Career Growth Partner</p>
            <div className="social-links">
              <a href="#" aria-label="Facebook" data-testid="social-facebook">
                <Facebook size={20} />
              </a>
              <a href="#" aria-label="Twitter" data-testid="social-twitter">
                <Twitter size={20} />
              </a>
              <a href="#" aria-label="LinkedIn" data-testid="social-linkedin">
                <Linkedin size={20} />
              </a>
              <a href="#" aria-label="Instagram" data-testid="social-instagram">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link to={link.path} data-testid={`footer-link-${link.name.toLowerCase().replace(' ', '-')}`}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Modules */}
          <div className="footer-section">
            <h4>Our Modules</h4>
            <ul>
              <li><Link to="/jigyasa">Jigyasa</Link></li>
              <li><Link to="/margadarshak">Margadarshak</Link></li>
              <li><Link to="/samarthya">Samarthya</Link></li>
              <li><Link to="/drishtikon">Drishtikon</Link></li>
              <li><Link to="/sahyog">Sahyog</Link></li>
              <li><Link to="/unnati">Unnati</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-section">
            <h4>Contact Us</h4>
            <div className="contact-info">
              <div className="contact-item">
                <Mail size={18} />
                <a href="mailto:support@sankalp.ai" data-testid="contact-email">
                  support@sankalp.ai
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-bottom">
          <p data-testid="copyright">© {currentYear} Sankalp. All Rights Reserved.</p>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: #1a1a2e;
          color: white;
          padding: 3rem 0 1.5rem;
          margin-top: auto;
        }

        .footer-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 clamp(1rem, 3vw, 2rem);
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 3rem;
          margin-bottom: 3rem;
        }

        .footer-section h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: white;
        }

        .footer-section h4 {
          font-size: 1.125rem;
          margin-bottom: 1.5rem;
          color: #667eea;
          font-weight: 600;
        }

        .footer-section p {
          color: #a0aec0;
          line-height: 1.7;
          margin-bottom: 1.5rem;
        }

        .footer-logo {
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 12px;
          padding: 0.5rem;
          margin-bottom: 1rem;
        }

        .footer-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .social-links {
          display: flex;
          gap: 1rem;
        }

        .social-links a {
          width: 40px;
          height: 40px;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #667eea;
          transition: all 0.3s ease;
        }

        .social-links a:hover {
          background: #667eea;
          color: white;
          transform: translateY(-3px);
        }

        .footer-section ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-section ul li {
          margin-bottom: 0.75rem;
        }

        .footer-section ul li a {
          color: #a0aec0;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .footer-section ul li a:hover {
          color: #667eea;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #a0aec0;
        }

        .contact-item a {
          color: #a0aec0;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .contact-item a:hover {
          color: #667eea;
        }

        .footer-bottom {
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }

        .footer-bottom p {
          color: #a0aec0;
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .footer {
            padding: 2rem 0 1rem;
          }

          .footer-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .brand-section {
            text-align: center;
          }

          .footer-logo {
            margin-left: auto;
            margin-right: auto;
          }

          .social-links {
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
