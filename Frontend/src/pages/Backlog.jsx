import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BsListCheck, BsTrash, BsArrowRight } from 'react-icons/bs';
import './Projects.css';
import axios from 'axios';

const schema = yup.object().shape({
  name: yup.string().required('Backlog name is required'),
  description: yup.string().required('Description is required'),
});

const Backlog = () => {
  const theme = useSelector((state) => state.theme.mode);
  const [backlogItems, setBacklogItems] = useState([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [developers, setDevelopers] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedDevelopers, setSelectedDevelopers] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState('');

  const navigate = useNavigate();

  const loggedInUser = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const searchQuery = useSelector((state) => state.search.query);

  const collapsed = useSelector((state) => state.sidebar.isCollapsed);

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    formState: { errors: errorsAdd }
  } = useForm({
    resolver: yupResolver(schema)
  });

  const onAddBacklog = (data) => {
    const payload = {
      name: data.name,
      description: data.description,
    };

    axios.post('http://localhost:3000/backlog', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    })
    .then((res) => {
      resetAdd();
      setShowAddModal(false);
      fetchBacklogData();
    })
    .catch((err) => {
      console.error('Backlog addition error:', err);
      alert('Failed to add backlog item.');
    });
  };

  const fetchBacklogData = async () => {
    try
    {
      const response = await axios.get('http://localhost:3000/backlog', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setBacklogItems(response.data);
    }
    catch (error)
    {
      console.error('Backlog fetch error:', error);
      alert('Failed to fetch backlog data. Please login again.');
      navigate('/login');
    }
  };

  useEffect(() => {
    if (!loggedInUser)
    {
      alert('No user logged in');
      navigate('/login');
      return;
    }

    fetchBacklogData();
  }, [loggedInUser, navigate]);


  useEffect(() => {
    if (!loggedInUser) return;

    axios.get('http://localhost:3000/developers')
      .then(res => setDevelopers(res.data))
      .catch(() => setDevelopers([]));

    axios.get('http://localhost:3000/sprints', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => setSprints(res.data))
      .catch(() => setSprints([]));
  }, [loggedInUser, token]);

  function handleDelete(task_id) {
    axios.delete('http://localhost:3000/backlog', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      data: { task_id }
    })
      .then(response => {
        console.log(response.data.message);
        fetchBacklogData();
      })
      .catch(error => {
        console.error('Backlog deletion error:', error);
        alert('Failed to delete backlog item.');
      });
  }

  function handleMove(task_id) {
    setSelectedTaskId(task_id);
    setShowMoveModal(true);
  }

  function handleMoveConfirm() {
    if (!selectedDevelopers.length || !selectedSprint) {
      alert('Please select at least one developer and a sprint.');
      return;
    }

    const selectedTask = backlogItems.find(i => i.task_id === selectedTaskId);

    axios.post('http://localhost:3000/task', {
      task_id: selectedTaskId,
      name: selectedTask?.name,
      description: selectedTask?.description,
      developers: selectedDevelopers,
      sprint_id: selectedSprint,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(() => {
        setShowMoveModal(false);
        setSelectedTaskId(null);
        setSelectedDevelopers([]);
        setSelectedSprint('');
        fetchBacklogData();
      })
      .catch((err) => {
        console.error('Task move error:', err);
        alert('Failed to move task.');
        setShowMoveModal(false);
      });
  }

  const filteredBacklogItems = backlogItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={`${theme === 'dark' ? 'bg-dark' : 'bg-light'} min-vh-100 d-flex`}>
      <Sidebar />
      <div className={`main-content flex-grow-1 d-flex flex-column${collapsed ? ' collapsed' : ''}`}>
        <Navbar />
        <div className="container py-5">
          <div className="d-flex align-items-center mb-4 gap-3">
            <div className={`rounded-circle d-flex justify-content-center align-items-center ${theme === 'dark' ? 'bg-secondary' : 'bg-primary'}`} style={{ width: 48, height: 48 }}>
              <BsListCheck className="text-white" size={28} />
            </div>
            <h1 className={`fw-bold mb-0 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Backlog</h1>
            {loggedInUser.type === 'PM' && (
              <button
                className={`btn ms-auto fw-bold ${theme === 'dark' ? 'btn-light text-dark' : 'btn-primary'}`}
                style={{ marginLeft: 'auto' }}
                onClick={() => setShowAddModal(true)}
              >
                Add Backlog
              </button>
            )}
          </div>

          

          <Modal show={showAddModal} onHide={() => { setShowAddModal(false); resetAdd(); }} centered>
            <Modal.Header className={theme === 'dark' ? 'bg-dark text-white' : 'bg-light text-dark'}>
              <Modal.Title>Add Backlog Item</Modal.Title>
                <button
                  type="button"
                  className={`btn-close ${theme === 'dark' ? 'btn-close-white' : ''}`}
                  aria-label="Close"
                  onClick={() => setShowAddModal(false)}
                ></button>
            </Modal.Header>
            <Modal.Body className={theme === 'dark' ? 'bg-dark text-white' : 'bg-light text-dark'}>
              <form onSubmit={handleSubmitAdd(onAddBacklog)}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Name</label>
                  <input
                    {...registerAdd('name')}
                    className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-secondary dark-placeholder' : 'light-placeholder'} ${errorsAdd.name ? 'is-invalid' : ''}`}
                    placeholder="Enter backlog name"
                    style={{
                      backgroundColor: theme === 'dark' ? '#343a40' : '#f8f9fa',
                      borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                    }}
                  />
                  <div className="invalid-feedback">{errorsAdd.name?.message}</div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea
                    {...registerAdd('description')}
                    className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-secondary dark-placeholder' : 'light-placeholder'} ${errorsAdd.description ? 'is-invalid' : ''}`}
                    placeholder="Enter description"
                    rows={3}
                    style={{
                      backgroundColor: theme === 'dark' ? '#343a40' : '#f8f9fa',
                      borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                    }}
                  />
                  <div className="invalid-feedback">{errorsAdd.description?.message}</div>
                </div>
                <button type="submit" className={`btn w-100 fw-bold py-2 ${theme === 'dark' ? 'btn-light text-black' : 'btn-primary'}`}>Add Backlog</button>
              </form>
            </Modal.Body>
          </Modal>
          <div className="row g-4 mt-2 justify-content-start">
            {filteredBacklogItems.map(item => (
              <div className="col-12 col-md-6 col-lg-4 d-flex" key={item.task_id}>
                <div
                  className={`card shadow-lg w-100 flex-fill project-card border overflow-hidden ${
                    theme === 'dark' ? 'bg-dark' : 'bg-white'
                  }`}
                  style={{
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    backgroundColor: theme === 'dark' ? '#1a1d23' : '#ffffff',
                    border: theme === 'dark' ? '1px solid #333741' : '1px solid #e9ecef',
                    boxShadow: theme === 'dark'
                      ? '0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.4)'
                      : '0 2px 4px rgba(0, 0, 0, 0.1)',
                    // minHeight: 220
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
                    <p
                      className={`card-text text-center mb-3 ${
                        theme === 'dark' ? 'text-light' : 'text-dark'
                      }`}
                      style={{
                        fontSize: '0.9rem',
                        opacity: 0.92,
                        color: theme === 'dark' ? '#e5e7eb' : '#212529'
                      }}
                    >
                      {item.description}
                    </p>

                    {loggedInUser.type === 'PM' && (
                      <div className="mt-auto text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            className={`btn btn-sm d-flex align-items-center gap-1 ${
                              theme === 'dark' ? 'btn-outline-light' : 'btn-outline-danger'
                            }`}
                            title="Delete"
                            onClick={() => handleDelete(item.task_id)}
                            style={{ fontSize: '0.8rem' }}
                          >
                            <BsTrash /> Delete
                          </button>
                          <button
                            className={`btn btn-sm d-flex align-items-center gap-1 ${
                              theme === 'dark' ? 'btn-outline-warning text-warning' : 'btn-outline-warning'
                            }`}
                            title="Move to Sprint"
                            onClick={() => handleMove(item.task_id)}
                            style={{ fontSize: '0.8rem' }}
                          >
                            <BsArrowRight /> Move
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredBacklogItems.length === 0 && (
              <div className="col-12 d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
                <div className={`card shadow-sm p-4 rounded-4 text-center w-100 ${theme === 'dark' ? 'bg-secondary text-white' : 'bg-white text-dark'}`} style={{ maxWidth: 420 }}>
                  <BsListCheck size={40} className={`mb-3 ${theme === "dark" ? 'text-white' : 'text-primary'}`} />
                  <h4 className="fw-bold mb-2">No Backlog Items</h4>
                  <p className="mb-0">You have not added any backlog items yet.</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <Modal show={showMoveModal} onHide={() => setShowMoveModal(false)} centered>
          <Modal.Header closeButton className={theme === 'dark' ? 'bg-dark text-white' : 'bg-light text-dark'}>
            <Modal.Title>Move Task to Sprint</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === 'dark' ? 'bg-dark text-white' : 'bg-light text-dark'}>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Select Developer(s)</Form.Label>
                <div>
                  {developers.map(dev => (
                    <Form.Check
                      key={dev.id}
                      type="checkbox"
                      id={`dev-checkbox-${dev.id}`}
                      label={dev.username}
                      value={dev.id}
                      checked={selectedDevelopers.includes(dev.id.toString())}
                      onChange={e => {
                        const id = e.target.value;
                        setSelectedDevelopers(prev =>
                          e.target.checked
                            ? [...prev, id]
                            : prev.filter(did => did !== id)
                        );
                      }}
                      className="mb-1"
                    />
                  ))}
                </div>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Select Sprint</Form.Label>
                <Form.Select value={selectedSprint} onChange={e => setSelectedSprint(e.target.value)}>
                  <option value="">Select Sprint</option>
                  {sprints.map(sprint => (
                    <option key={sprint.sprint_id} value={sprint.sprint_id}>{sprint.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className={theme === 'dark' ? 'bg-dark text-white' : 'bg-light text-dark'}>
            <Button variant="secondary" onClick={() => setShowMoveModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleMoveConfirm} className={theme === 'dark' ? 'bg-white text-dark' : 'bg-primary text-white'}>
              Move
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default Backlog;

