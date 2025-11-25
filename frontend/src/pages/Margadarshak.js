import { useState } from "react";
import axios from "axios";
import { Brain, Send, Loader, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Margadarshak = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("form");
  const [formData, setFormData] = useState({
    marks_10th: "",
    marks_12th: "",
    gpa: "",
    backlogs: "",
    domain: "",
    budget: "",
    time_availability: "",
    future_goals: ""
  });
  const [recommendations, setRecommendations] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRecommendation = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/margadarshak/recommend`, {
        marks_10th: parseFloat(formData.marks_10th),
        marks_12th: parseFloat(formData.marks_12th),
        gpa: parseFloat(formData.gpa),
        backlogs: parseInt(formData.backlogs),
        domain: formData.domain,
        budget: parseFloat(formData.budget),
        time_availability: formData.time_availability,
        future_goals: formData.future_goals
      });
      setRecommendations(res.data);
      setActiveTab("results");
    } catch (error) {
      console.error("Error getting recommendations:", error);
    }
    setLoading(false);
  };

  const handleRoadmap = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/margadarshak/roadmap`, {
        marks_10th: parseFloat(formData.marks_10th),
        marks_12th: parseFloat(formData.marks_12th),
        gpa: parseFloat(formData.gpa),
        backlogs: parseInt(formData.backlogs),
        domain: formData.domain,
        budget: parseFloat(formData.budget),
        time_availability: formData.time_availability,
        future_goals: formData.future_goals
      });
      setRoadmap(res.data);
      setActiveTab("roadmap");
    } catch (error) {
      console.error("Error getting roadmap:", error);
    }
    setLoading(false);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = { role: "user", content: chatInput };
    setChatMessages([...chatMessages, userMessage]);
    setChatInput("");
    setChatLoading(true);
    
    try {
      const res = await axios.post(`${API}/margadarshak/chat`, {
        message: chatInput,
        session_id: sessionId
      });
      
      const aiMessage = { role: "assistant", content: res.data.response };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error in chat:", error);
      const errorMessage = { role: "assistant", content: "Sorry, I encountered an error. Please try again." };
      setChatMessages(prev => [...prev, errorMessage]);
    }
    setChatLoading(false);
  };

  return (
    <div className="margadarshak-page" data-testid="margadarshak-page">
      <div className="page-header">
        <div className="container">
          <Brain size={48} />
          <h1 className="page-title" data-testid="page-title">MARGADARSHAK</h1>
          <p className="page-subtitle">AI-Powered Career Path Generator</p>
        </div>
      </div>

      <div className="container">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="tabs-container">
          <TabsList className="tabs-list" data-testid="margadarshak-tabs">
            <TabsTrigger value="form" data-testid="tab-form">Career Form</TabsTrigger>
            <TabsTrigger value="chat" data-testid="tab-chat">AI Chat</TabsTrigger>
            <TabsTrigger value="results" disabled={!recommendations} data-testid="tab-results">Recommendations</TabsTrigger>
            <TabsTrigger value="roadmap" disabled={!roadmap} data-testid="tab-roadmap">Roadmap</TabsTrigger>
          </TabsList>

          <TabsContent value="form" data-testid="form-content">
            <Card>
              <CardContent className="form-content">
                <h2>Tell Us About Yourself</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <Label htmlFor="marks_10th">10th Marks (%)</Label>
                    <Input
                      id="marks_10th"
                      name="marks_10th"
                      type="number"
                      value={formData.marks_10th}
                      onChange={handleInputChange}
                      data-testid="input-marks-10th"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="marks_12th">12th Marks (%)</Label>
                    <Input
                      id="marks_12th"
                      name="marks_12th"
                      type="number"
                      value={formData.marks_12th}
                      onChange={handleInputChange}
                      data-testid="input-marks-12th"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="gpa">GPA / CGPA</Label>
                    <Input
                      id="gpa"
                      name="gpa"
                      type="number"
                      step="0.1"
                      value={formData.gpa}
                      onChange={handleInputChange}
                      data-testid="input-gpa"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="backlogs">Backlogs</Label>
                    <Input
                      id="backlogs"
                      name="backlogs"
                      type="number"
                      value={formData.backlogs}
                      onChange={handleInputChange}
                      data-testid="input-backlogs"
                    />
                  </div>
                  <div className="form-group full-width">
                    <Label htmlFor="domain">Preferred Domain</Label>
                    <Input
                      id="domain"
                      name="domain"
                      placeholder="e.g., Data Science, Web Development, AI"
                      value={formData.domain}
                      onChange={handleInputChange}
                      data-testid="input-domain"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="budget">Budget (₹)</Label>
                    <Input
                      id="budget"
                      name="budget"
                      type="number"
                      value={formData.budget}
                      onChange={handleInputChange}
                      data-testid="input-budget"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="time_availability">Time Available</Label>
                    <Input
                      id="time_availability"
                      name="time_availability"
                      placeholder="e.g., 6 months, 1 year"
                      value={formData.time_availability}
                      onChange={handleInputChange}
                      data-testid="input-time"
                    />
                  </div>
                  <div className="form-group full-width">
                    <Label htmlFor="future_goals">Future Goals</Label>
                    <Textarea
                      id="future_goals"
                      name="future_goals"
                      placeholder="Describe your career aspirations..."
                      value={formData.future_goals}
                      onChange={handleInputChange}
                      data-testid="input-goals"
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <Button onClick={handleRecommendation} disabled={loading} data-testid="btn-recommend">
                    {loading ? <Loader className="spin" /> : 'Get Recommendations'}
                  </Button>
                  <Button onClick={handleRoadmap} disabled={loading} variant="secondary" data-testid="btn-roadmap">
                    {loading ? <Loader className="spin" /> : 'Generate Roadmap'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" data-testid="chat-content">
            <Card className="chat-card">
              <CardContent className="chat-container">
                <div className="chat-messages" data-testid="chat-messages">
                  {chatMessages.length === 0 && (
                    <div className="chat-welcome">
                      <Brain size={48} />
                      <h3>Hi! I'm your AI Career Counselor</h3>
                      <p>Ask me anything about careers, skills, courses, or your future path!</p>
                    </div>
                  )}
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.role}`} data-testid={`chat-message-${idx}`}>
                      <div className="message-content">{msg.content}</div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="chat-message assistant">
                      <div className="message-content">Thinking...</div>
                    </div>
                  )}
                </div>
                <div className="chat-input-area">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                    placeholder="Ask me about careers..."
                    data-testid="chat-input"
                  />
                  <Button onClick={handleChat} disabled={chatLoading} data-testid="btn-send-chat">
                    <Send size={20} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" data-testid="results-content">
            {recommendations && (
              <div className="results-container">
                <h2>Top Career Recommendations</h2>
                <div className="recommendations-grid">
                  {recommendations.recommendations.map((rec, idx) => (
                    <Card key={idx} className="recommendation-card" data-testid={`recommendation-${idx}`}>
                      <CardContent>
                        <div className="match-score">{rec.match_percentage}% Match</div>
                        <h3>{rec.job.job_title}</h3>
                        <p className="category">{rec.job.category}</p>
                        <div className="job-info">
                          <span>₹{(rec.job.avg_salary / 100000).toFixed(1)}L/year</span>
                          <span className={`demand ${rec.job.demand_level?.toLowerCase()}`}>
                            {rec.job.demand_level} Demand
                          </span>
                        </div>
                        <div className="skills">
                          {rec.job.skills_required?.slice(0, 3).map((skill, sidx) => (
                            <span key={sidx} className="badge">{skill}</span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="roadmap" data-testid="roadmap-content">
            {roadmap && (
              <div className="roadmap-container">
                <h2>Career Roadmap: {roadmap.career}</h2>
                <p className="roadmap-duration">Total Duration: {roadmap.total_duration_months} months</p>
                <div className="roadmap-timeline">
                  {roadmap.levels.map((level, idx) => (
                    <div key={idx} className="timeline-item" data-testid={`roadmap-level-${idx}`}>
                      <h3>{level.level}</h3>
                      <p className="duration">{level.duration_weeks} weeks</p>
                      <div className="roadmap-section">
                        <h4>Skills to Learn</h4>
                        <div className="skills-list">
                          {level.skills.map((skill, sidx) => (
                            <span key={sidx} className="badge badge-primary">{skill}</span>
                          ))}
                        </div>
                      </div>
                      <div className="roadmap-section">
                        <h4>Courses</h4>
                        <ul>
                          {level.courses.map((course, cidx) => (
                            <li key={cidx}>{course}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="roadmap-section">
                        <h4>Projects</h4>
                        <ul>
                          {level.projects.map((project, pidx) => (
                            <li key={pidx}>{project}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <style jsx>{`
        .margadarshak-page {
          min-height: 100vh;
          padding-bottom: 3rem;
        }

        .page-header {
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
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
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .form-content {
          padding: 2rem;
        }

        .form-content h2 {
          margin-bottom: 2rem;
          font-size: 1.75rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
        }

        .chat-card {
          height: 600px;
        }

        .chat-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 0;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }

        .chat-welcome {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .chat-welcome h3 {
          margin: 1rem 0 0.5rem;
          color: #1a1a2e;
        }

        .chat-message {
          margin-bottom: 1rem;
          display: flex;
        }

        .chat-message.user {
          justify-content: flex-end;
        }

        .chat-message .message-content {
          max-width: 70%;
          padding: 1rem;
          border-radius: 12px;
          line-height: 1.6;
        }

        .chat-message.user .message-content {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .chat-message.assistant .message-content {
          background: #f5f7fa;
          color: #1a1a2e;
        }

        .chat-input-area {
          padding: 1.5rem;
          border-top: 1px solid #e8ecf1;
          display: flex;
          gap: 1rem;
        }

        .results-container, .roadmap-container {
          padding: 2rem;
        }

        .results-container h2, .roadmap-container h2 {
          font-size: 1.75rem;
          margin-bottom: 1.5rem;
        }

        .recommendations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .recommendation-card {
          position: relative;
        }

        .match-score {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-weight: 700;
          font-size: 0.875rem;
        }

        .recommendation-card h3 {
          margin-top: 2rem;
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .category {
          color: #6b7280;
          margin-bottom: 1rem;
        }

        .job-info {
          display: flex;
          justify-content: space-between;
          margin: 1rem 0;
          font-weight: 600;
        }

        .demand.high {
          color: #10b981;
        }

        .skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .roadmap-duration {
          color: #6b7280;
          margin-bottom: 2rem;
        }

        .roadmap-section {
          margin: 1.5rem 0;
        }

        .roadmap-section h4 {
          font-size: 1rem;
          margin-bottom: 0.75rem;
          color: #667eea;
        }

        .roadmap-section ul {
          list-style: none;
          padding: 0;
        }

        .roadmap-section li {
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
        }

        .roadmap-section li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #667eea;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default Margadarshak;