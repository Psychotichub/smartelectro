import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import '../styles/pages/Projects.css';

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
      <div className="projects-page">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <h1>📁 Projects</h1>
        <p>Manage your electrical engineering projects</p>
        <button 
          className="create-project-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : '+ Create New Project'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="create-project-form">
          <h2>Create New Project</h2>
          <form onSubmit={handleCreateProject}>
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                name="name"
                value={newProject.name}
                onChange={handleInputChange}
                placeholder="Enter project name"
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={newProject.description}
                onChange={handleInputChange}
                placeholder="Enter project description"
                rows={4}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-btn">Create Project</button>
              <button type="button" className="cancel-btn" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="projects-section">
        <div className="projects-grid">
          {projects.length === 0 ? (
            <div className="no-projects">
              <div className="no-projects-icon">📁</div>
              <h3>No projects yet</h3>
              <p>Create your first project to get started with SmartElectro AI</p>
              <button 
                className="create-button"
                onClick={() => setShowCreateForm(true)}
              >
                Create Your First Project
              </button>
            </div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="project-header">
                  <h3>{project.name}</h3>
                  <button 
                    className="delete-button"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    🗑️
                  </button>
                </div>
                <p className="project-description">{project.description}</p>
                <div className="project-meta">
                  <span className="project-date">
                    Created: {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  <span className="project-date">
                    Updated: {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="project-actions">
                  <button className="action-btn">📊 Load Forecasting</button>
                  <button className="action-btn">⚠️ Fault Detection</button>
                  <button className="action-btn">🔌 Cable Calculator</button>
                  <button className="action-btn">🔧 Maintenance</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Projects; 