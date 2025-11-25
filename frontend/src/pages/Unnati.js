import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Plus, Calendar, Target, CheckCircle2, Circle, Clock, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Unnati = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    start_date: '',
    due_date: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    fetchProgress();
  }, [user]);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/unnati/${user.id}`, { withCredentials: true });
      setProgressData(res.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
    setLoading(false);
  };

  const handleAddGoal = async () => {
    try {
      await axios.post(`${API}/unnati/${user.id}/add-goal`, newGoal, { withCredentials: true });
      setNewGoal({ title: '', description: '', start_date: '', due_date: '' });
      setDialogOpen(false);
      fetchProgress();
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const handleUpdateProgress = async (itemId, status, percent) => {
    try {
      await axios.post(`${API}/unnati/${user.id}/update`, {
        item_id: itemId,
        status: status,
        percent_complete: percent
      }, { withCredentials: true });
      fetchProgress();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      await axios.delete(`${API}/unnati/${user.id}/delete-goal/${goalId}`, { withCredentials: true });
      fetchProgress();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={20} color="#10b981" />;
      case 'in_progress': return <Clock size={20} color="#f59e0b" />;
      default: return <Circle size={20} color="#6b7280" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (loading) return <div className="loading">Loading progress...</div>;

  return (
    <div className="unnati-page" data-testid="unnati-page">
      <div className="page-header">
        <div className="container">
          <TrendingUp size={48} />
          <h1 className="page-title" data-testid="page-title">UNNATI</h1>
          <p className="page-subtitle">Track Your Progress & Achieve Your Goals</p>
        </div>
      </div>

      <div className="container">
        {/* Stats Dashboard */}
        <div className="stats-grid">
          <Card className="stat-card">
            <CardContent className="stat-content">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <CheckCircle2 size={28} color="#10b981" />
              </div>
              <div className="stat-info">
                <h3 data-testid="completed-count">{progressData?.stats.completed || 0}</h3>
                <p>Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="stat-content">
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                <Clock size={28} color="#f59e0b" />
              </div>
              <div className="stat-info">
                <h3 data-testid="inprogress-count">{progressData?.stats.in_progress || 0}</h3>
                <p>In Progress</p>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="stat-content">
              <div className="stat-icon" style={{ background: 'rgba(102, 126, 234, 0.1)' }}>
                <Target size={28} color="#667eea" />
              </div>
              <div className="stat-info">
                <h3 data-testid="total-count">{progressData?.stats.total || 0}</h3>
                <p>Total Goals</p>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="stat-content">
              <div className="circular-progress">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e8ecf1" strokeWidth="8" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="#667eea" 
                    strokeWidth="8"
                    strokeDasharray={`${(progressData?.stats.completion_rate || 0) * 2.827} 283`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                  <text x="50" y="50" textAnchor="middle" dy="7" fontSize="20" fontWeight="700" fill="#1a1a2e">
                    {progressData?.stats.completion_rate || 0}%
                  </text>
                </svg>
              </div>
              <p>Completion Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="actions-bar">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="btn-add-goal">
                <Plus size={20} />
                Add Custom Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Custom Goal</DialogTitle>
              </DialogHeader>
              <div className="dialog-form">
                <div className="form-group">
                  <Label htmlFor="title">Goal Title</Label>
                  <Input
                    id="title"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                    data-testid="input-goal-title"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                    rows={3}
                    data-testid="input-goal-description"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newGoal.start_date}
                      onChange={(e) => setNewGoal({...newGoal, start_date: e.target.value})}
                      data-testid="input-start-date"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={newGoal.due_date}
                      onChange={(e) => setNewGoal({...newGoal, due_date: e.target.value})}
                      data-testid="input-due-date"
                    />
                  </div>
                </div>
                <Button onClick={handleAddGoal} data-testid="btn-submit-goal">Create Goal</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="secondary" 
            onClick={() => navigate('/margadarshak')}
            data-testid="btn-import-roadmap"
          >
            <Calendar size={20} />
            Import from Roadmap
          </Button>
        </div>

        {/* Upcoming Deadlines */}
        {progressData?.upcoming_deadlines && progressData.upcoming_deadlines.length > 0 && (
          <Card className="deadlines-card">
            <CardContent>
              <h2>Upcoming Deadlines</h2>
              <div className="deadlines-list">
                {progressData.upcoming_deadlines.map((item, idx) => (
                  <div key={idx} className="deadline-item" data-testid={`deadline-${idx}`}>
                    <div className="deadline-icon">
                      <Calendar size={18} />
                    </div>
                    <div className="deadline-content">
                      <h4>{item.title}</h4>
                      <span className="deadline-date">
                        Due: {new Date(item.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Items */}
        <div className="progress-section">
          <h2>Your Progress</h2>
          {progressData?.items && progressData.items.length === 0 ? (
            <Card>
              <CardContent className="empty-state">
                <Target size={48} />
                <p>No goals yet. Create your first goal or import from roadmap!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="progress-list">
              {progressData?.items.map((item, idx) => (
                <Card key={idx} className="progress-item" data-testid={`progress-item-${idx}`}>
                  <CardContent className="progress-content">
                    <div className="progress-header">
                      <div className="progress-title-section">
                        {getStatusIcon(item.status)}
                        <div>
                          <h3>{item.title}</h3>
                          <span className="item-type">{item.type.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div className="progress-actions">
                        {item.type === 'custom_goal' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                setEditDialogOpen(true);
                              }}
                              data-testid={`btn-edit-${idx}`}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteGoal(item.id)}
                              data-testid={`btn-delete-${idx}`}
                            >
                              <Trash2 size={16} color="#ef4444" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {item.description && <p className="item-description">{item.description}</p>}

                    <div className="progress-bar-section">
                      <Progress value={item.percent_complete} />
                      <span>{item.percent_complete}%</span>
                    </div>

                    <div className="progress-controls">
                      <Select 
                        value={item.status} 
                        onValueChange={(value) => handleUpdateProgress(item.id, value, item.percent_complete)}
                      >
                        <SelectTrigger className="status-select" data-testid={`status-select-${idx}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select 
                        value={item.percent_complete.toString()} 
                        onValueChange={(value) => handleUpdateProgress(item.id, item.status, parseFloat(value))}
                      >
                        <SelectTrigger className="percent-select" data-testid={`percent-select-${idx}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 25, 50, 75, 100].map(val => (
                            <SelectItem key={val} value={val.toString()}>{val}%</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {item.due_date && (
                      <div className="item-footer">
                        <Calendar size={14} />
                        <span>Due: {new Date(item.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .unnati-page {
          min-height: 100vh;
          background: #f5f7fa;
          padding-bottom: 3rem;
        }

        .page-header {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
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

        .circular-progress {
          width: 100px;
          height: 100px;
          margin-bottom: 1rem;
        }

        .stat-content p {
          text-align: center;
          color: #6b7280;
        }

        .actions-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .dialog-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem 0;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .deadlines-card {
          margin-bottom: 2rem;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .deadlines-card h2 {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          color: #1a1a2e;
        }

        .deadlines-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .deadline-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f5f7fa;
          border-radius: 8px;
        }

        .deadline-icon {
          width: 40px;
          height: 40px;
          background: rgba(67, 233, 123, 0.1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #43e97b;
        }

        .deadline-content h4 {
          font-size: 1rem;
          margin-bottom: 0.25rem;
          color: #1a1a2e;
        }

        .deadline-date {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .progress-section h2 {
          font-size: 1.75rem;
          margin-bottom: 1.5rem;
          color: #1a1a2e;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .progress-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .progress-item {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .progress-content {
          padding: 1.5rem;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .progress-title-section {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          flex: 1;
        }

        .progress-title-section h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: #1a1a2e;
        }

        .item-type {
          font-size: 0.875rem;
          color: #6b7280;
          text-transform: capitalize;
        }

        .progress-actions {
          display: flex;
          gap: 0.5rem;
        }

        .item-description {
          color: #4a5568;
          margin-bottom: 1rem;
          padding-left: 2.5rem;
        }

        .progress-bar-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .progress-bar-section span {
          min-width: 50px;
          font-weight: 600;
          color: #667eea;
        }

        .progress-controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .status-select, .percent-select {
          flex: 1;
        }

        .item-footer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e8ecf1;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .loading {
          text-align: center;
          padding: 3rem;
          font-size: 1.125rem;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .actions-bar {
            flex-direction: column;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Unnati;
