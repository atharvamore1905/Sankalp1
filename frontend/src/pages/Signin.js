import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Signin = () => {
  const navigate = useNavigate();
  const { login, guestLogin } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  const handleGuestLogin = async () => {
    setError('');
    setGuestLoading(true);
    try {
      await guestLogin();
      navigate('/dashboard');
    } catch (err) {
      setError('Unable to initialize guest session. Please try again.');
    }
    setGuestLoading(false);
  };

  return (
    <div className="auth-page" data-testid="signin-page">
      <div className="auth-container">
        <Card className="auth-card">
          <CardHeader className="auth-header">
            <div className="auth-icon">
              <LogIn size={40} />
            </div>
            <CardTitle>Sign In to Sankalp</CardTitle>
            <p>Welcome back! Continue your career journey</p>
          </CardHeader>
          <CardContent>
            {/* Prominent Demo Mode / Continue as Guest Option */}
            <div className="guest-hero-box" data-testid="guest-hero-box">
              <div className="guest-hero-badge">
                <Sparkles size={14} className="text-amber-300" />
                <span>Recruiter & Visitor Preview</span>
              </div>
              <h4>Explore Sankalp Instantly</h4>
              <p>Experience all 6 modules, sample student profile, and AI career counseling with zero registration.</p>
              <Button
                type="button"
                onClick={handleGuestLogin}
                disabled={guestLoading}
                className="guest-action-btn"
                data-testid="btn-guest-login"
              >
                <Sparkles size={18} className="mr-2 text-amber-300" />
                {guestLoading ? 'Launching Demo Mode...' : 'Continue as Guest'}
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>

            <div className="auth-divider">
              <span>OR SIGN IN WITH ACCOUNT</span>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && (
                <div className="error-alert" data-testid="error-message">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <Label htmlFor="email">Email Address</Label>
                <div className="input-with-icon">
                  <Mail size={18} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="form-group">
                <Label htmlFor="password">Password</Label>
                <div className="input-with-icon">
                  <Lock size={18} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    data-testid="input-password"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="auth-button" data-testid="btn-signin">
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              <div className="auth-footer">
                <span>Don't have an account?</span>
                <Link to="/signup" data-testid="link-signup">Sign Up</Link>
              </div>

              <div className="admin-shortcut">
                <Link to="/admin-login" className="admin-link">
                  <ShieldCheck size={14} className="inline mr-1" />
                  Administrator Portal
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }

        .auth-container {
          width: 100%;
          max-width: 480px;
        }

        .auth-card {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          border-radius: 16px;
          overflow: hidden;
        }

        .auth-header {
          text-align: center;
          padding: 2rem 2rem 1rem;
        }

        .auth-icon {
          width: 72px;
          height: 72px;
          margin: 0 auto 1.25rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.35);
        }

        .auth-header h3 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
          color: #1a1a2e;
        }

        .auth-header p {
          color: #6b7280;
          font-size: 0.95rem;
        }

        .guest-hero-box {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 12px;
          margin: 0 1rem 1.5rem;
          box-shadow: 0 6px 20px rgba(49, 46, 129, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.15);
          text-align: center;
        }

        .guest-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(255, 255, 255, 0.12);
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #fef3c7;
          margin-bottom: 0.75rem;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .guest-hero-box h4 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.4rem;
          color: #ffffff;
        }

        .guest-hero-box p {
          font-size: 0.85rem;
          color: #c7d2fe;
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .guest-action-btn {
          width: 100%;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          font-weight: 600;
          font-size: 1rem;
          padding: 0.85rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.2s ease;
        }

        .guest-action-btn:hover {
          background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
        }

        .auth-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 1.5rem 1rem 1.25rem;
          color: #9ca3af;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e5e7eb;
        }

        .auth-divider span {
          padding: 0 0.75rem;
        }

        .auth-form {
          padding: 0 1rem 1rem;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-with-icon svg {
          position: absolute;
          left: 12px;
          color: #6b7280;
        }

        .input-with-icon input {
          padding-left: 40px;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #dc2626;
          margin-bottom: 1.25rem;
          font-size: 0.9rem;
        }

        .auth-button {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 0.85rem;
          font-size: 1rem;
          font-weight: 600;
          margin-top: 0.5rem;
        }

        .auth-footer {
          text-align: center;
          margin-top: 1.25rem;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .auth-footer a {
          color: #667eea;
          font-weight: 600;
          text-decoration: none;
          margin-left: 0.5rem;
        }

        .auth-footer a:hover {
          text-decoration: underline;
        }

        .admin-shortcut {
          text-align: center;
          margin-top: 1rem;
          padding-top: 0.75rem;
          border-top: 1px dashed #e5e7eb;
        }

        .admin-link {
          font-size: 0.8rem;
          color: #6b7280;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }

        .admin-link:hover {
          color: #4b5563;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default Signin;
