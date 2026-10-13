import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth, getAdminAuthHeader } from '../context/AdminAuthContext';
import axios from 'axios';
import { 
  Shield, Users, BookOpen, Briefcase, Award, LogOut, Plus, Edit, Trash2, 
  RefreshCw, Database, CheckCircle, AlertTriangle, Search, Activity, History 
} from 'lucide-react';
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
  const [courses, setCourses] = useState([]);
  const [syncHistory, setSyncHistory] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const [activeTab, setActiveTab] = useState('statistics');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [jobForm, setJobForm] = useState({
    job_title: '',
    category: '',
    avg_salary: 600000,
    demand_level: 'High',
    skills_required: '',
    city: 'Mumbai, Pune',
    entry_requirements: '',
    career_path_summary: '',
    duration_to_employable: '4-6 months'
  });

  const [skillForm, setSkillForm] = useState({
    skill_name: '',
    category: '',
    difficulty_level: 'Intermediate',
    description: '',
    relevant_roles: '',
    tools_related: ''
  });

  const [courseForm, setCourseForm] = useState({
    course_name: '',
    type: 'Certificate',
    institution: '',
    mode: 'Online',
    fees: 15000,
    skills_covered: '',
    rating: 4.5
  });

  useEffect(() => {
    if (!admin) {
      navigate('/admin-login');
      return;
    }
    fetchData();
  }, [admin]);

  const getHeaders = () => getAdminAuthHeader();

  const fetchData = async () => {
    try {
      const headers = getHeaders();
      const [statsRes, collegesRes, skillsRes, jobsRes, coursesRes, syncRes, auditRes] = await Promise.all([
        axios.get(`${API}/admin/statistics`, { withCredentials: true, headers }),
        axios.get(`${API}/admin/colleges`, { withCredentials: true, headers }).catch(() => axios.get(`${API}/jigyasa/colleges`)),
        axios.get(`${API}/admin/skills`, { withCredentials: true, headers }).catch(() => axios.get(`${API}/jigyasa/skills`)),
        axios.get(`${API}/admin/jobs`, { withCredentials: true, headers }).catch(() => axios.get(`${API}/jigyasa/jobs`)),
        axios.get(`${API}/admin/courses`, { withCredentials: true, headers }).catch(() => ({ data: { courses: [] } })),
        axios.get(`${API}/admin/sync/history`, { withCredentials: true, headers }).catch(() => ({ data: { history: [] } })),
        axios.get(`${API}/admin/audit-logs`, { withCredentials: true, headers }).catch(() => ({ data: { logs: [] } }))
      ]);

      setStatistics(statsRes.data);
      setColleges(collegesRes.data?.colleges || []);
      setSkills(skillsRes.data?.skills || []);
      setJobs(jobsRes.data?.jobs || []);
      setCourses(coursesRes.data?.courses || []);
      setSyncHistory(syncRes.data?.history || []);
      setAuditLogs(auditRes.data?.logs || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await adminLogout();
    navigate('/');
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      const res = await axios.post(`${API}/admin/sync/run`, { source_id: 'curated_public_feed' }, {
        withCredentials: true,
        headers: getHeaders()
      });
      toast.success(res.data.message || 'Data refresh triggered successfully!');
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Sync failed');
    }
    setSyncing(false);
  };

  const handleRunMigration = async () => {
    if (!window.confirm('Run initial database migration to seed/refresh collections from curated catalog?')) return;
    setMigrating(true);
    try {
      const res = await axios.post(`${API}/admin/migration/run`, {}, {
        withCredentials: true,
        headers: getHeaders()
      });
      toast.success('Database migration completed successfully!');
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Migration failed');
    }
    setMigrating(false);
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) return;
    try {
      await axios.delete(`${API}/admin/${type}/${id}`, {
        withCredentials: true,
        headers: getHeaders()
      });
      toast.success(`${type.slice(0, -1)} deleted successfully`);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleStatusChange = async (type, id, newStatus) => {
    try {
      await axios.patch(`${API}/admin/${type}/${id}/status`, { status: newStatus }, {
        withCredentials: true,
        headers: getHeaders()
      });
      toast.success(`Status updated to ${newStatus}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Job Save / Update
  const handleSaveJob = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        job_title: jobForm.job_title,
        category: jobForm.category,
        avg_salary: Number(jobForm.avg_salary),
        demand_level: jobForm.demand_level,
        skills_required: jobForm.skills_required.split(',').map(s => s.trim()).filter(Boolean),
        city: jobForm.city.split(',').map(s => s.trim()).filter(Boolean),
        entry_requirements: jobForm.entry_requirements,
        career_path_summary: jobForm.career_path_summary,
        duration_to_employable: jobForm.duration_to_employable,
        status: 'published'
      };

      if (editingItem) {
        await axios.put(`${API}/admin/jobs/${editingItem.job_id}`, payload, {
          withCredentials: true,
          headers: getHeaders()
        });
        toast.success('Job updated successfully');
      } else {
        await axios.post(`${API}/admin/jobs`, payload, {
          withCredentials: true,
          headers: getHeaders()
        });
        toast.success('Job added successfully');
      }
      setJobModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save job');
    }
  };

  // Skill Save / Update
  const handleSaveSkill = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        skill_name: skillForm.skill_name,
        category: skillForm.category,
        difficulty_level: skillForm.difficulty_level,
        description: skillForm.description,
        relevant_roles: skillForm.relevant_roles.split(',').map(s => s.trim()).filter(Boolean),
        tools_related: skillForm.tools_related.split(',').map(s => s.trim()).filter(Boolean),
        status: 'published'
      };

      if (editingItem) {
        await axios.put(`${API}/admin/skills/${editingItem.skill_id}`, payload, {
          withCredentials: true,
          headers: getHeaders()
        });
        toast.success('Skill updated successfully');
      } else {
        await axios.post(`${API}/admin/skills`, payload, {
          withCredentials: true,
          headers: getHeaders()
        });
        toast.success('Skill added successfully');
      }
      setSkillModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save skill');
    }
  };

  if (loading) return <div className="loading">Loading Sankalp Data Control Center...</div>;

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = !searchTerm || j.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) || j.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (j.status || 'published') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSkills = skills.filter(s => {
    return !searchTerm || s.skill_name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.category?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredCourses = courses.filter(c => {
    return !searchTerm || c.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.institution?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="admin-dashboard" data-testid="admin-dashboard">
      <div className="admin-header">
        <div className="container">
          <div className="header-content">
            <div className="header-left">
              <Shield size={40} />
              <div>
                <h1>Sankalp Data Control Center</h1>
                <p>MongoDB Atlas • Live Ingestion Pipeline • {admin?.email}</p>
              </div>
            </div>
            <div className="header-actions">
              <Button 
                onClick={handleTriggerSync} 
                variant="outline" 
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 mr-2"
                disabled={syncing}
              >
                <RefreshCw size={16} className={`mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Feed'}
              </Button>
              <Button 
                onClick={handleRunMigration} 
                variant="outline" 
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 mr-2"
                disabled={migrating}
              >
                <Database size={16} className={`mr-2 ${migrating ? 'animate-spin' : ''}`} />
                {migrating ? 'Migrating...' : 'Seed DB'}
              </Button>
              <Button onClick={handleLogout} variant="destructive" data-testid="btn-admin-logout">
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container dashboard-content">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="tabs-list">
            <TabsTrigger value="statistics">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
            <TabsTrigger value="skills">Skills ({skills.length})</TabsTrigger>
            <TabsTrigger value="courses">Courses ({courses.length || statistics?.total_courses || 0})</TabsTrigger>
            <TabsTrigger value="colleges">Colleges ({colleges.length})</TabsTrigger>
            <TabsTrigger value="sync_history">Sync History ({syncHistory.length})</TabsTrigger>
            <TabsTrigger value="audit_logs">Audit Trail ({auditLogs.length})</TabsTrigger>
          </TabsList>

          {/* OVERVIEW / STATISTICS */}
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
                      <p>Total Registered Users</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="stat-card">
                  <CardContent className="stat-content">
                    <div className="stat-icon" style={{ background: 'rgba(67, 233, 123, 0.1)' }}>
                      <Briefcase size={32} color="#43e97b" />
                    </div>
                    <div className="stat-info">
                      <h3>{statistics?.total_jobs || jobs.length || 0}</h3>
                      <p>Catalog Jobs</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="stat-card">
                  <CardContent className="stat-content">
                    <div className="stat-icon" style={{ background: 'rgba(240, 147, 251, 0.1)' }}>
                      <Award size={32} color="#f093fb" />
                    </div>
                    <div className="stat-info">
                      <h3>{statistics?.total_skills || skills.length || 0}</h3>
                      <p>Mapped Skills</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="stat-card">
                  <CardContent className="stat-content">
                    <div className="stat-icon" style={{ background: 'rgba(79, 172, 254, 0.1)' }}>
                      <BookOpen size={32} color="#4facfe" />
                    </div>
                    <div className="stat-info">
                      <h3>{statistics?.total_courses || courses.length || 40}</h3>
                      <p>Courses & Certifications</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ingestion & Governance Status Card */}
              <Card className="mb-6 p-4">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Activity size={20} className="text-green-500" />
                        Automated Data Pipeline Status
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        MongoDB Atlas is the single source of truth with deterministic scoring integration.
                        {statistics?.last_sync && ` Last automated sync: ${new Date(statistics.last_sync.started_at).toLocaleString()} (Status: ${statistics.last_sync.status})`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleTriggerSync} disabled={syncing}>
                        Run Ingestion Pipeline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

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

          {/* JOBS MANAGEMENT */}
          <TabsContent value="jobs">
            <div className="data-management">
              <div className="section-header flex justify-between items-center mb-6">
                <div>
                  <h2>Manage Career Roles ({filteredJobs.length})</h2>
                  <p className="text-sm text-gray-500">Live roles feeding Margadarshak scoring, Samarthya matching, and Drishtikon trends</p>
                </div>
                <div className="flex gap-3">
                  <Input 
                    placeholder="Search jobs..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-64"
                  />
                  <Button onClick={() => { setEditingItem(null); setJobModalOpen(true); }}>
                    <Plus size={16} className="mr-2" /> Add Job
                  </Button>
                </div>
              </div>

              <div className="data-grid">
                {filteredJobs.map((job) => (
                  <Card key={job.job_id} className="data-card shadow-sm hover:shadow-md transition">
                    <CardContent className="data-card-content">
                      <div className="flex justify-between items-start">
                        <h3>{job.job_title}</h3>
                        <span className={`badge ${job.status === 'archived' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                          {job.status || 'published'}
                        </span>
                      </div>
                      <p className="job-category">{job.category}</p>
                      <div className="data-meta flex flex-wrap gap-2">
                        <span className="badge">₹{(job.avg_salary / 100000).toFixed(1)}L/yr</span>
                        <span className="badge">{job.demand_level} Demand</span>
                        {job.city && <span className="badge">{job.city.slice(0, 2).join(', ')}</span>}
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        Skills: {job.skills_required?.slice(0, 4).join(', ')}
                      </div>
                      <div className="data-actions flex justify-between items-center pt-2 border-t">
                        <select 
                          className="text-xs border rounded px-1 py-1"
                          value={job.status || 'published'}
                          onChange={(e) => handleStatusChange('jobs', job.job_id, e.target.value)}
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </select>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => {
                              setEditingItem(job);
                              setJobForm({
                                job_title: job.job_title,
                                category: job.category,
                                avg_salary: job.avg_salary,
                                demand_level: job.demand_level || 'High',
                                skills_required: (job.skills_required || []).join(', '),
                                city: (job.city || []).join(', '),
                                entry_requirements: job.entry_requirements || '',
                                career_path_summary: job.career_path_summary || '',
                                duration_to_employable: job.duration_to_employable || ''
                              });
                              setJobModalOpen(true);
                            }}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete('jobs', job.job_id)}>
                            <Trash2 size={16} className="text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* SKILLS MANAGEMENT */}
          <TabsContent value="skills">
            <div className="data-management">
              <div className="section-header flex justify-between items-center mb-6">
                <div>
                  <h2>Manage Skills ({filteredSkills.length})</h2>
                  <p className="text-sm text-gray-500">Skills repository powering the gap analyzer and learning roadmaps</p>
                </div>
                <div className="flex gap-3">
                  <Input 
                    placeholder="Search skills..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-64"
                  />
                  <Button onClick={() => { setEditingItem(null); setSkillModalOpen(true); }}>
                    <Plus size={16} className="mr-2" /> Add Skill
                  </Button>
                </div>
              </div>

              <div className="data-grid">
                {filteredSkills.map((skill) => (
                  <Card key={skill.skill_id} className="data-card shadow-sm">
                    <CardContent className="data-card-content">
                      <div className="flex justify-between items-start">
                        <h3>{skill.skill_name}</h3>
                        <span className="badge">{skill.difficulty_level}</span>
                      </div>
                      <p className="description">{skill.description?.substring(0, 90)}...</p>
                      <div className="data-meta">
                        <span className="badge">{skill.category}</span>
                        {skill.avg_learning_duration && <span className="badge">{skill.avg_learning_duration}</span>}
                      </div>
                      <div className="data-actions">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            setEditingItem(skill);
                            setSkillForm({
                              skill_name: skill.skill_name,
                              category: skill.category,
                              difficulty_level: skill.difficulty_level,
                              description: skill.description || '',
                              relevant_roles: (skill.relevant_roles || []).join(', '),
                              tools_related: (skill.tools_related || []).join(', ')
                            });
                            setSkillModalOpen(true);
                          }}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete('skills', skill.skill_id)}>
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* COURSES MANAGEMENT */}
          <TabsContent value="courses">
            <div className="data-management">
              <div className="section-header flex justify-between items-center mb-6">
                <div>
                  <h2>Manage Courses & Bootcamps ({filteredCourses.length})</h2>
                  <p className="text-sm text-gray-500">Learning opportunities mapped to skills in the Margadarshak scoring engine</p>
                </div>
                <div className="flex gap-3">
                  <Input 
                    placeholder="Search courses..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-64"
                  />
                </div>
              </div>

              <div className="data-grid">
                {filteredCourses.map((c) => (
                  <Card key={c.course_id} className="data-card shadow-sm">
                    <CardContent className="data-card-content">
                      <h3>{c.course_name}</h3>
                      <p className="institution">{c.institution}</p>
                      <div className="data-meta">
                        <span className="badge">{c.type}</span>
                        <span className="badge">{c.mode}</span>
                        <span className="badge">₹{c.fees?.toLocaleString() || 0}</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Covers: {c.skills_covered?.slice(0, 3).join(', ')}
                      </div>
                      <div className="data-actions">
                        <Button size="sm" variant="ghost" onClick={() => handleDelete('courses', c.course_id)}>
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* COLLEGES MANAGEMENT */}
          <TabsContent value="colleges">
            <div className="data-management">
              <div className="section-header flex justify-between items-center mb-6">
                <h2>Manage Colleges & Higher Degrees ({colleges.length})</h2>
                <Input 
                  placeholder="Search colleges..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-64"
                />
              </div>
              <div className="data-grid">
                {colleges.map((college) => (
                  <Card key={college.college_id || college.course_id} className="data-card shadow-sm">
                    <CardContent className="data-card-content">
                      <h3>{college.program_name || college.course_name}</h3>
                      <p className="institution">{college.college_name || college.institution}</p>
                      <div className="data-meta">
                        <span className="badge">{college.degree_type || college.type}</span>
                        <span className="badge">{college.mode}</span>
                        <span className="badge">{college.city || 'All'}</span>
                      </div>
                      <div className="data-actions">
                        <Button size="sm" variant="ghost" onClick={() => handleDelete('colleges', college.college_id || college.course_id)}>
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* SYNC HISTORY */}
          <TabsContent value="sync_history">
            <div className="data-management">
              <div className="section-header flex justify-between items-center mb-6">
                <div>
                  <h2>Ingestion & Refresh Sync Runs</h2>
                  <p className="text-sm text-gray-500">Automated and manual sync executions recorded for pipeline traceability</p>
                </div>
                <Button onClick={handleTriggerSync} disabled={syncing}>
                  <RefreshCw size={16} className={`mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  Trigger Sync Now
                </Button>
              </div>

              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Run ID</th>
                      <th>Source</th>
                      <th>Status</th>
                      <th>Fetched</th>
                      <th>Created</th>
                      <th>Updated</th>
                      <th>Started At</th>
                      <th>Completed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncHistory.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-4 text-gray-500">No sync runs recorded yet. Click "Trigger Sync Now" to test.</td></tr>
                    ) : (
                      syncHistory.map((run, idx) => (
                        <tr key={idx}>
                          <td className="font-mono text-xs">{run.run_id?.substring(0, 8)}...</td>
                          <td>{run.source_name}</td>
                          <td>
                            <span className={`badge ${run.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {run.status}
                            </span>
                          </td>
                          <td>{run.fetched_count}</td>
                          <td>{run.created_count}</td>
                          <td>{run.updated_count}</td>
                          <td>{new Date(run.started_at).toLocaleString()}</td>
                          <td>{run.completed_at ? new Date(run.completed_at).toLocaleString() : 'In Progress'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* AUDIT LOGS */}
          <TabsContent value="audit_logs">
            <div className="data-management">
              <div className="section-header mb-6">
                <h2>Administrative Audit Trail</h2>
                <p className="text-sm text-gray-500">Immutable log of mutations, status changes, and ingestion records</p>
              </div>

              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>Collection</th>
                      <th>Entity ID</th>
                      <th>Actor</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-4 text-gray-500">No audit events recorded yet.</td></tr>
                    ) : (
                      auditLogs.map((log, idx) => (
                        <tr key={idx}>
                          <td>{new Date(log.timestamp).toLocaleString()}</td>
                          <td><span className="badge uppercase">{log.action}</span></td>
                          <td>{log.collection_name}</td>
                          <td>{log.entity_id}</td>
                          <td>{log.actor}</td>
                          <td className="text-xs text-gray-600 max-w-xs truncate">{JSON.stringify(log.changes || {})}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ADD / EDIT JOB DIALOG */}
      <Dialog open={jobModalOpen} onOpenChange={setJobModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Career Role' : 'Add New Career Role'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveJob} className="space-y-4 pt-2">
            <div>
              <Label>Job Title</Label>
              <Input 
                value={jobForm.job_title} 
                onChange={(e) => setJobForm({ ...jobForm, job_title: e.target.value })} 
                required 
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input 
                value={jobForm.category} 
                onChange={(e) => setJobForm({ ...jobForm, category: e.target.value })} 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Average Salary (₹/yr)</Label>
                <Input 
                  type="number" 
                  value={jobForm.avg_salary} 
                  onChange={(e) => setJobForm({ ...jobForm, avg_salary: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <Label>Demand Level</Label>
                <select 
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={jobForm.demand_level} 
                  onChange={(e) => setJobForm({ ...jobForm, demand_level: e.target.value })}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low-Medium">Low-Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Required Skills (comma separated)</Label>
              <Input 
                value={jobForm.skills_required} 
                onChange={(e) => setJobForm({ ...jobForm, skills_required: e.target.value })} 
                placeholder="Python, SQL, Machine Learning"
                required 
              />
            </div>
            <div>
              <Label>Target Cities (comma separated)</Label>
              <Input 
                value={jobForm.city} 
                onChange={(e) => setJobForm({ ...jobForm, city: e.target.value })} 
                placeholder="Mumbai, Pune, Nagpur" 
              />
            </div>
            <div>
              <Label>Entry Requirements</Label>
              <Textarea 
                value={jobForm.entry_requirements} 
                onChange={(e) => setJobForm({ ...jobForm, entry_requirements: e.target.value })} 
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setJobModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Role</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD / EDIT SKILL DIALOG */}
      <Dialog open={skillModalOpen} onOpenChange={setSkillModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Skill' : 'Add New Skill'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSkill} className="space-y-4 pt-2">
            <div>
              <Label>Skill Name</Label>
              <Input 
                value={skillForm.skill_name} 
                onChange={(e) => setSkillForm({ ...skillForm, skill_name: e.target.value })} 
                required 
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input 
                value={skillForm.category} 
                onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })} 
                required 
              />
            </div>
            <div>
              <Label>Difficulty Level</Label>
              <select 
                className="w-full border rounded px-3 py-2 text-sm"
                value={skillForm.difficulty_level} 
                onChange={(e) => setSkillForm({ ...skillForm, difficulty_level: e.target.value })}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={skillForm.description} 
                onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })} 
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setSkillModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Skill</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
          background: white;
          border-radius: 8px;
          border: 1px solid #e8ecf1;
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
          background: #f8fafc;
        }

        .data-management {
          margin-top: 2rem;
        }

        .data-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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