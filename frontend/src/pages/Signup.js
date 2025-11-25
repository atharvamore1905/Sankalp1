import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, Phone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_no: '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!formData.phone_no.match(/^[0-9]+$/)) {
      setError('Phone number must be numeric');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      await signup(formData.name, formData.email, formData.phone_no, formData.password, formData.confirm_password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page" data-testid="signup-page">
      <div className="auth-container">
        <Card className="auth-card">
          <CardHeader className="auth-header">
            <div className="auth-icon">
              <UserPlus size={40} />
            </div>
            <CardTitle>Create Your Account</CardTitle>
            <p>Join Sankalp and start your career journey</p>
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
                <Label htmlFor="name">Full Name</Label>
                <div className="input-with-icon">
                  <User size={18} />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="input-name"
                  />
                </div>
              </div>

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
                <Label htmlFor="phone">Phone Number</Label>
                <div className="input-with-icon">
                  <Phone size={18} />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="1234567890"
                    value={formData.phone_no}
                    onChange={(e) => setFormData({ ...formData, phone_no: e.target.value })}
                    required
                    data-testid="input-phone"
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

              <div className="form-group">
                <Label htmlFor="confirm_password">Confirm Password</Label>
                <div className="input-with-icon">
                  <Lock size={18} />
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    required
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="auth-button" data-testid="btn-signup">
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>

              <div className="auth-footer">
                <span>Already have an account?</span>
                <Link to="/signin" data-testid="link-signin">Sign In</Link>
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
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
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
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
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
          padding: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #dc2626;
          margin-bottom: 1.5rem;
        }

        .auth-button {
          width: 100%;
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
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

export default Signup;