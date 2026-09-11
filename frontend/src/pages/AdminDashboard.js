import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import axios from 'axios';
import { Shield, Users, BookOpen, Briefcase, Award, LogOut, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { admin, adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [skills, setSkills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [activeTab, setActiveTab] = useState('statistics');

  useEffect(() => {
    if (!admin) {
      navigate('/admin-login');
      return;
    }
    fetchData();
  }, [admin]);

  const fetchData = async () => {
    try {
      const [statsRes, collegesRes, skillsRes, jobsRes] = await Promise.all([
        axios.get(`${API}/admin/statistics`, { withCredentials: true }),
        axios.get(`${API}/jigyasa/colleges`, { withCredentials: true }),
        axios.get(`${API}/jigyasa/skills`, { withCredentials: true }),
        axios.get(`${API}/jigyasa/jobs`, { withCredentials: true })
      ]);
      
      setStatistics(statsRes.data);
      setColleges(collegesRes.data.colleges);
      setSkills(skillsRes.data.skills);
      setJobs(jobsRes.data.jobs);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await adminLogout();
    navigate('/');
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await axios.delete(`${API}/admin/jigyasa/${type}/${id}`, { withCredentials: true });
      toast.success(`${type.slice(0, -1)} deleted successfully`);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  if (loading) return <div className="loading">Loading admin dashboard...</div>;

  return (
    <div className="admin-dashboard" data-testid="admin-dashboard">
      <div className="admin-header">
        <div className="container">
          <div className="header-content">
            <div className="header-left">
              <Shield size={40} />
              <div>
                <h1>Admin Dashboard</h1>
                <p>{admin?.email}</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="destructive" data-testid="btn-admin-logout">
              <LogOut size={20} />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container dashboard-content">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="tabs-list">
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="colleges">Colleges</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="statistics">
            <div className="stats-section">
              <div className="stats-grid">
                <Card className="stat-card">
                  <CardContent className="stat-content">
                    <div className="stat-icon" style={{ background: 'rgba(102, 126, 234, 0.1)' }}>
                      <Users size={32} color="#667eea" />
                    </div>
                    <div className="stat-info">
                      <h3>{statistics?.total_users || 0}</h3>
                      <p>Total Users</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="stat-card">
                  <CardContent className="stat-content">
                    <div className="stat-icon" style={{ background: 'rgba(240, 147, 251, 0.1)' }}>
                      <Award size={32} color="#f093fb" />
                    </div>
                    <div className="stat-info">
                      <h3>{statistics?.total_skills || 0}</h3>
                      <p>Total Skills</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="stat-card">
                  <CardContent className="stat-content">
                    <div className="stat-icon" style={{ background: 'rgba(67, 233, 123, 0.1)' }}>
                      <Briefcase size={32} color="#43e97b" />
                    </div>
                    <div className="stat-info">
                      <h3>{statistics?.total_jobs || 0}</h3>
                      <p>Total Jobs</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="stat-card">
                  <CardContent className="stat-content">
                    <div className="stat-icon" style={{ background: 'rgba(79, 172, 254, 0.1)' }}>
                      <BookOpen size={32} color="#4facfe" />
                    </div>
                    <div className="stat-info">
                      <h3>{statistics?.total_courses || 0}</h3>
                      <p>Total Courses</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {statistics?.recent_users && statistics.recent_users.length > 0 && (
                <Card className="recent-users-card">
                  <CardContent>
                    <h2>Recent Users</h2>
                    <div className="users-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statistics.recent_users.map((user, idx) => (
                            <tr key={idx}>
                              <td>{user.name}</td>
                              <td>{user.email}</td>
                              <td>{user.phone_no}</td>
                              <td>{new Date(user.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="colleges">
            <div className="data-management">
              <div className="section-header">
                <h2>Manage Colleges</h2>
              </div>
              <div className="data-grid">
                {colleges.map((college) => (
                  <Card key={college.course_id} className="data-card">
                    <CardContent className="data-card-content">
                      <h3>{college.course_name}</h3>
                      <p className="institution">{college.institution}</p>
                      <div className="data-meta">
                        <span className="badge">{college.type}</span>
                        <span className="badge">{college.mode}</span>
                      </div>
                      <div className="data-actions">
                        <Button size="sm" variant="ghost" onClick={() => handleDelete('colleges', college.course_id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills">
            <div className="data-management">
              <div className="section-header">
                <h2>Manage Skills</h2>
              </div>
              <div className="data-grid">
                {skills.map((skill) => (
                  <Card key={skill.skill_id} className="data-card">
                    <CardContent className="data-card-content">
                      <h3>{skill.skill_name}</h3>
                      <p className="description">{skill.description?.substring(0, 100)}...</p>
                      <div className="data-meta">
                        <span className="badge">{skill.category}</span>
                        <span className="badge">{skill.difficulty_level}</span>
                      </div>
                      <div className="data-actions">
                        <Button size="sm" variant="ghost" onClick={() => handleDelete('skills', skill.skill_id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="jobs">
            <div className="data-management">
              <div className="section-header">
                <h2>Manage Jobs</h2>
              </div>
              <div className="data-grid">
                {jobs.map((job) => (
                  <Card key={job.job_id} className="data-card">
                    <CardContent className="data-card-content">
                      <h3>{job.job_title}</h3>
                      <p className="job-category">{job.category}</p>
                      <div className="data-meta">
                        <span className="badge">₹{(job.avg_salary / 100000).toFixed(1)}L</span>
                        <span className="badge">{job.demand_level}</span>
                      </div>
                      <div className="data-actions">
                        <Button size="sm" variant="ghost" onClick={() => handleDelete('jobs', job.job_id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <style jsx>{`
        .admin-dashboard {
          min-height: 100vh;
          background: #f5f7fa;
        }

        .admin-header {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
          padding: 2rem;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-left h1 {
          font-size: 1.75rem;
          margin-bottom: 0.25rem;
        }

        .header-left p {
          font-size: 0.875rem;
          opacity: 0.8;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .dashboard-content {
          padding: 2rem;
        }

        .stats-section {
          margin-top: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
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
        }

        .stat-info p {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .recent-users-card {
          margin-top: 2rem;
        }

        .recent-users-card h2 {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .users-table {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          text-align: left;
          padding: 1rem;
          border-bottom: 1px solid #e8ecf1;
        }

        th {
          font-weight: 600;
          color: #1a1a2e;
          background: #f5f7fa;
        }

        .data-management {
          margin-top: 2rem;
        }

        .section-header {
          margin-bottom: 2rem;
        }

        .section-header h2 {
          font-size: 1.75rem;
        }

        .data-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .data-card-content {
          position: relative;
          padding: 1.5rem;
        }

        .data-card-content h3 {
          font-size: 1.125rem;
          margin-bottom: 0.5rem;
        }

        .institution, .job-category, .description {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .data-meta {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }

        .data-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .loading {
          text-align: center;
          padding: 3rem;
          font-size: 1.125rem;
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 1rem;
          }

          .stats-grid, .data-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;