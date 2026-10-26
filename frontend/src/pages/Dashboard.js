import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Brain, Target, Users, TrendingUp, BookOpen, BarChart3, Sparkles, UserCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const modules = [
    {
      name: "MARGADARSHAK",
      title: "AI Career Path Generator",
      icon: Brain,
      color: "#764ba2",
      path: "/margadarshak"
    },
    {
      name: "SAMARTHYA",
      title: "Skills-to-Jobs Mapping",
      icon: Target,
      color: "#f093fb",
      path: "/samarthya"
    },
    {
      name: "UNNATI",
      title: "Progress Tracker",
      icon: TrendingUp,
      color: "#43e97b",
      path: "/unnati"
    },
    {
      name: "SAHYOG",
      title: "Community Support",
      icon: Users,
      color: "#4facfe",
      path: "/sahyog"
    },
    {
      name: "JIGYASA",
      title: "Explore Careers",
      icon: BookOpen,
      color: "#667eea",
      path: "/jigyasa"
    },
    {
      name: "DRISHTIKON",
      title: "Insights Dashboard",
      icon: BarChart3,
      color: "#00f2fe",
      path: "/drishtikon"
    }
  ];

  return (
    <div className="dashboard-page" data-testid="dashboard-page">
      <div className="dashboard-header">
        <div className="container">
          <div className="header-badge-row">
            {user?.is_guest && (
              <span className="demo-header-badge" data-testid="dashboard-demo-badge">
                <Sparkles size={16} /> Guest Demo Mode
              </span>
            )}
          </div>
          <h1 className="welcome-title" data-testid="welcome-message">
            Welcome back, {user?.name || "Student"}! 🚀
          </h1>
          <p className="welcome-subtitle">
            {user?.is_guest 
              ? "Exploring Sankalp in Guest Mode. Test all modules freely!"
              : "Continue your career journey with Sankalp"}
          </p>
        </div>
      </div>

      <div className="container dashboard-content">
        {user?.is_guest && (
          <div className="demo-hero-banner" data-testid="demo-hero-banner">
            <div className="demo-banner-content">
              <div className="demo-banner-header">
                <div className="demo-icon-box">
                  <UserCheck size={28} color="#4f46e5" />
                </div>
                <div>
                  <h3 className="demo-banner-title">Guest Demo Mode</h3>
                  <p className="demo-banner-text">
                    You are exploring Sankalp as a Guest User. You can test career path generation, skill mapping, and progress tracking across all modules.
                  </p>
                </div>
              </div>
              <div className="demo-banner-chips">
                <span className="demo-chip">Target: Data Science & AI</span>
                <span className="demo-chip">Interactive Sandbox</span>
                <span className="demo-chip">Full 6 Modules Access</span>
              </div>
            </div>
            <div className="demo-banner-actions">
              <Button 
                onClick={() => navigate('/signup')}
                className="demo-signup-cta"
                data-testid="btn-demo-banner-signup"
              >
                Create Account to Save Progress <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        <div className="modules-grid">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Card 
                key={index} 
                className="module-card"
                onClick={() => navigate(module.path)}
                data-testid={`dashboard-module-${module.name.toLowerCase()}`}
              >
                <CardContent className="module-content">
                  <div className="module-icon" style={{ background: `${module.color}15` }}>
                    <Icon size={32} color={module.color} />
                  </div>
                  <h3 className="module-name">{module.name}</h3>
                  <p className="module-title">{module.title}</p>
                  <Button 
                    style={{ background: module.color }}
                    className="module-button"
                  >
                    Open
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .dashboard-page {
          min-height: 100vh;
          background: #f8fafc;
        }

        .dashboard-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 3rem 2rem;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .header-badge-row {
          margin-bottom: 0.75rem;
        }

        .demo-header-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          color: white;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.35);
        }

        .welcome-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .welcome-subtitle {
          font-size: 1.125rem;
          opacity: 0.95;
        }

        .dashboard-content {
          padding: 2.5rem 2rem 4rem;
        }

        .demo-hero-banner {
          background: white;
          border-radius: 16px;
          padding: 1.75rem 2rem;
          margin-bottom: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          border: 1px solid #e0e7ff;
          box-shadow: 0 8px 30px rgba(99, 102, 241, 0.08);
          flex-wrap: wrap;
        }

        .demo-banner-content {
          flex: 1;
          min-width: 280px;
        }

        .demo-banner-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .demo-icon-box {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          background: #eef2ff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .demo-banner-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e1b4b;
          margin-bottom: 0.25rem;
        }

        .demo-banner-text {
          font-size: 0.95rem;
          color: #4b5563;
        }

        .demo-banner-chips {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: 0.75rem;
        }

        .demo-chip {
          background: #f1f5f9;
          color: #334155;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.25rem 0.65rem;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .demo-signup-cta {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          font-weight: 600;
          padding: 0.85rem 1.5rem;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
          transition: all 0.2s ease;
        }

        .demo-signup-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
        }

        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .module-card {
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: 1px solid #e8ecf1;
          border-radius: 14px;
        }

        .module-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
        }

        .module-content {
          padding: 2rem;
          text-align: center;
        }

        .module-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .module-name {
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .module-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: #1a1a2e;
        }

        .module-button {
          width: 100%;
          color: white;
          border: none;
          padding: 0.75rem;
          font-weight: 600;
          border-radius: 8px;
        }

        @media (max-width: 768px) {
          .welcome-title {
            font-size: 1.75rem;
          }

          .demo-hero-banner {
            flex-direction: column;
            align-items: flex-start;
          }

          .modules-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
