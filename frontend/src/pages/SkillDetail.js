import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ExternalLink, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const SkillDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkill();
  }, [id]);

  const fetchSkill = async () => {
    try {
      const res = await axios.get(`${API}/jigyasa/skills/${id}`);
      setSkill(res.data);
    } catch (error) {
      console.error("Error fetching skill:", error);
    }
    setLoading(false);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!skill) return <div className="error">Skill not found</div>;

  return (
    <div className="detail-page" data-testid="skill-detail-page">
      <div className="detail-header">
        <div className="container">
          <Button 
            onClick={() => navigate('/jigyasa')} 
            variant="ghost" 
            className="back-btn"
            data-testid="back-button"
          >
            <ArrowLeft size={20} />
            Back to Jigyasa
          </Button>
          <h1 className="detail-title" data-testid="skill-title">{skill.skill_name}</h1>
          <p className="detail-subtitle">{skill.category}</p>
          <span className={`difficulty-badge ${skill.difficulty_level?.toLowerCase()}`}>
            {skill.difficulty_level}
          </span>
        </div>
      </div>

      <div className="container detail-content">
        <div className="detail-grid">
          <div className="detail-main">
            <div className="detail-card">
              <h2>About This Skill</h2>
              <p>{skill.description}</p>
            </div>

            <div className="detail-card">
              <h2>Relevant Job Roles</h2>
              <div className="roles-list">
                {skill.relevant_roles?.map((role, idx) => (
                  <div key={idx} className="role-item" data-testid={`role-item-${idx}`}>
                    <BookOpen size={18} />
                    <span>{role}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-card">
              <h2>Related Tools</h2>
              <div className="skills-list">
                {skill.tools_related?.map((tool, idx) => (
                  <span key={idx} className="badge badge-primary" data-testid={`tool-badge-${idx}`}>{tool}</span>
                ))}
              </div>
            </div>

            {skill.source_links && skill.source_links.length > 0 && (
              <div className="detail-card">
                <h2>Learning Resources</h2>
                {skill.source_links.map((link, idx) => (
                  <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="external-link" data-testid={`resource-link-${idx}`}>
                    <ExternalLink size={20} />
                    Learn More
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="detail-sidebar">
            <div className="detail-card">
              <h3>Learning Path</h3>
              <div className="info-item">
                <Clock size={18} />
                <div>
                  <span className="label">Average Duration</span>
                  <span className="value">{skill.avg_learning_duration}</span>
                </div>
              </div>
              <div className="info-item">
                <div>
                  <span className="label">Certification</span>
                  <span className="value">{skill.certification_available ? 'Available' : 'Not Available'}</span>
                </div>
              </div>
              <div className="info-item">
                <div>
                  <span className="label">Difficulty</span>
                  <span className="value">{skill.difficulty_level}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .detail-page {
          min-height: 100vh;
          padding-bottom: 3rem;
        }

        .detail-header {
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
          color: white;
          padding: 3rem 2rem;
        }

        .back-btn {
          color: white;
          margin-bottom: 1rem;
        }

        .detail-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .detail-subtitle {
          font-size: 1.25rem;
          opacity: 0.9;
          margin-bottom: 1rem;
        }

        .difficulty-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .difficulty-badge.beginner {
          background: rgba(52, 211, 153, 0.2);
          color: white;
        }

        .difficulty-badge.intermediate {
          background: rgba(251, 191, 36, 0.2);
          color: white;
        }

        .difficulty-badge.advanced {
          background: rgba(239, 68, 68, 0.2);
          color: white;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .detail-content {
          margin-top: 2rem;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
        }

        .detail-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          margin-bottom: 1.5rem;
        }

        .detail-card h2 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #1a1a2e;
        }

        .detail-card h3 {
          font-size: 1.25rem;
          margin-bottom: 1.5rem;
          color: #1a1a2e;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .roles-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .role-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f5f7fa;
          border-radius: 8px;
        }

        .external-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border: 2px solid #667eea;
          border-radius: 8px;
          transition: all 0.3s ease;
          margin-bottom: 0.5rem;
        }

        .external-link:hover {
          background: #667eea;
          color: white;
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem 0;
          border-bottom: 1px solid #e8ecf1;
        }

        .info-item:last-child {
          border-bottom: none;
        }

        .info-item .label {
          display: block;
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .info-item .value {
          display: block;
          font-weight: 600;
          color: #1a1a2e;
        }

        .loading, .error {
          text-align: center;
          padding: 3rem;
          font-size: 1.125rem;
        }

        @media (max-width: 768px) {
          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SkillDetail;