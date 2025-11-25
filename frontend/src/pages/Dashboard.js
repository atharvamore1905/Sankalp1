import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Brain, Target, Users, TrendingUp, BookOpen, BarChart3 } from 'lucide-react';
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
          <h1 className="welcome-title" data-testid="welcome-message">
            Welcome back, {user?.name}! 🚀
          </h1>
          <p className="welcome-subtitle">Continue your career journey with Sankalp</p>
        </div>
      </div>

      <div className="container dashboard-content">
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
          background: #f5f7fa;
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

        .welcome-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .welcome-subtitle {
          font-size: 1.125rem;
          opacity: 0.9;
        }

        .dashboard-content {
          padding: 3rem 2rem;
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
        }

        .module-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
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
        }

        @media (max-width: 768px) {
          .welcome-title {
            font-size: 1.75rem;
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