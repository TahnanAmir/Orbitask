import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar';
import { useSelector } from 'react-redux';
import './Projects.css'
import Sidebar from '../components/Sidebar';
import { BsFolder } from 'react-icons/bs';
import axios from 'axios';

const ViewProject = () => {
  const [groupedProjects, setGroupedProjects] = useState(null);
  const [projectStatuses, setProjectStatuses] = useState({});
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const loggedInUser = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const collapsed = useSelector((state) => state.sidebar.isCollapsed);
  const searchQuery = useSelector((state) => state.search.query);

  const theme = useSelector((state) => state.theme.mode);
  const [sprints, setSprints] = useState([]);

  const schema = yup.object().shape({
    projectName: yup.string().required('Project Name is required'),
    description: yup.string().required('Description is required'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const fetchProjectData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/projects', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const rawProjectData = response.data;

      const grouped = {};

      rawProjectData.forEach(row => {
        const key = row.project_name;
        if (!grouped[key]) {
          grouped[key] = {
            project_id: row["project-id"],
            project_name: row.project_name,
            description: row.description,
            active_sprint: row.active_sprint,
            status: row.status
          };
        }
      });

      setGroupedProjects(Object.values(grouped));
    } catch (error) {
      console.error('Project fetch error:', error);
      alert('Failed to fetch project data. Please login again.');
      navigate('/login');
    }
  };

  useEffect(() => {
    if (!loggedInUser) {
      alert('No user logged in');
      navigate('/login');
      return;
    }

    fetchProjectData();

    axios.get('http://localhost:3000/sprints', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(response => {
        setSprints(response.data);
      })
      .catch(error => {
        console.error('Error fetching sprints:', error);
        setSprints([]);
      });
  }, [loggedInUser, navigate]);

  useEffect(() => {
    if (groupedProjects) {
      const newStatuses = {};
      groupedProjects.forEach(p => {
        newStatuses[p.project_id] = p.status || 'To Do';
      });
      setProjectStatuses(newStatuses);
    }
  }, [groupedProjects]);

  function handleStatusChange(project_id) {
    const current = projectStatuses[project_id] || 'To Do';
    let nextStatus;

    if (current === 'To Do') nextStatus = 'In Progress';
    else if (current === 'In Progress') nextStatus = 'Completed';
    else nextStatus = 'To Do';

    axios.patch(`http://localhost:3000/projects/${project_id}/status`, 
      { status: nextStatus }, 
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    )
      .then(() => {
        setProjectStatuses(prev => ({ ...prev, [project_id]: nextStatus }));
        fetchProjectData();
        if (nextStatus === 'Completed') {
          navigate('/history');
        }
      })
      .catch(err => {
        console.error('Error updating project status:', err);
        alert('Failed to update project status');
      });
  }

  function handleDelete(project_id) {
    axios.delete('http://localhost:3000/projects', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      data: { project_id },
    })
      .then((res) => {
        console.log(res.data.message);
        fetchProjectData();
      })
      .catch((err) => {
        console.error('Project deletion error:', err);
      });
  }

  const onSubmit = (data) => {
    if (!loggedInUser) {
      alert('No user logged in');
      return;
    }

    const payload = {
      project_name: data.projectName,
      description: data.description,
      user_id: loggedInUser.id,
    };

    axios.post('http://localhost:3000/projects', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => {
        setShowModal(false);
        reset();
        fetchProjectData();
      })
      .catch((err) => {
        console.error('Project creation error:', err);
        alert('Failed to create project.');
      });
  };

  const filteredProjects = groupedProjects
    ? groupedProjects.filter(project =>
        project?.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  if (!groupedProjects) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme === 'dark' ? 'bg-dark' : 'bg-light'} min-vh-100 d-flex`}>
      <Sidebar />
      <div className={`main-content flex-grow-1 d-flex flex-column${collapsed ? ' collapsed' : ''}`}>
        <Navbar />
        <div className="container py-5">
          <div className="d-flex align-items-center mb-2 gap-3">
            <div className={`rounded-circle d-flex justify-content-center align-items-center ${theme === 'dark' ? 'bg-secondary' : 'bg-primary'}`} style={{ width: 48, height: 48 }}>
              <BsFolder className="text-white" size={28} />
            </div>
            <h1 className={`fw-bold mb-0 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Projects</h1>
            {loggedInUser.type === 'PM' && (
              <button
                className={`btn ms-auto fw-bold ${theme === 'dark' ? 'btn-light text-dark' : 'btn-primary'}`}
                style={{ marginLeft: 'auto' }}
                onClick={() => setShowModal(true)}
              >
                Add Project
              </button>
            )}
          </div>

          {showModal && (
            <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered">
                <div className={`modal-content ${theme === 'dark' ? 'bg-dark text-white' : ''}`}>
                  <div className="modal-header">
                    <h5 className="modal-title fw-bold">Create New Project</h5>
                    <button type="button" className={`btn-close ${theme === 'dark' ? 'btn-close-white' : "" }`} aria-label="Close" onClick={() => { setShowModal(false); reset(); }}></button>
                  </div>
                  <div className="modal-body">
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                      <div className="mb-3">
                        <label className={`form-label fw-semibold ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>Project Name</label>
                        <input
                          {...register('projectName')}
                          type="text"
                          className={`form-control rounded-3 shadow-sm ${errors.projectName ? 'is-invalid' : ''} ${theme === 'dark' ? 'bg-dark text-white border-secondary dark-placeholder' : 'light-placeholder'}`}
                          placeholder="Enter project name"
                          style={{
                            backgroundColor: theme === 'dark' ? '#343a40' : '#f8f9fa',
                            borderColor: theme === 'dark' ? '#495057' : '#ced4da',
                          }}
                        />
                        {errors.projectName && (
                          <div className="invalid-feedback">{errors.projectName.message}</div>
                        )}
                      </div>
                      <div className="mb-3">
                        <label className={`form-label fw-semibold ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>Description</label>
                        <textarea
                          {...register('description')}
                          rows={3}
                          className={`form-control rounded-3 shadow-sm ${errors.description ? 'is-invalid' : ''} ${theme === 'dark' ? 'bg-dark text-white border-secondary dark-placeholder' : 'light-placeholder'}`}
                          placeholder="Briefly describe your project"
                          style={{
                            backgroundColor: theme === 'dark' ? '#343a40' : '#f8f9fa',
                            borderColor: theme === 'dark' ? '#495057' : '#ced4da',
                            resize: 'none',
                          }}
                        />
                        {errors.description && (
                          <div className="invalid-feedback">{errors.description.message}</div>
                        )}
                      </div>
                      <div className="d-grid">
                        <button
                          type="submit"
                          className={`btn fw-bold py-2 rounded-3 ${theme === 'dark' ? 'btn-light text-dark' : 'btn-primary'}`}
                        >
                          Create Project
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="row g-4 mt-2 justify-content-start">
            {filteredProjects.length === 0 ? (
              <div className="col-12 d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
                <div className={`card shadow-sm p-4 rounded-4 text-center w-100 ${theme === 'dark' ? 'bg-secondary text-white' : 'bg-white text-dark'}`} style={{ maxWidth: 420 }}>
                  <BsFolder size={40} className={`mb-3 ${theme === "dark" ? 'text-white' : 'text-primary'}`} />
                  <h4 className="fw-bold mb-2">No Projects Found</h4>
                  <p className="mb-0">You have not created any projects yet.</p>
                </div>
              </div>
            ) : (
              <div className="row g-4 justify-content-start">
                {filteredProjects.map((project, index) => (
                  <div key={index} className="col-12 col-md-6 col-lg-4 d-flex">
                    <div className={`card shadow-lg w-100 flex-fill project-card border overflow-hidden ${
                      theme === 'dark' ? 'bg-dark' : 'bg-white'
                    }`} style={{ 
                      borderRadius: '12px', 
                      transition: 'all 0.3s ease',
                      backgroundColor: theme === 'dark' ? '#1a1d23' : '#ffffff',
                      border: theme === 'dark' ? '1px solid #333741' : '1px solid #e9ecef',
                      boxShadow: theme === 'dark' 
                        ? '0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.4)' 
                        : '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div className={`card-header border-0 text-center py-2 ${
                        theme === 'dark' 
                          ? 'bg-gradient' 
                          : 'bg-primary bg-gradient'
                      }`} style={{
                        background: theme === 'dark' 
                          ? 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)' 
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderBottom: theme === 'dark' ? '1px solid #4b5563' : 'none'
                      }}>
                        <h6 className="card-title text-white fw-bold mb-0">
                          {project.project_name}
                        </h6>
                      </div>

                      <div className="card-body d-flex flex-column p-3">
                        <div className="mb-2">
                          <p className={`card-text mb-0 ${
                            theme === 'dark' ? 'text-light' : 'text-dark'
                          }`} style={{ fontSize: '0.9rem', color: theme === 'dark' ? '#e5e7eb' : '#212529' }}>
                            <small className={`fw-semibold ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>Description:</small> {project.description}
                          </p>
                        </div>

                        <div className="mb-2">
                          <p className={`mb-0 ${
                            theme === 'dark' ? 'text-light' : 'text-dark'
                          }`} style={{ fontSize: '0.9rem', color: theme === 'dark' ? '#e5e7eb' : '#212529' }}>
                            <small className={`fw-semibold ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>Active Sprint:</small> 
                            <span className="ms-1">
                              {project.active_sprint
                                ? (sprints.find(s => String(s.sprint_id) === String(project.active_sprint))?.name || project.active_sprint)
                                : 'Not assigned'
                              }
                            </span>
                          </p>
                        </div>

                        <div className="mb-3 text-center">
                          <span className={`badge rounded-pill fw-semibold px-2 py-1 ${
                            (projectStatuses[project.project_id] === 'Completed')
                              ? 'bg-success text-white'
                              : (projectStatuses[project.project_id] === 'In Progress')
                              ? 'bg-warning text-dark'
                              : 'bg-secondary text-white'
                          }`} style={{
                            fontSize: '0.8rem',
                            minWidth: '80px',
                            boxShadow: theme === 'dark' ? '0 2px 4px rgba(0,0,0,0.4)' : '0 1px 2px rgba(0,0,0,0.1)'
                          }}>
                            {projectStatuses[project.project_id]
                              ? projectStatuses[project.project_id].charAt(0).toUpperCase() + projectStatuses[project.project_id].slice(1)
                              : 'To Do'
                            }
                          </span>
                        </div>

                        {loggedInUser.type === 'PM' && (
                          <div className="mt-auto">
                            <div className="d-flex gap-2">
                              <button
                                className={`btn btn-sm flex-fill ${
                                  theme === 'dark' 
                                    ? 'btn-outline-light' 
                                    : 'btn-outline-primary'
                                }`}
                                onClick={() => handleStatusChange(project.project_id)}
                                style={{ fontSize: '0.8rem' }}
                              >
                                Change Status
                              </button>
                              
                              <button
                                className="btn btn-outline-danger btn-sm flex-fill"
                                onClick={() => handleDelete(project.project_id)}
                                style={{ fontSize: '0.8rem' }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProject;
