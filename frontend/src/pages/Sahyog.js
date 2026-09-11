import { useState, useEffect } from "react";
import axios from "axios";
import { Users, Plus, MessageCircle, BookOpen, FileText, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const Sahyog = () => {
  const [activeTab, setActiveTab] = useState("community");
  const [posts, setPosts] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mentorDialogOpen, setMentorDialogOpen] = useState(false);
  
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    type: "question",
    author: ""
  });

  const [mentorRequest, setMentorRequest] = useState({
    name: "",
    email: "",
    domain: "",
    message: ""
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "community") {
        const res = await axios.get(`${API}/sahyog/posts`);
        setPosts(res.data.posts || []);
      } else if (activeTab === "resources") {
        const res = await axios.get(`${API}/sahyog/resources`);
        setResources(res.data.resources || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content || !newPost.author) return;
    
    try {
      await axios.post(`${API}/sahyog/posts`, newPost);
      setNewPost({ title: "", content: "", type: "question", author: "" });
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleMentorRequest = async () => {
    if (!mentorRequest.name || !mentorRequest.email || !mentorRequest.domain) return;
    
    try {
      await axios.post(`${API}/sahyog/mentor-request`, mentorRequest);
      setMentorRequest({ name: "", email: "", domain: "", message: "" });
      setMentorDialogOpen(false);
      alert("Mentor request submitted successfully!");
    } catch (error) {
      console.error("Error submitting mentor request:", error);
    }
  };

  const getPostIcon = (type) => {
    switch (type) {
      case "question": return <MessageCircle size={20} />;
      case "guide": return <BookOpen size={20} />;
      case "resource": return <FileText size={20} />;
      default: return <MessageCircle size={20} />;
    }
  };

  return (
    <div className="sahyog-page" data-testid="sahyog-page">
      <div className="page-header">
        <div className="container">
          <Users size={48} />
          <h1 className="page-title" data-testid="page-title">SAHYOG</h1>
          <p className="page-subtitle">Community Support & Resources</p>
        </div>
      </div>

      <div className="container">
        <div className="actions-bar">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="btn-new-post">
                <Plus size={20} />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
              </DialogHeader>
              <div className="dialog-form">
                <div className="form-group">
                  <Label htmlFor="author">Your Name</Label>
                  <Input
                    id="author"
                    value={newPost.author}
                    onChange={(e) => setNewPost({...newPost, author: e.target.value})}
                    data-testid="input-author"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="post-type">Type</Label>
                  <Select
                    value={newPost.type}
                    onValueChange={(value) => setNewPost({...newPost, type: value})}
                  >
                    <SelectTrigger data-testid="select-post-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="question">Question</SelectItem>
                      <SelectItem value="guide">Guide</SelectItem>
                      <SelectItem value="resource">Resource</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="form-group">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    data-testid="input-post-title"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    rows={5}
                    data-testid="input-post-content"
                  />
                </div>
                <Button onClick={handleCreatePost} data-testid="btn-submit-post">Submit Post</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={mentorDialogOpen} onOpenChange={setMentorDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" data-testid="btn-request-mentor">
                <UserPlus size={20} />
                Request Mentor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request a Mentor</DialogTitle>
              </DialogHeader>
              <div className="dialog-form">
                <div className="form-group">
                  <Label htmlFor="mentor-name">Your Name</Label>
                  <Input
                    id="mentor-name"
                    value={mentorRequest.name}
                    onChange={(e) => setMentorRequest({...mentorRequest, name: e.target.value})}
                    data-testid="input-mentor-name"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="mentor-email">Email</Label>
                  <Input
                    id="mentor-email"
                    type="email"
                    value={mentorRequest.email}
                    onChange={(e) => setMentorRequest({...mentorRequest, email: e.target.value})}
                    data-testid="input-mentor-email"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="mentor-domain">Domain of Interest</Label>
                  <Input
                    id="mentor-domain"
                    value={mentorRequest.domain}
                    onChange={(e) => setMentorRequest({...mentorRequest, domain: e.target.value})}
                    data-testid="input-mentor-domain"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="mentor-message">Message</Label>
                  <Textarea
                    id="mentor-message"
                    value={mentorRequest.message}
                    onChange={(e) => setMentorRequest({...mentorRequest, message: e.target.value})}
                    rows={4}
                    data-testid="input-mentor-message"
                  />
                </div>
                <Button onClick={handleMentorRequest} data-testid="btn-submit-mentor">Submit Request</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="tabs-container">
          <TabsList className="tabs-list" data-testid="sahyog-tabs">
            <TabsTrigger value="community" data-testid="tab-community">
              <MessageCircle size={18} />
              <span>Community Posts</span>
            </TabsTrigger>
            <TabsTrigger value="resources" data-testid="tab-resources">
              <BookOpen size={18} />
              <span>Resources</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="community" data-testid="community-content">
            {loading ? (
              <div className="loading">Loading posts...</div>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="empty-state">
                  <MessageCircle size={48} />
                  <p>No posts yet. Be the first to create one!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="posts-list">
                {posts.map((post, idx) => (
                  <Card key={idx} className="post-card" data-testid={`post-card-${idx}`}>
                    <CardContent className="post-content">
                      <div className="post-header">
                        <div className="post-type">
                          {getPostIcon(post.type)}
                          <span>{post.type}</span>
                        </div>
                        <span className="post-author">by {post.author}</span>
                      </div>
                      <h3 className="post-title">{post.title}</h3>
                      <p className="post-text">{post.content}</p>
                      <div className="post-footer">
                        <span className="post-date">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resources" data-testid="resources-content">
            <div className="resources-grid">
              {resources.map((resource, idx) => (
                <Card key={idx} className="resource-card" data-testid={`resource-card-${idx}`}>
                  <CardContent className="resource-content">
                    <div className="resource-icon">
                      {resource.type === "guide" ? <BookOpen size={32} /> : <FileText size={32} />}
                    </div>
                    <h3>{resource.title}</h3>
                    <span className="badge badge-primary">{resource.type}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <style jsx>{`
        .sahyog-page {
          min-height: 100vh;
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
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
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

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .posts-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .post-card {
          border-left: 4px solid #43e97b;
        }

        .post-content {
          padding: 1.5rem;
        }

        .post-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .post-type {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #667eea;
          font-weight: 600;
          text-transform: capitalize;
        }

        .post-author {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .post-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #1a1a2e;
        }

        .post-text {
          color: #4a5568;
          line-height: 1.7;
          margin-bottom: 1rem;
        }

        .post-footer {
          padding-top: 1rem;
          border-top: 1px solid #e8ecf1;
        }

        .post-date {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .resources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .resource-card {
          cursor: pointer;
          transition: transform 0.2s;
        }

        .resource-card:hover {
          transform: translateY(-4px);
        }

        .resource-content {
          text-align: center;
          padding: 2rem;
        }

        .resource-icon {
          color: #43e97b;
          margin-bottom: 1rem;
        }

        .resource-content h3 {
          font-size: 1.125rem;
          margin-bottom: 1rem;
          color: #1a1a2e;
        }

        .loading {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .actions-bar {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default Sahyog;