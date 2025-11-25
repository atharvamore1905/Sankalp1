import { useState, useEffect } from "react";
import axios from "axios";
import { Target, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Samarthya = () => {
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const res = await axios.get(`${API}/jigyasa/skills`);
      setAvailableSkills(res.data.skills || []);
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };

  const addSkill = (skill) => {
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const handleMatch = async () => {
    if (selectedSkills.length === 0) return;
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/samarthya/match`, selectedSkills);
      setMatches(res.data.matches || []);
    } catch (error) {
      console.error("Error matching skills:", error);
    }
    setLoading(false);
  };

  return (
    <div className="samarthya-page" data-testid="samarthya-page">
      <div className="page-header">
        <div className="container">
          <Target size={48} />
          <h1 className="page-title" data-testid="page-title">SAMARTHYA</h1>
          <p className="page-subtitle">Skills-to-Jobs Mapping</p>
        </div>
      </div>

      <div className="container">
        <div className="content-grid">
          <Card className="skills-card">
            <CardContent className="card-content">
              <h2>Your Skills</h2>
              <p className="subtitle">Add skills you already have</p>
              
              <div className="skill-input-section">
                <Select onValueChange={addSkill} value={newSkill}>
                  <SelectTrigger data-testid="skill-select">
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSkills.map((skill) => (
                      <SelectItem key={skill.skill_id} value={skill.skill_name}>
                        {skill.skill_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="or-divider">OR</div>
                <div className="custom-input">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Type custom skill..."
                    data-testid="custom-skill-input"
                  />
                  <Button onClick={() => addSkill(newSkill)} data-testid="btn-add-skill">
                    <Plus size={20} />
                  </Button>
                </div>
              </div>

              <div className="selected-skills">
                {selectedSkills.length === 0 ? (
                  <div className="empty-state">No skills added yet</div>
                ) : (
                  selectedSkills.map((skill, idx) => (
                    <div key={idx} className="skill-chip" data-testid={`skill-chip-${idx}`}>
                      <span>{skill}</span>
                      <button onClick={() => removeSkill(skill)} data-testid={`remove-skill-${idx}`}>
                        <X size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <Button 
                onClick={handleMatch} 
                disabled={loading || selectedSkills.length === 0}
                className="match-btn"
                data-testid="btn-match"
              >
                {loading ? 'Matching...' : 'Find Matching Jobs'}
              </Button>
            </CardContent>
          </Card>

          <div className="matches-section">
            <h2>Job Matches</h2>
            {matches.length === 0 ? (
              <Card>
                <CardContent className="empty-matches">
                  <Target size={48} />
                  <p>Add your skills and click "Find Matching Jobs" to see opportunities!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="matches-list">
                {matches.map((match, idx) => (
                  <Card key={idx} className="match-card" data-testid={`match-card-${idx}`}>
                    <CardContent>
                      <div className="match-header">
                        <h3>{match.job.job_title}</h3>
                        <div className="match-percentage">
                          {match.match_percentage}%
                        </div>
                      </div>
                      <p className="job-category">{match.job.category}</p>
                      <div className="match-details">
                        <div className="detail-item">
                          <span className="label">Salary:</span>
                          <span className="value">₹{(match.job.avg_salary / 100000).toFixed(1)}L/year</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Demand:</span>
                          <span className={`value demand ${match.job.demand_level?.toLowerCase()}`}>
                            {match.job.demand_level}
                          </span>
                        </div>
                      </div>
                      
                      <div className="skills-section">
                        <h4>Matching Skills ({match.matching_skills.length})</h4>
                        <div className="skills-list">
                          {match.matching_skills.map((skill, sidx) => (
                            <span key={sidx} className="badge badge-success">{skill}</span>
                          ))}
                        </div>
                      </div>

                      {match.missing_skills.length > 0 && (
                        <div className="skills-section">
                          <h4>Skills Gap ({match.skill_gap_count})</h4>
                          <div className="skills-list">
                            {match.missing_skills.map((skill, sidx) => (
                              <span key={sidx} className="badge badge-warning">{skill}</span>
                            ))}
                          </div>
                          <p className="gap-note">Learn these skills to improve your match!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .samarthya-page {
          min-height: 100vh;
          padding-bottom: 3rem;
        }

        .page-header {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 3rem 2rem;
          text-align: center;
        }

        .page-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem;
        }

        .page-subtitle {
          font-size: 1.125rem;
          opacity: 0.9;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
        }

        .skills-card {
          position: sticky;
          top: 100px;
          height: fit-content;
        }

        .card-content {
          padding: 2rem;
        }

        .card-content h2 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          color: #6b7280;
          margin-bottom: 1.5rem;
        }

        .skill-input-section {
          margin-bottom: 1.5rem;
        }

        .or-divider {
          text-align: center;
          margin: 1rem 0;
          color: #6b7280;
          font-weight: 600;
        }

        .custom-input {
          display: flex;
          gap: 0.5rem;
        }

        .selected-skills {
          min-height: 150px;
          padding: 1rem;
          background: #f5f7fa;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-content: flex-start;
        }

        .empty-state {
          width: 100%;
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }

        .skill-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          border: 2px solid #667eea;
          border-radius: 50px;
          color: #667eea;
          font-weight: 600;
        }

        .skill-chip button {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: #667eea;
          transition: color 0.2s;
        }

        .skill-chip button:hover {
          color: #f5576c;
        }

        .match-btn {
          width: 100%;
        }

        .matches-section h2 {
          font-size: 1.75rem;
          margin-bottom: 1.5rem;
        }

        .empty-matches {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .matches-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .match-card {
          border-left: 4px solid #f093fb;
        }

        .match-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .match-header h3 {
          font-size: 1.25rem;
          color: #1a1a2e;
        }

        .match-percentage {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-weight: 700;
        }

        .job-category {
          color: #6b7280;
          margin-bottom: 1rem;
        }

        .match-details {
          display: flex;
          gap: 2rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f5f7fa;
          border-radius: 8px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-item .label {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .detail-item .value {
          font-weight: 700;
          color: #1a1a2e;
        }

        .demand.high {
          color: #10b981;
        }

        .skills-section {
          margin-top: 1.5rem;
        }

        .skills-section h4 {
          font-size: 1rem;
          margin-bottom: 0.75rem;
          color: #667eea;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .gap-note {
          margin-top: 0.75rem;
          font-size: 0.875rem;
          color: #6b7280;
          font-style: italic;
        }

        @media (max-width: 968px) {
          .content-grid {
            grid-template-columns: 1fr;
          }

          .skills-card {
            position: relative;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Samarthya;