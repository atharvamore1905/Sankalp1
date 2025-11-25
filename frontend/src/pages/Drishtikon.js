import { useState, useEffect } from "react";
import axios from "axios";
import { BarChart3, TrendingUp, DollarSign, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'];

const Drishtikon = () => {
  const [insights, setInsights] = useState(null);
  const [salaryTrends, setSalaryTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [insightsRes, salaryRes] = await Promise.all([
        axios.get(`${API}/drishtikon/insights`),
        axios.get(`${API}/drishtikon/salary-trends`)
      ]);
      setInsights(insightsRes.data);
      setSalaryTrends(salaryRes.data.salary_trends || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  if (loading) return <div className="loading">Loading insights...</div>;
  if (!insights) return <div className="error">Failed to load insights</div>;

  return (
    <div className="drishtikon-page" data-testid="drishtikon-page">
      <div className="page-header">
        <div className="container">
          <BarChart3 size={48} />
          <h1 className="page-title" data-testid="page-title">DRISHTIKON</h1>
          <p className="page-subtitle">Career Insights Dashboard</p>
        </div>
      </div>

      <div className="container">
        <div className="stats-grid">
          <Card className="stat-card">
            <CardContent className="stat-content">
              <div className="stat-icon" style={{ background: 'rgba(102, 126, 234, 0.1)' }}>
                <TrendingUp size={28} color="#667eea" />
              </div>
              <div className="stat-info">
                <h3 data-testid="high-demand-count">{insights.high_demand_count}</h3>
                <p>High Demand Jobs</p>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="stat-content">
              <div className="stat-icon" style={{ background: 'rgba(67, 233, 123, 0.1)' }}>
                <DollarSign size={28} color="#43e97b" />
              </div>
              <div className="stat-info">
                <h3 data-testid="avg-salary">₹{(insights.salary_insights.average / 100000).toFixed(1)}L</h3>
                <p>Average Salary</p>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="stat-content">
              <div className="stat-icon" style={{ background: 'rgba(240, 147, 251, 0.1)' }}>
                <Users size={28} color="#f093fb" />
              </div>
              <div className="stat-info">
                <h3 data-testid="jobs-analyzed">{insights.total_jobs_analyzed}</h3>
                <p>Jobs Analyzed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="stat-content">
              <div className="stat-icon" style={{ background: 'rgba(79, 172, 254, 0.1)' }}>
                <BarChart3 size={28} color="#4facfe" />
              </div>
              <div className="stat-info">
                <h3 data-testid="top-skills-count">{insights.top_emerging_skills.length}</h3>
                <p>Top Skills Tracked</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="charts-grid">
          <Card className="chart-card">
            <CardContent className="chart-content">
              <h2>Salary Trends by Domain</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={salaryTrends.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${(value / 100000).toFixed(1)}L`} />
                  <Bar dataKey="average_salary" fill="#667eea" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="chart-card">
            <CardContent className="chart-content">
              <h2>Trending Domains</h2>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={insights.trending_domains.slice(0, 8)}
                    dataKey="job_count"
                    nameKey="domain"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label
                  >
                    {insights.trending_domains.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="skills-card">
          <CardContent className="skills-content">
            <h2>Top Emerging Skills</h2>
            <div className="skills-grid">
              {insights.top_emerging_skills.map((skill, idx) => (
                <div key={idx} className="skill-item" data-testid={`skill-item-${idx}`}>
                  <div className="skill-rank">#{idx + 1}</div>
                  <div className="skill-details">
                    <h3>{skill.skill}</h3>
                    <div className="skill-demand">
                      <div className="demand-bar" style={{ width: `${(skill.demand / insights.top_emerging_skills[0].demand) * 100}%` }}></div>
                    </div>
                    <span className="demand-count">{skill.demand} mentions</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="insights-grid">
          <Card className="insight-card">
            <CardContent>
              <h3>Salary Insights</h3>
              <div className="insight-items">
                <div className="insight-item">
                  <span className="label">Highest Salary</span>
                  <span className="value">₹{(insights.salary_insights.highest / 100000).toFixed(1)}L/year</span>
                </div>
                <div className="insight-item">
                  <span className="label">Lowest Salary</span>
                  <span className="value">₹{(insights.salary_insights.lowest / 100000).toFixed(1)}L/year</span>
                </div>
                <div className="insight-item">
                  <span className="label">Average Salary</span>
                  <span className="value">₹{(insights.salary_insights.average / 100000).toFixed(1)}L/year</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="insight-card">
            <CardContent>
              <h3>Market Trends</h3>
              <div className="trend-items">
                <div className="trend-item">
                  <TrendingUp size={24} color="#43e97b" />
                  <div>
                    <p className="trend-label">High Demand Sectors</p>
                    <p className="trend-value">Data Science, Cloud, AI/ML</p>
                  </div>
                </div>
                <div className="trend-item">
                  <TrendingUp size={24} color="#667eea" />
                  <div>
                    <p className="trend-label">Fastest Growing</p>
                    <p className="trend-value">DevOps, Cybersecurity, Full-Stack</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx>{`
        .drishtikon-page {
          min-height: 100vh;
          padding-bottom: 3rem;
          background: #f5f7fa;
        }

        .page-header {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          border: none;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .stat-content {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem;
        }

        .stat-icon {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-info h3 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: #1a1a2e;
        }

        .stat-info p {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .chart-card {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .chart-content {
          padding: 2rem;
        }

        .chart-content h2 {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          color: #1a1a2e;
        }

        .skills-card {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          margin-bottom: 2rem;
        }

        .skills-content {
          padding: 2rem;
        }

        .skills-content h2 {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          color: #1a1a2e;
        }

        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1rem;
        }

        .skill-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #f5f7fa;
          border-radius: 8px;
        }

        .skill-rank {
          font-size: 1.5rem;
          font-weight: 700;
          color: #667eea;
          min-width: 50px;
        }

        .skill-details {
          flex: 1;
        }

        .skill-details h3 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
          color: #1a1a2e;
        }

        .skill-demand {
          height: 8px;
          background: #e8ecf1;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .demand-bar {
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s ease;
        }

        .demand-count {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .insight-card {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .insight-card h3 {
          font-size: 1.25rem;
          margin-bottom: 1.5rem;
          color: #1a1a2e;
        }

        .insight-items {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .insight-item {
          display: flex;
          justify-content: space-between;
          padding: 1rem;
          background: #f5f7fa;
          border-radius: 8px;
        }

        .insight-item .label {
          color: #6b7280;
        }

        .insight-item .value {
          font-weight: 700;
          color: #1a1a2e;
        }

        .trend-items {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .trend-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #f5f7fa;
          border-radius: 8px;
        }

        .trend-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .trend-value {
          font-weight: 600;
          color: #1a1a2e;
        }

        .loading, .error {
          text-align: center;
          padding: 3rem;
          font-size: 1.125rem;
        }

        @media (max-width: 768px) {
          .charts-grid, .skills-grid, .insights-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Drishtikon;