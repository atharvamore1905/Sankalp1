import { useNavigate } from "react-router-dom";
import { BookOpen, Brain, Target, BarChart3, Users, TrendingUp, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const modules = [
    {
      name: "JIGYASA",
      title: "Explore Careers & Colleges",
      description: "Discover colleges, skills, jobs, certifications, and salary trends. Search, filter, and explore your future.",
      icon: BookOpen,
      color: "#667eea",
      path: "/jigyasa",
      public: true
    },
    {
      name: "DRISHTIKON",
      title: "Career Insights Dashboard",
      description: "View trending domains, salary insights, demand analysis, and emerging tech with interactive charts.",
      icon: BarChart3,
      color: "#4facfe",
      path: "/drishtikon",
      public: true
    },
    {
      name: "MARGADARSHAK",
      title: "AI Career Path Generator",
      description: "Get personalized career recommendations and 3-level roadmaps based on your academic profile and goals.",
      icon: Brain,
      color: "#764ba2",
      path: "/margadarshak",
      public: false
    },
    {
      name: "SAMARTHYA",
      title: "Skills-to-Jobs Mapping",
      description: "Match your skills with job opportunities. Identify skill gaps and get recommendations on what to learn next.",
      icon: Target,
      color: "#f093fb",
      path: "/samarthya",
      public: false
    },
    {
      name: "UNNATI",
      title: "Progress Tracker",
      description: "Track your roadmap progress, course completion, skills, projects, and achieve your custom goals with visual insights.",
      icon: TrendingUp,
      color: "#43e97b",
      path: "/unnati",
      public: false
    },
    {
      name: "SAHYOG",
      title: "Community Support",
      description: "Connect with peers, ask questions, share resources, and request mentorship in our supportive community.",
      icon: Users,
      color: "#00f2fe",
      path: "/sahyog",
      public: false
    }
  ];

  const handleModuleClick = (module) => {
    if (!module.public && !user) {
      navigate('/signin');
    } else {
      navigate(module.path);
    }
  };

  return (
    <div className="home-page" data-testid="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title" data-testid="hero-title">
            Sankalp
          </h1>
          <p className="hero-subtitle">AI Powered Career Ecosystem</p>
          <p className="hero-description">
            Your complete platform for career exploration, personalized guidance, skills mapping, insights, and community support.
          </p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/jigyasa')}
            data-testid="get-started-btn"
          >
            Get Started
          </button>
        </div>
      </div>

      <div className="modules-section">
        <div className="container">
          <h2 className="section-title" data-testid="modules-section-title">Explore Our Modules</h2>
          <p className="section-subtitle">Five powerful tools to shape your career journey</p>
          
          <div className="modules-grid">
            {modules.map((module, index) => {
              const Icon = module.icon;
              const isLocked = !module.public && !user;
              return (
                <div 
                  key={index} 
                  className={`module-card ${isLocked ? 'locked' : ''}`}
                  onClick={() => handleModuleClick(module)}
                  data-testid={`module-card-${module.name.toLowerCase()}`}
                  style={{ borderTop: `4px solid ${module.color}` }}
                >
                  {isLocked && (
                    <div className="lock-badge" data-testid={`lock-badge-${module.name.toLowerCase()}`}>
                      <Lock size={16} />
                      <span>Sign in required</span>
                    </div>
                  )}
                  <div className="module-icon" style={{ color: module.color }}>
                    <Icon size={48} />
                  </div>
                  <h3 className="module-name">{module.name}</h3>
                  <h4 className="module-title">{module.title}</h4>
                  <p className="module-description">{module.description}</p>
                  <button 
                    className="module-btn" 
                    style={{ background: module.color }}
                    data-testid={`explore-btn-${module.name.toLowerCase()}`}
                  >
                    {isLocked ? 'Sign In to Access' : 'Explore'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .home-page {
          min-height: 100vh;
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 700;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: 1.75rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          opacity: 0.95;
        }

        .hero-description {
          font-size: 1.125rem;
          max-width: 700px;
          margin: 0 auto 2.5rem;
          opacity: 0.9;
          line-height: 1.8;
        }

        .modules-section {
          padding: 5rem 2rem;
          background: white;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .section-title {
          font-size: 2.5rem;
          text-align: center;
          margin-bottom: 0.5rem;
          color: #1a1a2e;
        }

        .section-subtitle {
          text-align: center;
          font-size: 1.125rem;
          color: #6b7280;
          margin-bottom: 3rem;
        }

        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .module-icon {
          margin-bottom: 1.5rem;
        }

        .module-name {
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .module-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #1a1a2e;
        }

        .module-description {
          color: #6b7280;
          margin-bottom: 1.5rem;
          line-height: 1.7;
        }

        .module-btn {
          color: white;
          padding: 0.75rem 1.75rem;
          border: none;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          width: 100%;
        }

        .module-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }

          .hero-subtitle {
            font-size: 1.25rem;
          }

          .section-title {
            font-size: 2rem;
          }

          .modules-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;