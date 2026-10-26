import { useState } from "react";
import axios from "axios";
import { Brain, Send, Loader, Download, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
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

  const handleFillDemoData = () => {
    setFormData({
      marks_10th: "88",
      marks_12th: "84",
      gpa: "8.2",
      backlogs: "0",
      domain: "Data Science & Machine Learning",
      budget: "50000",
      time_availability: "6 months",
      future_goals: "Aspiring AI/ML Engineer aiming to build real-world intelligent systems and scalable pipelines."
    });
    toast.success("Loaded Aarav Sharma's sample academic profile!");
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
      toast.error("Failed to generate recommendations. Please check inputs.");
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
      toast.error("Failed to generate roadmap. Please check inputs.");
    }
    setLoading(false);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput("");
    setChatLoading(true);
    
    try {
      const res = await axios.post(
        `${API}/margadarshak/chat`,
        {
          message: currentInput,
          session_id: sessionId
        },
        { withCredentials: true }
      );
      
      const aiMessage = { 
        role: "assistant", 
        content: res.data.response,
        provider: res.data.provider,
        limit_reached: res.data.limit_reached
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error in chat:", error);
      const errorMessage = { role: "assistant", content: "Sorry, I encountered an error. Please try again." };
      setChatMessages(prev => [...prev, errorMessage]);
    }
    setChatLoading(false);
  };

  const handleImportToUnnati = async () => {
    if (!roadmap || !user) return;
    
    setImporting(true);
    try {
      const res = await axios.post(
        `${API}/unnati/${user.id}/import-roadmap`,
        { roadmap },
        { withCredentials: true }
      );
      toast.success(`Successfully imported ${res.data.count} items to UNNATI!`);
    } catch (error) {
      console.error("Error importing roadmap:", error);
      toast.error("Failed to import roadmap. Please try again.");
    }
    setImporting(false);
  };

  return (
    <div className="margadarshak-page" data-testid="margadarshak-page">
      <div className="page-header">
        <div className="container">
          <Brain size={48} />
          <h1 className="page-title" data-testid="page-title">MARGADARSHAK</h1>
          <p className="page-subtitle">AI-Powered Career Path Generator & Counselor</p>
        </div>
      </div>

      <div className="container">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="tabs-container">
          <TabsList className="tabs-list" data-testid="margadarshak-tabs">
            <TabsTrigger value="form" data-testid="tab-form">Career Form</TabsTrigger>
            <TabsTrigger value="chat" data-testid="tab-chat">AI Counselor</TabsTrigger>
            <TabsTrigger value="results" disabled={!recommendations} data-testid="tab-results">Recommendations</TabsTrigger>
            <TabsTrigger value="roadmap" disabled={!roadmap} data-testid="tab-roadmap">Roadmap</TabsTrigger>
          </TabsList>

          <TabsContent value="form" data-testid="form-content">
            <Card>
              <CardContent className="form-content">
                <div className="form-top-row">
                  <div>
                    <h2>Tell Us About Yourself</h2>
                    <p className="subtitle">Enter your academic marks and career preferences for deterministic scoring</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFillDemoData}
                    className="demo-fill-btn"
                    data-testid="btn-fill-demo-data"
                  >
                    <Sparkles size={16} /> Fill Demo Profile (Aarav Sharma)
                  </Button>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <Label htmlFor="marks_10th">10th Marks (%)</Label>
                    <Input
                      id="marks_10th"
                      name="marks_10th"
                      type="number"
                      placeholder="e.g. 88"
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
                      placeholder="e.g. 84"
                      value={formData.marks_12th}
                      onChange={handleInputChange}
                      data-testid="input-marks-12th"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="gpa">GPA / CGPA (out of 10)</Label>
                    <Input
                      id="gpa"
                      name="gpa"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 8.2"
                      value={formData.gpa}
                      onChange={handleInputChange}
                      data-testid="input-gpa"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="backlogs">Active Backlogs</Label>
                    <Input
                      id="backlogs"
                      name="backlogs"
                      type="number"
                      placeholder="0"
                      value={formData.backlogs}
                      onChange={handleInputChange}
                      data-testid="input-backlogs"
                    />
                  </div>
                  <div className="form-group full-width">
                    <Label htmlFor="domain">Preferred Domain / Field</Label>
                    <Input
                      id="domain"
                      name="domain"
                      placeholder="e.g., Data Science, Web Development, Cloud Computing"
                      value={formData.domain}
                      onChange={handleInputChange}
                      data-testid="input-domain"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="budget">Upskilling Budget (₹)</Label>
                    <Input
                      id="budget"
                      name="budget"
                      type="number"
                      placeholder="e.g. 50000"
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
                    <Label htmlFor="future_goals">Future Aspirations & Interests</Label>
                    <Textarea
                      id="future_goals"
                      name="future_goals"
                      placeholder="Describe your career goals, target companies or roles..."
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
                {user?.is_guest && (
                  <div className="chat-sandbox-notice" data-testid="chat-sandbox-notice">
                    <Sparkles size={14} />
                    <span>Demo Mode AI Counselor • Powered by Grok (xAI) / Google Gemini • Limit: 5 questions/session</span>
                  </div>
                )}
                <div className="chat-messages" data-testid="chat-messages">
                  {chatMessages.length === 0 && (
                    <div className="chat-welcome">
                      <Brain size={48} />
                      <h3>Hi! I'm your Margdarshak AI Counselor</h3>
                      <p>Ask about career options, domain requirements, interview preparation, or learning roadmaps!</p>
                    </div>
                  )}
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.role}`} data-testid={`chat-message-${idx}`}>
                      <div className="message-content">
                        {msg.content}
                        {msg.provider && (
                          <div className="msg-provider-tag">
                            <span>Source: {msg.provider}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="chat-message assistant">
                      <div className="message-content">Consulting career intelligence...</div>
                    </div>
                  )}
                </div>
                <div className="chat-input-area">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                    placeholder="Ask Margdarshak anything (e.g. How to break into Data Science?)"
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
                <div className="roadmap-header">
                  <div>
                    <h2>Career Roadmap: {roadmap.career}</h2>
                    <p className="roadmap-duration">Total Duration: {roadmap.total_duration_months} months</p>
                  </div>
                  <Button 
                    onClick={handleImportToUnnati} 
                    disabled={importing}
                    data-testid="btn-import-to-unnati"
                    className="import-unnati-btn"
                  >
                    <Download size={20} />
                    {importing ? 'Importing...' : 'Import to UNNATI'}
                  </Button>
                </div>
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
                          {level.projects.map((proj, pidx) => (
                            <li key={pidx}>{proj}</li>
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
          background: #f8fafc;
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

        .tabs-container {
          margin-top: 2rem;
        }

        .form-top-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .demo-fill-btn {
          border-color: #6366f1;
          color: #4f46e5;
          font-weight: 600;
          background: #eef2ff;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
        }

        .demo-fill-btn:hover {
          background: #e0e7ff;
          color: #3730a3;
        }

        .subtitle {
          color: #6b7280;
          font-size: 0.95rem;
          margin-top: 0.25rem;
        }

        .form-content {
          padding: 2rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .chat-card {
          min-height: 500px;
        }

        .chat-container {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          height: 600px;
        }

        .chat-sandbox-notice {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #fef3c7;
          border: 1px solid #fde68a;
          color: #92400e;
          font-size: 0.82rem;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-right: 0.5rem;
        }

        .chat-welcome {
          text-align: center;
          margin: auto;
          color: #6b7280;
        }

        .chat-message {
          display: flex;
          max-width: 80%;
        }

        .chat-message.user {
          margin-left: auto;
        }

        .chat-message.assistant {
          margin-right: auto;
        }

        .chat-message.user .message-content {
          background: #667eea;
          color: white;
          border-radius: 18px 18px 4px 18px;
        }

        .chat-message.assistant .message-content {
          background: #f1f5f9;
          color: #1a1a2e;
          border-radius: 18px 18px 18px 4px;
          white-space: pre-wrap;
        }

        .message-content {
          padding: 1rem 1.25rem;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .msg-provider-tag {
          margin-top: 0.5rem;
          font-size: 0.72rem;
          color: #64748b;
          font-style: italic;
          border-top: 1px dashed rgba(0, 0, 0, 0.1);
          padding-top: 0.35rem;
        }

        .chat-input-area {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .results-container {
          padding: 2rem 0;
        }

        .recommendations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .recommendation-card {
          border-left: 4px solid #667eea;
          transition: transform 0.2s ease;
        }

        .recommendation-card:hover {
          transform: translateY(-4px);
        }

        .match-score {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .category {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
        }

        .job-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .demand.high { color: #10b981; }
        .demand.medium { color: #f59e0b; }

        .skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .badge {
          background: #eef2ff;
          color: #4f46e5;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .badge-primary {
          background: #667eea20;
          color: #667eea;
        }

        .roadmap-container {
          padding: 2rem 0;
        }

        .roadmap-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .roadmap-duration {
          color: #6b7280;
          margin-bottom: 0;
          margin-top: 0.25rem;
        }

        .import-unnati-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .roadmap-timeline {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .timeline-item {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          border-left: 4px solid #667eea;
        }

        .timeline-item h3 {
          font-size: 1.25rem;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }

        .timeline-item .duration {
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .roadmap-section {
          margin: 1.25rem 0;
        }

        .roadmap-section h4 {
          font-size: 0.95rem;
          margin-bottom: 0.5rem;
          color: #667eea;
          font-weight: 600;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .roadmap-section ul {
          list-style: none;
          padding: 0;
        }

        .roadmap-section li {
          padding: 0.35rem 0;
          padding-left: 1.25rem;
          position: relative;
          color: #334155;
          font-size: 0.9rem;
        }

        .roadmap-section li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #667eea;
          font-weight: bold;
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
