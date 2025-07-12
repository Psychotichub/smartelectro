import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import '../styles/pages/Modules.css';

interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.projects);
      setProjects(response.data);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You don\'t have permission to view projects.');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        setError('Unable to connect to the server. Please check if the backend is running.');
      } else {
        setError('Failed to fetch projects. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(API_ENDPOINTS.projects, newProject);
      setProjects([...projects, response.data]);
      setNewProject({ name: '', description: '' });
      setShowCreateForm(false);
    } catch (error: any) {
      console.error('Error creating project:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You don\'t have permission to create projects.');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        setError('Unable to connect to the server. Please check if the backend is running.');
      } else {
        setError('Failed to create project. Please try again.');
      }
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await axios.delete(`${API_ENDPOINTS.projects}${projectId}`);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (error: any) {
      console.error('Error deleting project:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You don\'t have permission to delete projects.');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        setError('Unable to connect to the server. Please check if the backend is running.');
      } else {
        setError('Failed to delete project. Please try again.');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="electric-training-container">
        <div className="electric-content">
          <div className="electric-control-section">
            <div className="loading-spinner"></div>
            <p className="electric-loading-text">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="electric-training-container">
      <div className="electric-header">
        <h1>📁 Projects</h1>
        <p>Manage your electrical engineering projects with precision</p>
      </div>

      <div className="electric-content">
        <div className="electric-control-section">
          <div className="electric-project-header-controls">
            <h2>⚡ Project Management</h2>
            <button 
              className="electric-train-button electric-project-button-small"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? '❌ Cancel' : '+ Create New Project'}
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {showCreateForm && (
            <div className="electric-control-section">
              <h3 className="electric-section-title">⚡ Create New Project</h3>
              <form onSubmit={handleCreateProject}>
                <div className="electric-config-grid">
                  <div className="electric-config-card">
                    <label className="electric-auth-label">Project Name</label>
                    <input
                      type="text"
                      name="name"
                      value={newProject.name}
                      onChange={handleInputChange}
                      placeholder="Enter project name"
                      className="electric-input"
                      required
                    />
                  </div>
                  <div className="electric-config-card">
                    <label className="electric-auth-label">Description</label>
                    <textarea
                      name="description"
                      value={newProject.description}
                      onChange={handleInputChange}
                      placeholder="Enter project description"
                      rows={4}
                      className="electric-input"
                      required
                    />
                  </div>
                </div>
                <div className="electric-project-form-grid">
                  <button type="submit" className="electric-train-button">
                    ⚡ Create Project
                  </button>
                  <button type="button" className="reset-btn" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="electric-control-section">
            <h3 className="electric-section-title">🔬 Your Projects</h3>
            <div className="electric-config-grid">
              {projects.length === 0 ? (
                <div className="electric-model-card electric-project-no-projects">
                  <div className="electric-project-icon-large">📁</div>
                  <h3 className="electric-project-title">No projects yet</h3>
                  <p className="electric-project-description">Create your first project to get started with SmartElectro AI</p>
                  <button 
                    className="electric-train-button electric-project-button-small"
                    onClick={() => setShowCreateForm(true)}
                  >
                    ⚡ Create Your First Project
                  </button>
                </div>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="electric-model-card">
                    <div className="electric-project-card-header">
                      <h3 className="electric-project-card-title">{project.name}</h3>
                      <button 
                        className="electric-status critical electric-project-delete-button"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        🗑️
                      </button>
                    </div>
                    <p className="electric-project-card-text">{project.description}</p>
                    <div className="electric-project-meta">
                      <span className="electric-project-date">
                        Created: {new Date(project.created_at).toLocaleDateString()}
                      </span>
                      <br />
                      <span className="electric-project-date">
                        Updated: {new Date(project.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="electric-project-actions">
                      <button className="electric-status normal electric-project-action-button">
                        📊 Load Forecasting
                      </button>
                      <button className="electric-status normal electric-project-action-button">
                        ⚠️ Fault Detection
                      </button>
                      <button className="electric-status normal electric-project-action-button">
                        🔧 Maintenance
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects; 