import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, MapPin, DollarSign, Clock, TrendingUp, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const res = await axios.get(`${API}/jigyasa/jobs/${id}`);
      setJob(res.data);
    } catch (error) {
      console.error("Error fetching job:", error);
    }
    setLoading(false);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!job) return <div className="error">Job not found</div>;

  return (
    <div className="detail-page" data-testid="job-detail-page">
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
          <h1 className="detail-title" data-testid="job-title">{job.job_title}</h1>
          <p className="detail-subtitle">{job.category}</p>
          <div className="job-badges">
            <span className={`demand-badge ${job.demand_level?.toLowerCase()}`}>
              <TrendingUp size={16} />
              {job.demand_level} Demand
            </span>
          </div>
        </div>
      </div>

      <div className="container detail-content">
        <div className="detail-grid">
          <div className="detail-main">
            <div className="detail-card">
              <h2>Career Path</h2>
              <p className="career-path">{job.career_path_summary}</p>
            </div>

            <div className="detail-card">
              <h2>Entry Requirements</h2>
              <p>{job.entry_requirements}</p>
            </div>

            <div className="detail-card">
              <h2>Skills Required</h2>
              <div className="skills-list">
                {job.skills_required?.map((skill, idx) => (
                  <span key={idx} className="badge badge-primary" data-testid={`skill-badge-${idx}`}>{skill}</span>
                ))}
              </div>
            </div>

            <div className="detail-card">
              <h2>Top Companies Hiring</h2>
              <div className="companies-list">
                {job.top_companies?.map((company, idx) => (
                  <div key={idx} className="company-item" data-testid={`company-item-${idx}`}>
                    <Building size={18} />
                    <span>{company}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="detail-sidebar">
            <div className="detail-card">
              <h3>Job Overview</h3>
              <div className="info-item">
                <DollarSign size={18} />
                <div>
                  <span className="label">Average Salary</span>
                  <span className="value">₹{(job.avg_salary / 100000).toFixed(1)}L / year</span>
                </div>
              </div>
              <div className="info-item">
                <Clock size={18} />
                <div>
                  <span className="label">Time to Employable</span>
                  <span className="value">{job.duration_to_employable}</span>
                </div>
              </div>
              <div className="info-item">
                <MapPin size={18} />
                <div>
                  <span className="label">Available in Cities</span>
                  <span className="value">{job.city?.join(', ')}</span>
                </div>
              </div>
              <div className="info-item">
                <TrendingUp size={18} />
                <div>
                  <span className="label">Demand Level</span>
                  <span className="value">{job.demand_level}</span>
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
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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

        .job-badges {
          display: flex;
          gap: 0.5rem;
        }

        .demand-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.875rem;
          background: rgba(255, 255, 255, 0.2);
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

        .career-path {
          padding: 1rem;
          background: #f5f7fa;
          border-radius: 8px;
          border-left: 4px solid #667eea;
          font-weight: 500;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .companies-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .company-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f5f7fa;
          border-radius: 8px;
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

export default JobDetail;