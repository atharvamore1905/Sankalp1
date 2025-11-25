import { useNavigate } from "react-router-dom";
import { BookOpen, Brain, Target, BarChart3, Users, TrendingUp, Lock, Zap, Award, Shield, Rocket, CheckCircle2, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: Brain,
      title: "Personalized AI Career Guidance",
      description: "Get tailored career recommendations powered by advanced AI algorithms based on your unique profile and goals."
    },
    {
      icon: TrendingUp,
      title: "Roadmap-Based Skill Building",
      description: "Follow structured learning paths from beginner to advanced levels with clear milestones and achievable goals."
    },
    {
      icon: BarChart3,
      title: "Real-Time Market Insights",
      description: "Access live data on trending skills, salary insights, job demand, and emerging technologies in the market."
    },
    {
      icon: Award,
      title: "Verified College & Certification Data",
      description: "Explore curated information on top colleges, courses, and certifications with authentic ratings and reviews."
    },
    {
      icon: Target,
      title: "Skill-to-Job Matching",
      description: "Match your current skillset with job opportunities and identify gaps to accelerate your career growth."
    },
    {
      icon: Users,
      title: "Community Support + Progress Tracking",
      description: "Connect with peers, track your learning progress, and get mentorship to stay motivated throughout your journey."
    }
  ];

  const highlights = [
    { icon: Rocket, value: "6", label: "Powerful Modules" },
    { icon: Brain, value: "AI", label: "Powered Roadmaps" },
    { icon: TrendingUp, value: "Live", label: "Progress Tracking" },
    { icon: BarChart3, value: "Real-time", label: "Industry Trends" },
    { icon: Shield, value: "100%", label: "Secure Accounts" }
  ];

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
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-logo">
            <img src="/logo.png" alt="Sankalp Logo" />
          </div>
          <h1 className="hero-title" data-testid="hero-title">
            Sankalp
          </h1>
          <p className="hero-tagline">Your AI-Powered Career Growth Partner</p>
          <p className="hero-description">
            Navigate your career with confidence using AI-driven insights, personalized roadmaps, and real-time market intelligence.
          </p>
          <div className="hero-buttons">
            <button 
              className="btn-primary" 
              onClick={() => user ? navigate('/dashboard') : navigate('/signup')}
              data-testid="get-started-btn"
            >
              {user ? 'Go to Dashboard' : 'Get Started Free'}
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => navigate('/jigyasa')}
              data-testid="explore-btn"
            >
              Explore Careers
            </button>
          </div>
        </div>
      </div>

      {/* Why Choose Sankalp */}
      <div className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose Sankalp?</h2>
          <p className="section-subtitle">Empowering your career journey with cutting-edge technology</p>
          <div className="features-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="feature-card" data-testid={`feature-${index}`}>
                  <div className="feature-icon">
                    <Icon size={32} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="mission-vision-section">
        <div className="container">
          <div className="mv-grid">
            <div className="mv-card mission-card">
              <div className="mv-icon">
                <Target size={48} />
              </div>
              <h2>Our Mission</h2>
              <p>
                To make career guidance accessible, structured, and data-driven for every student and professional in India. 
                We believe that with the right tools and insights, anyone can achieve their career aspirations and unlock their true potential.
              </p>
            </div>
            <div className="mv-card vision-card">
              <div className="mv-icon">
                <Globe size={48} />
              </div>
              <h2>Our Vision</h2>
              <p>
                To empower individuals with AI-powered tools that simplify decision-making, accelerate growth, and unlock opportunities. 
                We envision a future where every career decision is informed, every skill is trackable, and every goal is achievable.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Highlights Section */}
      <div className="highlights-section">
        <div className="container">
          <h2 className="section-title">Sankalp at a Glance</h2>
          <div className="highlights-grid">
            {highlights.map((highlight, index) => {
              const Icon = highlight.icon;
              return (
                <div key={index} className="highlight-card" data-testid={`highlight-${index}`}>
                  <div className="highlight-icon">
                    <Icon size={40} />
                  </div>
                  <h3>{highlight.value}</h3>
                  <p>{highlight.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div className="modules-section">
        <div className="container">
          <h2 className="section-title" data-testid="modules-section-title">Explore Our Modules</h2>
          <p className="section-subtitle">Six powerful tools to shape your career journey</p>
          
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
          background: #f5f7fa;
        }

        .hero-logo {
          width: 120px;
          height: 120px;
          margin: 0 auto 2rem;
          background: white;
          border-radius: 20px;
          padding: 1rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .hero-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 700;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
        }

        .hero-tagline {
          font-size: clamp(1.25rem, 3vw, 1.875rem);
          font-weight: 600;
          margin-bottom: 1.5rem;
          opacity: 0.95;
          color: white;
        }

        .hero-description {
          font-size: clamp(1rem, 2vw, 1.125rem);
          max-width: 700px;
          margin: 0 auto 2.5rem;
          opacity: 0.9;
          line-height: 1.8;
        }

        .hero-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .features-section {
          padding: clamp(3rem, 8vw, 5rem) clamp(1rem, 3vw, 2rem);
          background: white;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .feature-card {
          background: #f5f7fa;
          padding: 2rem;
          border-radius: 16px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: 1px solid #e8ecf1;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15);
        }

        .feature-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: 1.5rem;
        }

        .feature-card h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #1a1a2e;
        }

        .feature-card p {
          color: #6b7280;
          line-height: 1.7;
        }

        .mission-vision-section {
          padding: clamp(3rem, 8vw, 5rem) clamp(1rem, 3vw, 2rem);
          background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
        }

        .mv-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .mv-card {
          background: white;
          padding: 3rem;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          text-align: center;
        }

        .mv-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .mv-card h2 {
          font-size: 1.75rem;
          margin-bottom: 1.5rem;
          color: #1a1a2e;
        }

        .mv-card p {
          color: #4a5568;
          line-height: 1.8;
          font-size: 1rem;
        }

        .highlights-section {
          padding: clamp(3rem, 8vw, 5rem) clamp(1rem, 3vw, 2rem);
          background: white;
        }

        .highlights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .highlight-card {
          text-align: center;
          padding: 2rem;
          background: #f5f7fa;
          border-radius: 16px;
          transition: transform 0.3s ease;
        }

        .highlight-card:hover {
          transform: scale(1.05);
        }

        .highlight-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .highlight-card h3 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #667eea;
        }

        .highlight-card p {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .modules-section {
          padding: clamp(3rem, 8vw, 5rem) clamp(1rem, 3vw, 2rem);
          background: #f5f7fa;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .section-title {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          text-align: center;
          margin-bottom: 0.5rem;
          color: #1a1a2e;
        }

        .section-subtitle {
          text-align: center;
          font-size: clamp(1rem, 2vw, 1.125rem);
          color: #6b7280;
          margin-bottom: 3rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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

        .module-card.locked {
          position: relative;
          opacity: 0.9;
        }

        .lock-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 50px;
          color: #dc2626;
          font-size: 0.75rem;
          font-weight: 600;
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