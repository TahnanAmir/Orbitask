import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { BsFlag, BsTrash } from 'react-icons/bs';
import './Projects.css'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const schema = yup.object().shape({
  name: yup.string().required('Sprint name is required'),
  description: yup.string(),
  startDate: yup.date().required('Start date is required'),
  completionDate: yup.date().min(yup.ref('startDate'), 'Completion date can’t be before start date').required('Completion date is required'),
  projectId: yup.string().required('Project is required'),
  teamLead: yup.string().required('Team Lead is required'),
});

const Sprints = () => {
  const theme = useSelector((state) => state.theme.mode);
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const [sprints, setSprints] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teamLead, setTeamLead] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sprintTasks, setSprintTasks] = useState({});
  const [developers, setDevelopers] = useState([]);
  const [sprintStatuses, setSprintStatuses] = useState({});
  const [taskStatuses, setTaskStatuses] = useState({});

  const [editSprintModal, setEditSprintModal] = useState({ open: false, sprint: null });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addProjects, setAddProjects] = useState([]);
  const [addTeamLead, setAddTeamLead] = useState([]);
  const [editTaskModal, setEditTaskModal] = useState({ open: false, sprintId: null, task: null });
  const [editForm, setEditForm] = useState({});
  const [pendingEdits, setPendingEdits] = useState([]);

  const navigate = useNavigate();

  const fetchPendingEdits = () => {
    if (!token) return;

    axios
      .get('http://localhost:3000/my-pending-edits', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setPendingEdits(res.data);
      })
      .catch((err) => {
        console.error('Error fetching pending edits:', err);
        setPendingEdits([]);
      });
  };

  useEffect(() => {
    fetchPendingEdits();
  }, [token]);

  const isSprintPending = sprintId => pendingEdits.some(e => e.type === 'sprint' && String(e.entity_id) === String(sprintId) && e.status === 'pending');
  const isTaskPending = taskId => pendingEdits.some(e => e.type === 'task' && String(e.entity_id) === String(taskId) && e.status === 'pending');

  const openEditSprint = sprint => {
    setEditForm({
      name: sprint.name,
      description: sprint.description,
      start_date: sprint.start_date?.slice(0,10),
      completion_date: sprint.completion_date?.slice(0,10),
      team_lead: sprint.team_lead
    });
    setEditSprintModal({ open: true, sprint });
  };
  const closeEditSprint = () => setEditSprintModal({ open: false, sprint: null });
  const handleEditSprintChange = e => setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submitEditSprint = () => {
    const { sprint } = editSprintModal;
    const newData = {
      name: editForm.name,
      description: editForm.description,
      start_date: editForm.start_date,
      completion_date: editForm.completion_date,
      team_lead: editForm.team_lead,
    };

    const reqBody = {
      type: 'sprint',
      entity_id: sprint?.sprint_id,
      new_data: newData,
    };

    console.log('Submitting sprint edit:', reqBody);

    if (!reqBody.type || !reqBody.entity_id || !reqBody.new_data) {
      alert('Missing required fields for sprint edit.');
      return;
    }

    axios
      .post('http://localhost:3000/pending-edit', reqBody, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      .then(() => {
        closeEditSprint();
        fetchSprints();
        fetchPendingEdits();
      })
      .catch((err) => {
        console.error('Error submitting edit:', err);
        alert('Failed to submit edit for approval');
      });
  };

  const openEditTask = (sprintId, task) => {
    setEditForm({
      name: task.name,
      description: task.description,
      developer: task.developers?.[0] || ''
    });
    setEditTaskModal({ open: true, sprintId, task });
  };
  const closeEditTask = () => setEditTaskModal({ open: false, sprintId: null, task: null });
  const handleEditTaskChange = e => setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submitEditTask = () => {
    const { task } = editTaskModal;
    const newData = {
      name: editForm.name,
      description: editForm.description,
      developer: editForm.developer,
    };

    const reqBody = {
      type: 'task',
      entity_id: task?.id,
      new_data: newData,
    };

    if (!task?.id) {
      console.log('Task object missing id:', task);
    }

    console.log('Submitting task edit:', reqBody);

    if (!reqBody.type || !reqBody.entity_id || !reqBody.new_data) {
      alert('Missing required fields for task edit.');
      return;
    }

    axios
      .post('http://localhost:3000/pending-edit', reqBody, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      .then(() => {
        closeEditTask();
        fetchSprints();
        fetchPendingEdits();
      })
      .catch((err) => {
        console.error('Failed to submit task edit:', err);
        alert('Failed to submit edit for approval');
      });
  };
  const collapsed = useSelector((state) => state.sidebar.isCollapsed);
  const searchQuery = useSelector((state) => state.search.query);

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    formState: { errors: errorsAdd }
  } = useForm({
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    if (!showAddModal) return;

    const fetchProjects = axios.get('http://localhost:3000/projects', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const fetchTeamLead = axios.get('http://localhost:3000/teamlead');

    Promise.all([fetchProjects, fetchTeamLead])
      .then(([projectsRes, teamLeadRes]) => {
        const data = projectsRes.data;
        const unique = {};
        data.forEach(row => {
          if (!unique[row['project-id']]) {
            unique[row['project-id']] = {
              project_id: row['project-id'],
              project_name: row.project_name,
            };
          }
        });
        setAddProjects(Object.values(unique));
        setAddTeamLead(teamLeadRes.data);
      })
      .catch(() => {
        setAddProjects([]);
        setAddTeamLead([]);
      });
  }, [showAddModal, token]);

  const onAddSprint = (data) => {
    if (!user) {
      alert('No user logged in');
      return;
    }

    const payload = {
      start_date: data.startDate,
      completion_date: data.completionDate,
      project_id: data.projectId,
      team_lead: data.teamLead,
      name: data.name,
      description: data.description,
    };

    axios.post('http://localhost:3000/sprints', payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      resetAdd();
      setShowAddModal(false);
      fetchSprints();
    })
    .catch((err) => {
      console.error('Sprint addition error:', err);
      alert('Failed to add sprint.');
    });
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get('http://localhost:3000/projects', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;

        const unique = {};
        data.forEach(row => {
          if (!unique[row['project-id']]) {
            unique[row['project-id']] = {
              project_id: row['project-id'],
              project_name: row.project_name,
            };
          }
        });
        setProjects(Object.values(unique));
      } catch (err) {
        setProjects([]);
      }
    };

    const fetchTeamLead = async () => {
      try {
        const res = await axios.get('http://localhost:3000/teamlead');
        setTeamLead(res.data);
      } catch (err) {
        setTeamLead([]);
      }
    };

    Promise.all([fetchProjects(), fetchTeamLead(), fetchSprints()]).then(() =>
      setLoading(false)
    );
  }, [token]);

  useEffect(() => {
    axios.get('http://localhost:3000/developers')
      .then(res => setDevelopers(res.data))
      .catch(() => setDevelopers([]));
  }, []);

  useEffect(() => {
    if (sprints.length === 0) return;

    const fetchAllSprintTasks = async () => {
      const tasksObj = {};

      for (const sprint of sprints) {
        try {
          const res = await axios.get(`http://localhost:3000/sprint-tasks/${sprint.sprint_id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          const data = res.data;

          const grouped = {};
          data.forEach(task => {
            const key = `${task.name}|||${task.description}`;
            if (!grouped[key]) {
              grouped[key] = {
                id: task.id || task.task_id,
                name: task.name,
                description: task.description,
                developers: [],
                status: task.status
              };
            }
            grouped[key].developers.push(task.developer);
          });

          tasksObj[sprint.sprint_id] = Object.values(grouped);
        } catch {
          tasksObj[sprint.sprint_id] = [];
        }
      }

      setSprintTasks(tasksObj);
    };

    fetchAllSprintTasks();
  }, [sprints, token]);

  useEffect(() => {
    if (sprints) {
      const newStatuses = {};
      sprints.forEach(s => {
        newStatuses[s.sprint_id] = s.status || 'To Do';
      });
      setSprintStatuses(newStatuses);
    }
  }, [sprints]);

  useEffect(() => {
    if (sprintTasks) {
      const newTaskStatuses = {};
      Object.entries(sprintTasks).forEach(([sprintId, tasks]) => {
        newTaskStatuses[sprintId] = {};
        tasks.forEach(task => {
          const key = `${task.name}|||${task.description}`;
          newTaskStatuses[sprintId][key] = task.status || 'To Do';
        });
      });
      setTaskStatuses(newTaskStatuses);
    }
  }, [sprintTasks]);

  function handleSprintStatusChange(sprint_id) {
    const current = sprintStatuses[sprint_id] || 'To Do';
    let nextStatus;
    if (current === 'To Do') nextStatus = 'In Progress';
    else if (current === 'In Progress') nextStatus = 'Completed';
    else nextStatus = 'To Do';

    axios.patch(`http://localhost:3000/sprints/${sprint_id}/status`, 
      { status: nextStatus }, 
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      }
    )
    .then(() => {
      setSprintStatuses(prev => ({ ...prev, [sprint_id]: nextStatus }));
      fetchSprints();
      if (nextStatus === 'Completed') {
        navigate(`/history`);
      }
    })
    .catch(() => {
      alert('Failed to update sprint status');
    });
  }
  function handleTaskStatusChange(sprint_id, taskKey) {
    const current = taskStatuses[sprint_id]?.[taskKey] || 'To Do';
    let nextStatus;
    if (current === 'To Do') nextStatus = 'In Progress';
    else if (current === 'In Progress') nextStatus = 'Completed';
    else nextStatus = 'To Do';

    const [name] = taskKey.split('|||');

    axios.patch(
      `http://localhost:3000/sprint-tasks/${sprint_id}/${encodeURIComponent(name)}/status`,
      { status: nextStatus },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      }
    )
    .then(() => {
      setTaskStatuses(prev => {
        const next = { ...prev };
        if (!next[sprint_id]) next[sprint_id] = {};
        next[sprint_id][taskKey] = nextStatus;
        return { ...next };
      });
      fetchSprints();
      if (nextStatus === 'Completed') {
        navigate(`/history`);
      }
    })
    .catch(() => {
      alert('Failed to update task status');
    });
  }

  const fetchSprints = async () => {
    try {
      const res = await axios.get('http://localhost:3000/sprints', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setSprints(res.data);
    } catch (err) {
      setSprints([]);
    }
  };

  const onSubmit = (data) => {
    if (!user) {
      alert('No user logged in');
      return;
    }

    const payload = {
      start_date: data.startDate,
      completion_date: data.completionDate,
      project_id: data.projectId,
      team_lead: data.teamLead,
      name: data.name,
      description: data.description,
    };

    axios.post('http://localhost:3000/sprints', payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    .then(response => {
      console.log('Sprint added:', response.data);
      reset();
      fetchSprints();
    })
    .catch(error => {
      console.error('Sprint addition error:', error);
    });
  };

  function handleDelete(sprint_id) {
    axios.delete('http://localhost:3000/sprints', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      data: { sprint_id }
    })
    .then(response => {
      console.log(response.data.message);
      fetchSprints();
    })
    .catch(error => {
      console.error('Sprint deletion error:', error);
    });
  }

  const filteredSprints = sprints.filter(item => {
    const projectName = projects.find(p => p.project_id === item.project_id)?.project_name || '';
    const teamLeadName = teamLead?.find(t => String(t.id) === String(item.team_lead))?.username || '';
    return (
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teamLeadName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className={`${theme === 'dark' ? 'bg-dark' : 'bg-light'} min-vh-100 d-flex`}>
      <Sidebar />
      <div className={`main-content flex-grow-1 d-flex flex-column${collapsed ? ' collapsed' : ''}`}>
        <Navbar />
        <div className="container py-5">
          <div className="d-flex align-items-center mb-4 gap-3">
            <div className={`rounded-circle d-flex justify-content-center align-items-center ${theme === 'dark' ? 'bg-secondary' : 'bg-primary'}`} style={{ width: 48, height: 48 }}>
              <BsFlag className="text-white" size={28} />
            </div>
            <h1 className={`fw-bold mb-0 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Sprints</h1>
            {user.type === 'PM' && (
              <button
                className={`btn ms-auto fw-bold ${theme === 'dark' ? 'btn-light text-dark' : 'btn-primary'}`}
                style={{ marginLeft: 'auto' }}
                onClick={() => setShowAddModal(true)}
              >
                Add Sprint
              </button>
            )}
          </div>

          {showAddModal && (
            <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className={`modal-content ${theme === 'dark' ? 'bg-dark text-white' : ''}`}>
                  <div className="modal-header">
                    <h5 className="modal-title fw-bold">Add Sprint</h5>
                    <button type="button" className={`btn-close ${theme === 'dark' ? 'btn-close-white' : ''}`} aria-label="Close" onClick={() => { setShowAddModal(false); resetAdd(); }}></button>
                  </div>
                  <div className="modal-body">
                    <form onSubmit={handleSubmitAdd(onAddSprint)}>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">Name</label>
                          <input
                            {...registerAdd('name')}
                            className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-secondary dark-placeholder' : 'light-placeholder'} ${errorsAdd.name ? 'is-invalid' : ''}`}
                            placeholder="Enter sprint name"
                            style={{ backgroundColor: theme === 'dark' ? '#343a40' : '#f8f9fa', borderColor: theme === 'dark' ? '#495057' : '#dee2e6' }}
                          />
                          <div className="invalid-feedback">{errorsAdd.name?.message}</div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">Project</label>
                          <select
                            {...registerAdd('projectId')}
                            className={`form-select ${theme === 'dark' ? 'bg-dark text-white border-secondary' : ''} ${errorsAdd.projectId ? 'is-invalid' : ''}`}
                            style={{ backgroundColor: theme === 'dark' ? '#343a40' : '#f8f9fa', borderColor: theme === 'dark' ? '#495057' : '#dee2e6' }}
                          >
                            <option value="">Select Project</option>
                            {addProjects && addProjects.map((proj) => (
                              <option key={proj.project_id} value={proj.project_id}>{proj.project_name}</option>
                            ))}
                          </select>
                          <div className="invalid-feedback">{errorsAdd.projectId?.message}</div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">Start Date</label>
                          <input
                            {...registerAdd('startDate')}
                            type="date"
                            className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-secondary' : ''} ${errorsAdd.startDate ? 'is-invalid' : ''}`}
                            style={{ backgroundColor: theme === 'dark' ? '#343a40' : '#f8f9fa', borderColor: theme === 'dark' ? '#495057' : '#dee2e6' }}
                          />
                          <div className="invalid-feedback">{errorsAdd.startDate?.message}</div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">Completion Date</label>
                          <input
                            {...registerAdd('completionDate')}
                            type="date"
                            className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-secondary' : ''} ${errorsAdd.completionDate ? 'is-invalid' : ''}`}
                            style={{ backgroundColor: theme === 'dark' ? '#343a40' : '#f8f9fa', borderColor: theme === 'dark' ? '#495057' : '#dee2e6' }}
                          />
                          <div className="invalid-feedback">{errorsAdd.completionDate?.message}</div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Description</label>
                        <textarea
                          {...registerAdd('description')}
                          className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-secondary dark-placeholder' : 'light-placeholder'} ${errorsAdd.description ? 'is-invalid' : ''}`}
                          placeholder="Enter description"
                          rows={3}
                          style={{ backgroundColor: theme === 'dark' ? '#343a40' : '#f8f9fa', borderColor: theme === 'dark' ? '#495057' : '#dee2e6' }}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Team Lead</label>
                        <select
                          {...registerAdd('teamLead')}
                          className={`form-select ${theme === 'dark' ? 'bg-dark text-white border-secondary' : ''} ${errorsAdd.teamLead ? 'is-invalid' : ''}`}
                          style={{ backgroundColor: theme === 'dark' ? '#343a40' : '#f8f9fa', borderColor: theme === 'dark' ? '#495057' : '#dee2e6' }}
                        >
                          <option value="">Select Team Lead</option>
                          {addTeamLead && addTeamLead.map((r) => (
                            <option key={r['id']} value={r['id']}>
                              {r.username}
                            </option>
                          ))}
                        </select>
                        <div className="invalid-feedback">{errorsAdd.teamLead?.message}</div>
                      </div>
                      <button type="submit" className={`btn w-100 fw-bold py-2 ${theme === 'dark' ? 'btn-light text-black' : 'btn-primary'}`}>Add Sprint</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="row g-4 mt-2 justify-content-start">
            {filteredSprints.map(item => (
              <div className="col-12 col-md-6 col-lg-4 d-flex" key={item.sprint_id}>
                <div
                  className={`card shadow-lg w-100 flex-fill project-card border overflow-hidden ${
                    theme === 'dark' ? 'bg-dark text-white' : 'bg-white text-dark'
                  }`}
                  style={{
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    backgroundColor: theme === 'dark' ? '#1a1d23' : '#ffffff',
                    border: theme === 'dark' ? '1px solid #333741' : '1px solid #e9ecef',
                    boxShadow: theme === 'dark'
                      ? '0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.4)'
                      : '0 2px 4px rgba(0, 0, 0, 0.1)',
                    minHeight: 260
                  }}
                >
                  <div
                    className={`card-header border-0 text-center py-2 ${
                      theme === 'dark' ? 'bg-gradient' : 'bg-primary bg-gradient'
                    }`}
                    style={{
                      background: theme === 'dark'
                        ? 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderBottom: theme === 'dark' ? '1px solid #4b5563' : 'none'
                    }}
                  >
                    <h6 className="card-title text-white fw-bold mb-0">
                      {item.name}
                    </h6>
                  </div>

                  <div className="card-body d-flex flex-column p-3">
                    <p className="mb-1"><strong>Project:</strong> {projects.find(p => p.project_id === item.project_id)?.project_name || item.project_id}</p>
                    <p className="mb-1">
                      <strong>Team Lead:</strong>{' '}
                      {teamLead?.find(t => String(t.id) === String(item.team_lead))?.username || 'Unknown'}
                    </p>
                    <p className="mb-1"><strong>Start:</strong> {new Date(item.start_date).toLocaleDateString()}</p>
                    <p className="mb-1"><strong>End:</strong> {new Date(item.completion_date).toLocaleDateString()}</p>
                    <p className="flex-grow-1 mb-3" style={{ opacity: 0.92 }}><strong>Description:</strong> {item.description || 'No description available.'}</p>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="d-flex align-items-center gap-2">
                        <strong>Status:</strong>
                        <span
                          className={`badge rounded-pill fw-semibold px-2 py-1 ${
                            sprintStatuses[item.sprint_id] === 'Completed'
                              ? 'bg-success text-white'
                              : sprintStatuses[item.sprint_id] === 'In Progress'
                                ? 'bg-info text-dark'
                                : theme === 'dark'
                                  ? 'text-white bg-secondary'
                                  : 'bg-secondary text-white'
                          }`}
                          style={{
                            fontSize: '0.85rem',
                            minWidth: 70,
                            textAlign: 'center',
                            backgroundColor: theme === 'dark' && (!sprintStatuses[item.sprint_id] || sprintStatuses[item.sprint_id] === 'To Do') ? '#000' : undefined
                          }}
                        >
                          {sprintStatuses[item.sprint_id] || 'To Do'}
                        </span>
                      </span>
                      {user.type === 'PM' && (
                        <span className="d-flex gap-2">
                          <button
                            className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-primary'}`}
                            onClick={() => handleSprintStatusChange(item.sprint_id)}
                            style={{ fontSize: '0.8rem' }}
                          >
                            Change Status
                          </button>
                          <button
                            className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-warning text-warning' : 'btn-outline-warning'}`}
                            onClick={() => openEditSprint(item)}
                            disabled={isSprintPending(item.sprint_id)}
                            style={{ fontSize: '0.8rem' }}
                          >
                            Edit
                          </button>
                        </span>
                      )}
                    </div>

                    {isSprintPending(item.sprint_id) && (
                      <span className="badge bg-warning text-dark mb-3 align-self-start">Pending Approval</span>
                    )}

                    <div className="mb-2">
                      <h6 className='fw-bold fs-5 mb-2'>Tasks:</h6>
                      {sprintTasks[item.sprint_id]?.length > 0 ? (
                        <ul className="list-unstyled mb-0">
                          {sprintTasks[item.sprint_id].map(task => {
                            const taskKey = `${task.name}|||${task.description}`;
                            const taskId = task.id || task.task_id;
                            return (
                              <li key={taskKey} className="mb-3">
                                <strong>{task.name}</strong> – {task.description}<br />
                                <span><strong>Developers:</strong> {task.developers.map(devId => {
                                  const dev = developers.find(d => String(d.id) === String(devId));
                                  return dev ? (
                                    <span key={devId} className={`badge rounded-pill me-1 ${theme === 'dark' ? 'bg-primary text-white' : 'bg-primary'}`}>
                                      {dev.username}
                                    </span>
                                  ) : devId;
                                })}</span>
                                <div className='mt-2 d-flex justify-content-between align-items-center'>
                                  <span className="d-flex align-items-center gap-2">
                                    <strong>Status:</strong>
                                    <span
                                      className={`badge rounded-pill fw-semibold px-2 py-1 ${
                                        taskStatuses[item.sprint_id]?.[taskKey] === 'Completed'
                                          ? 'bg-success text-white'
                                          : taskStatuses[item.sprint_id]?.[taskKey] === 'In Progress'
                                            ? 'bg-info text-dark'
                                            : theme === 'dark'
                                              ? 'text-white'
                                              : 'bg-secondary text-white'
                                      }`}
                                      style={{
                                        fontSize: '0.8rem',
                                        minWidth: 70,
                                        backgroundColor: theme === 'dark' && (!taskStatuses[item.sprint_id]?.[taskKey] || taskStatuses[item.sprint_id]?.[taskKey] === 'To Do') ? '#000' : undefined
                                      }}
                                    >
                                      {taskStatuses[item.sprint_id]?.[taskKey] || 'Unknown'}
                                    </span>
                                  </span>
                                  {user.type !== 'AD' && (
                                    <div className="d-flex gap-1">
                                      <button
                                        className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-primary'}`}
                                        onClick={() => handleTaskStatusChange(item.sprint_id, taskKey)}
                                        style={{ fontSize: '0.75rem' }}
                                      >
                                        Change Status
                                      </button>
                                      <button
                                        className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-warning text-warning' : 'btn-outline-warning'}`}
                                        onClick={() => openEditTask(item.sprint_id, { ...task, id: taskId })}
                                        disabled={isTaskPending(taskId)}
                                        style={{ fontSize: '0.75rem' }}
                                      >
                                        Edit
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {isTaskPending(taskId) && (
                                  <span className="badge bg-warning text-dark mt-2 d-inline-block">Pending Approval</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="text-muted">No tasks in this sprint.</div>
                      )}
                    </div>

                    {user.type === 'PM' && (
                      <div className="d-flex justify-content-center gap-2 mt-3">
                        <button
                          className={`btn btn-sm d-flex align-items-center gap-1 ${theme === 'dark' ? 'btn-outline-danger' : 'btn-outline-danger'}`}
                          title="Delete"
                          onClick={() => handleDelete(item.sprint_id)}
                          style={{ fontSize: '0.8rem' }}
                        >
                          <BsTrash /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
      {editSprintModal.open && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Sprint (Pending Approval)</h5>
                <button type="button" className="btn-close" onClick={closeEditSprint}></button>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Name</label>
                  <input className="form-control" name="name" value={editForm.name || ''} onChange={handleEditSprintChange} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" name="description" value={editForm.description || ''} onChange={handleEditSprintChange} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-control" name="start_date" value={editForm.start_date || ''} onChange={handleEditSprintChange} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Completion Date</label>
                  <input type="date" className="form-control" name="completion_date" value={editForm.completion_date || ''} onChange={handleEditSprintChange} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Team Lead</label>
                  <select className="form-select" name="team_lead" value={editForm.team_lead || ''} onChange={handleEditSprintChange}>
                    <option value="">Select Team Lead</option>
                    {teamLead.map(tl => <option key={tl.id} value={tl.id}>{tl.username}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeEditSprint}>Cancel</button>
                <button className="btn btn-primary" onClick={submitEditSprint}>Submit for Approval</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editTaskModal.open && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Task (Pending Approval)</h5>
                <button type="button" className="btn-close" onClick={closeEditTask}></button>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Name</label>
                  <input className="form-control" name="name" value={editForm.name || ''} onChange={handleEditTaskChange} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" name="description" value={editForm.description || ''} onChange={handleEditTaskChange} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Developer</label>
                  <select className="form-select" name="developer" value={editForm.developer || ''} onChange={handleEditTaskChange}>
                    <option value="">Select Developer</option>
                    {developers.map(dev => <option key={dev.id} value={dev.id}>{dev.username}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeEditTask}>Cancel</button>
                <button className="btn btn-primary" onClick={submitEditTask}>Submit for Approval</button>
              </div>
            </div>
          </div>
        </div>
      )}
            {filteredSprints.length === 0 && !loading && (
              <div className="col-12 d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
                <div className={`card shadow-sm p-4 rounded-4 text-center w-100 ${theme === 'dark' ? 'bg-secondary text-white' : 'bg-white text-dark'}`} style={{ maxWidth: 420 }}>
                  <BsFlag size={40} className={`mb-3 ${theme === "dark" ? 'text-white' : 'text-primary'}`} />
                  <h4 className="fw-bold mb-2">No Sprints Found</h4>
                  <p className="mb-0">You have not created any sprints yet.</p>
                </div>
              </div>
            )}
            {loading && (
              <div className="col-12 d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sprints;
