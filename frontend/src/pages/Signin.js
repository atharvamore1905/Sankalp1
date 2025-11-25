import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Signin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
          max-width: 450px;
        }

        .auth-card {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .auth-header {
          text-align: center;
          padding: 2rem;
        }

        .auth-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .auth-header h3 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
          color: #1a1a2e;
        }

        .auth-header p {
          color: #6b7280;
        }

        .auth-form {
          padding: 0 1rem 1rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
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
          padding: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #dc2626;
          margin-bottom: 1.5rem;
        }

        .auth-button {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1rem;
          font-size: 1rem;
          margin-top: 0.5rem;
        }

        .auth-footer {
          text-align: center;
          margin-top: 1.5rem;
          color: #6b7280;
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
      `}</style>
    </div>
  );
};

export default Signin;