import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Search, Filter, BookOpen, Briefcase, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Jigyasa = () => {
  const navigate = useNavigate();
  const [colleges, setColleges] = useState([]);
  const [skills, setSkills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("colleges");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "colleges") {
        const res = await axios.get(`${API}/jigyasa/colleges`);
        setColleges(res.data.colleges || []);
      } else if (activeTab === "skills") {
        const res = await axios.get(`${API}/jigyasa/skills`);
        setSkills(res.data.skills || []);
      } else if (activeTab === "jobs") {
        const res = await axios.get(`${API}/jigyasa/jobs`);
        setJobs(res.data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const filteredColleges = colleges.filter(c => 
    c.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.institution?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSkills = skills.filter(s => 
    s.skill_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJobs = jobs.filter(j => 
    j.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="jigyasa-page" data-testid="jigyasa-page">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title" data-testid="page-title">JIGYASA</h1>
          <p className="page-subtitle">Explore Careers, Colleges & Skills</p>
        </div>
      </div>

      <div className="container">
        <div className="search-section">
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <Input
              type="text"
              placeholder="Search colleges, skills, or jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              data-testid="search-input"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="tabs-container">
          <TabsList className="tabs-list" data-testid="jigyasa-tabs">
            <TabsTrigger value="colleges" data-testid="tab-colleges">
              <BookOpen size={18} />
              <span>Colleges & Courses</span>
            </TabsTrigger>
            <TabsTrigger value="skills" data-testid="tab-skills">
              <Award size={18} />
              <span>Skills</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" data-testid="tab-jobs">
              <Briefcase size={18} />
              <span>Jobs & Careers</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="colleges" data-testid="colleges-content">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <div className="card-grid">
                {filteredColleges.map((college) => (
                  <div 
                    key={college.course_id} 
                    className="info-card"
                    onClick={() => navigate(`/jigyasa/college/${college.course_id}`)}
                    data-testid={`college-card-${college.course_id}`}
                  >
                    <h3>{college.course_name}</h3>
                    <p className="institution">{college.institution}</p>
                    <div className="card-meta">
                      <span className="badge badge-primary">{college.type}</span>
                      <span className="badge badge-success">{college.mode}</span>
                    </div>
                    <div className="card-footer">
                      <span>Duration: {college.duration}</span>
                      <span>₹{college.fees?.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="skills" data-testid="skills-content">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <div className="card-grid">
                {filteredSkills.map((skill) => (
                  <div 
                    key={skill.skill_id} 
                    className="info-card"
                    onClick={() => navigate(`/jigyasa/skill/${skill.skill_id}`)}
                    data-testid={`skill-card-${skill.skill_id}`}
                  >
                    <h3>{skill.skill_name}</h3>
                    <p>{skill.description}</p>
                    <div className="card-meta">
                      <span className="badge badge-primary">{skill.category}</span>
                      <span className="badge badge-warning">{skill.difficulty_level}</span>
                    </div>
                    <div className="card-footer">
                      <span>Learning: {skill.avg_learning_duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="jobs" data-testid="jobs-content">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <div className="card-grid">
                {filteredJobs.map((job) => (
                  <div 
                    key={job.job_id} 
                    className="info-card"
                    onClick={() => navigate(`/jigyasa/job/${job.job_id}`)}
                    data-testid={`job-card-${job.job_id}`}
                  >
                    <h3>{job.job_title}</h3>
                    <p className="job-category">{job.category}</p>
                    <div className="card-meta">
                      <span className="badge badge-success">₹{(job.avg_salary / 100000).toFixed(1)}L</span>
                      <span className="badge badge-primary">{job.demand_level}</span>
                    </div>
                    <div className="card-footer">
                      <span>Cities: {job.city?.slice(0, 2).join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <style jsx>{`
        .jigyasa-page {
          min-height: 100vh;
          padding-bottom: 3rem;
        }

        .page-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 3rem 2rem;
          text-align: center;
        }

        .page-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .page-subtitle {
          font-size: 1.125rem;
          opacity: 0.9;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .search-section {
          margin: -2rem 0 2rem;
          position: relative;
          z-index: 10;
        }

        .search-box {
          background: white;
          border-radius: 50px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 0.5rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .search-icon {
          color: #667eea;
        }

        .tabs-container {
          margin-top: 2rem;
        }

        .tabs-list {
          background: white;
          padding: 0.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          display: flex;
          gap: 0.5rem;
        }

        .loading {
          text-align: center;
          padding: 3rem;
          font-size: 1.125rem;
          color: #6b7280;
        }

        .institution, .job-category {
          color: #6b7280;
          font-size: 0.875rem;
          margin: 0.5rem 0;
        }

        .card-footer {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e8ecf1;
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .card-meta {
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
};

export default Jigyasa;