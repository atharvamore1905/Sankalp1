import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ExternalLink, MapPin, Clock, DollarSign, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const CollegeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollege();
  }, [id]);

  const fetchCollege = async () => {
    try {
      const res = await axios.get(`${API}/jigyasa/colleges/${id}`);
      setCollege(res.data);
    } catch (error) {
      console.error("Error fetching college:", error);
    }
    setLoading(false);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!college) return <div className="error">College not found</div>;

  return (
    <div className="detail-page" data-testid="college-detail-page">
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
          <h1 className="detail-title" data-testid="college-title">{college.course_name}</h1>
          <p className="detail-subtitle">{college.institution}</p>
          <div className="rating">
            <Star size={20} fill="#fbbf24" color="#fbbf24" />
            <span>{college.rating}</span>
          </div>
        </div>
      </div>

      <div className="container detail-content">
        <div className="detail-grid">
          <div className="detail-main">
            <div className="detail-card">
              <h2>About This Course</h2>
              <p>{college.description}</p>
            </div>

            <div className="detail-card">
              <h2>Skills Covered</h2>
              <div className="skills-list">
                {college.skills_covered?.map((skill, idx) => (
                  <span key={idx} className="badge badge-primary" data-testid={`skill-badge-${idx}`}>{skill}</span>
                ))}
              </div>
            </div>

            <div className="detail-card">
              <h2>Career Roles</h2>
              <div className="skills-list">
                {college.career_roles?.map((role, idx) => (
                  <span key={idx} className="badge badge-success" data-testid={`role-badge-${idx}`}>{role}</span>
                ))}
              </div>
            </div>

            {college.link && (
              <div className="detail-card">
                <a href={college.link} target="_blank" rel="noopener noreferrer" className="external-link" data-testid="external-link">
                  <ExternalLink size={20} />
                  Visit Official Website
                </a>
              </div>
            )}
          </div>

          <div className="detail-sidebar">
            <div className="detail-card">
              <h3>Quick Info</h3>
              <div className="info-item">
                <Clock size={18} />
                <div>
                  <span className="label">Duration</span>
                  <span className="value">{college.duration}</span>
                </div>
              </div>
              <div className="info-item">
                <DollarSign size={18} />
                <div>
                  <span className="label">Fees</span>
                  <span className="value">₹{college.fees?.toLocaleString()}</span>
                </div>
              </div>
              <div className="info-item">
                <MapPin size={18} />
                <div>
                  <span className="label">Mode</span>
                  <span className="value">{college.mode}</span>
                </div>
              </div>
              <div className="info-item">
                <div>
                  <span className="label">Type</span>
                  <span className="value">{college.type}</span>
                </div>
              </div>
              {college.city && (
                <div className="info-item">
                  <MapPin size={18} />
                  <div>
                    <span className="label">City</span>
                    <span className="value">{college.city}</span>
                  </div>
                </div>
              )}
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

        .rating {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
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

export default CollegeDetail;