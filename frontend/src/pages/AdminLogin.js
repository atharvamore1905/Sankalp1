import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAdminAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminLogin(formData.email, formData.password);
      navigate('/admin-dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid admin credentials');
    }
    setLoading(false);
  };

  return (
    <div className="admin-login-page" data-testid="admin-login-page">
      <div className="auth-container">
        <Card className="auth-card">
          <CardHeader className="auth-header">
            <div className="auth-icon admin-icon">
              <Shield size={40} />
            </div>
            <CardTitle>Admin Login</CardTitle>
            <p>Authorized personnel only</p>
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
                <Label htmlFor="email">Admin Email</Label>
                <div className="input-with-icon">
                  <Mail size={18} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@sankalp.ai"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="input-admin-email"
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
                    data-testid="input-admin-password"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="auth-button admin-button" data-testid="btn-admin-login">
                {loading ? 'Logging in...' : 'Admin Login'}
              </Button>

              <div className="auth-footer">
                <Link to="/" data-testid="link-home">Back to Home</Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        .admin-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          padding: 2rem;
        }

        .auth-container {
          width: 100%;
          max-width: 450px;
        }

        .auth-card {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .auth-header {
          text-align: center;
          padding: 2rem;
        }

        .admin-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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
          font-size: 0.875rem;
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

        .admin-button {
          width: 100%;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          padding: 1rem;
          font-size: 1rem;
          margin-top: 0.5rem;
        }

        .auth-footer {
          text-align: center;
          margin-top: 1.5rem;
        }

        .auth-footer a {
          color: #667eea;
          font-weight: 600;
          text-decoration: none;
        }

        .auth-footer a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;