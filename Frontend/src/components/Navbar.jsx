import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/authSlice';
import { toggleTheme, resetTheme } from '../features/themeSlice';
import { resetSidebar } from '../features/sidebarSlice';
import { toggleCollapse } from '../features/sidebarSlice';
import { FaBell, FaQuestionCircle, FaCog, FaGem, FaPlus, FaBars } from 'react-icons/fa';
import { useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './Navbar.css'
import { setSearchQuery } from '../features/searchSlice';
import axios from 'axios';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user) || {};
  const username = user.username || '';
  const firstLetter = username.charAt(0).toUpperCase();
  const theme = useSelector((state) => state.theme.mode);
  const sidebarCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const searchQuery = useSelector((state) => state.search.query);

  const [pendingApprovals, setPendingApprovals] = useState([]);
  const userType = useSelector((state) => state.auth.user?.type);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifDropdownRef = useRef();
  const token = useSelector((state) => state.auth.token);

  const [projectResults, setProjectResults] = useState([]);
  const [sprintResults, setSprintResults] = useState([]);
  const [backlogResults, setBacklogResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [allResults, setAllResults] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    if (userType !== 'PM' || !token) return;

    const fetchApprovals = async () => {
      try {
        const response = await axios.get('http://localhost:3000/pending-approvals', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPendingApprovals(response.data);
      } catch (error) {
        setPendingApprovals([]);
      }
    };

    fetchApprovals();
  }, [token, userType, showNotifDropdown]);

  const handleApproval = async (editId, decision) => {
    try {
      await axios.post(`http://localhost:3000/pending-edit/${editId}/decision`, 
        { decision }, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setPendingApprovals(p => p.filter(e => e.id !== editId));

      const notificationsRes = await axios.get('http://localhost:3000/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notificationsRes.data);
    } catch (error) {}
  };

  useEffect(() => {
    if (!token) return;

    axios.get('http://localhost:3000/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setNotifications(res.data))
    .catch(() => setNotifications([]));
  }, [token, showNotifDropdown]);

  const markNotificationRead = (notifId) => {
    axios.patch(`http://localhost:3000/notifications/${notifId}/read`, null, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
      setNotifications(n => n.map(notif =>
        notif.id === notifId ? { ...notif, status: 'read' } : notif
      ));
    });
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  useEffect(() => {
    function handleClick(e) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    }
    if (showNotifDropdown) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifDropdown]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (
      location.pathname === '/projects' ||
      location.pathname === '/sprints' ||
      location.pathname === '/backlog'
    ) {
      setShowDropdown(false);
      return;
    }
    if (!searchQuery) {
      setShowDropdown(false);
      setProjectResults([]);
      setSprintResults([]);
      setBacklogResults([]);
      return;
    }

    const config = { headers: { Authorization: `Bearer ${token}` } };
    const lowerQuery = searchQuery.toLowerCase();

    Promise.all([
      axios.get('http://localhost:3000/projects', config),
      axios.get('http://localhost:3000/sprints', config),
      axios.get('http://localhost:3000/backlog', config),
    ])
      .then(([projectsRes, sprintsRes, backlogRes]) => {
        const projectsData = projectsRes.data;
        const grouped = {};
        projectsData.forEach(row => {
          const key = row.project_name;
          if (!grouped[key]) {
            grouped[key] = {
              project_id: row["project-id"],
              project_name: row.project_name,
              description: row.description,
            };
          }
        });
        const filteredProjects = Object.values(grouped).filter(project =>
          project.project_name.toLowerCase().includes(lowerQuery) ||
          (project.description && project.description.toLowerCase().includes(lowerQuery))
        );
        setProjectResults(filteredProjects);

        const filteredSprints = sprintsRes.data.filter(sprint =>
          sprint.name.toLowerCase().includes(lowerQuery) ||
          (sprint.description && sprint.description.toLowerCase().includes(lowerQuery))
        );
        setSprintResults(filteredSprints);

        const filteredBacklog = backlogRes.data.filter(item =>
          item.name.toLowerCase().includes(lowerQuery) ||
          (item.description && item.description.toLowerCase().includes(lowerQuery))
        );
        setBacklogResults(filteredBacklog);

        setShowDropdown(true);
      })
      .catch(err => {
        setProjectResults([]);
        setSprintResults([]);
        setBacklogResults([]);
        setShowDropdown(false);
        console.error('Search fetch error:', err);
      });

  }, [searchQuery, location.pathname]);


  useEffect(() => {
    const results = [];
    projectResults.forEach(p => results.push({ type: 'project', ...p }));
    sprintResults.forEach(s => results.push({ type: 'sprint', ...s }));
    backlogResults.forEach(b => results.push({ type: 'backlog', ...b }));
    setAllResults(results);
    setHighlightedIndex(results.length > 0 ? 0 : -1);
  }, [projectResults, sprintResults, backlogResults]);

  const handleInputKeyDown = (e) => {
    if (!showDropdown || allResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(idx => (idx + 1) % allResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(idx => (idx - 1 + allResults.length) % allResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < allResults.length) {
        const item = allResults[highlightedIndex];
        handleDropdownClick(item.type, item.project_id || item.sprint_id || item.task_id, item.project_name || item.name);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleDropdownClick = (type, id, name) => {
    if (type === 'project') {
      navigate('/projects');
    } else if (type === 'sprint') {
      navigate('/sprints');
    } else if (type === 'backlog') {
      navigate('/backlog');
    }
    setShowDropdown(false);
  };

  const handleSidebarToggle = () => {
    dispatch(toggleCollapse());
  };

  useEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
  }, [theme]);

  const handleThemeChange = () => {
    dispatch(toggleTheme());
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetSidebar());
    dispatch(resetTheme());
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return(
    <nav className= {`navbar navbar-expand-lg shadow-sm sticky-top px-3 py-2 ${theme === 'dark' ? 'bg-secondary' : 'bg-light'}`}>
      <div className="container-fluid d-flex flex-wrap justify-content-between align-items-center">
        <button
          className="btn d-lg-none me-2"
          type="button"
          aria-label="Toggle sidebar"
          onClick={handleSidebarToggle}
          style={{ display: 'block' }}
        >
          <FaBars size={22} />
        </button>
        <Link className="navbar-brand d-flex align-items-center" to="/">
        </Link>

        <div className="flex-grow-1 mx-2 position-relative" style={{ minWidth: 0 }}>
          <form className="w-100">
            <input
              type="search"
              className="form-control mb-2 mb-md-0"
              placeholder="Search"
              style={{ minWidth: 0 }}
              value={searchQuery}
              onChange={e => dispatch(setSearchQuery(e.target.value))}
              onFocus={() => { if (searchQuery) setShowDropdown(true); }}
              autoComplete="off"
              onKeyDown={handleInputKeyDown}
            />
          </form>
          {showDropdown && (projectResults.length > 0 || sprintResults.length > 0 || backlogResults.length > 0) && (
            <div className={`search-dropdown position-absolute w-100 bg-${theme === 'dark' ? 'secondary' : 'white'} border rounded shadow-sm mt-1`} style={{ zIndex: 1050, maxHeight: 320, overflowY: 'auto' }}>
              {projectResults.length > 0 && (
                <div className={`px-3 pt-2 pb-1 fw-bold ${theme === 'dark' ? 'text-light' : 'text-primary'}`}>Projects</div>
              )}
              {projectResults.map((project, idx) => (
                <div
                  key={project.project_id}
                  className={`dropdown-item${highlightedIndex === allResults.findIndex(r => r.type === 'project' && r.project_id === project.project_id) ? ' active' : ''}`}
                  style={{ cursor: 'pointer', background: highlightedIndex === allResults.findIndex(r => r.type === 'project' && r.project_id === project.project_id) ? (theme === 'dark' ? '#444' : '#f0f0f0') : undefined }}
                  onMouseDown={() => handleDropdownClick('project', project.project_id, project.project_name)}
                  onMouseEnter={() => setHighlightedIndex(allResults.findIndex(r => r.type === 'project' && r.project_id === project.project_id))}
                >
                  <span className="fw-semibold">{project.project_name}</span>
                  <span className="text-muted small ms-2">{project.description}</span>
                </div>
              ))}
              {sprintResults.length > 0 && (
                <div className={`px-3 pt-2 pb-1 fw-bold ${theme === 'dark' ? 'text-light' : 'text-success'}`}>Sprints</div>
              )}
              {sprintResults.map((sprint, idx) => (
                <div
                  key={sprint.sprint_id}
                  className={`dropdown-item${highlightedIndex === allResults.findIndex(r => r.type === 'sprint' && r.sprint_id === sprint.sprint_id) ? ' active' : ''}`}
                  style={{ cursor: 'pointer', background: highlightedIndex === allResults.findIndex(r => r.type === 'sprint' && r.sprint_id === sprint.sprint_id) ? (theme === 'dark' ? '#444' : '#f0f0f0') : undefined }}
                  onMouseDown={() => handleDropdownClick('sprint', sprint.sprint_id, sprint.name)}
                  onMouseEnter={() => setHighlightedIndex(allResults.findIndex(r => r.type === 'sprint' && r.sprint_id === sprint.sprint_id))}
                >
                  <span className="fw-semibold">{sprint.name}</span>
                  <span className="text-muted small ms-2">{sprint.description}</span>
                </div>
              ))}
              {backlogResults.length > 0 && (
                <div className={`px-3 pt-2 pb-1 fw-bold ${theme === 'dark' ? 'text-light' : 'text-warning'}`}>Backlog</div>
              )}
              {backlogResults.map((item, idx) => (
                <div
                  key={item.task_id}
                  className={`dropdown-item${highlightedIndex === allResults.findIndex(r => r.type === 'backlog' && r.task_id === item.task_id) ? ' active' : ''}`}
                  style={{ cursor: 'pointer', background: highlightedIndex === allResults.findIndex(r => r.type === 'backlog' && r.task_id === item.task_id) ? (theme === 'dark' ? '#444' : '#f0f0f0') : undefined }}
                  onMouseDown={() => handleDropdownClick('backlog', item.task_id, item.name)}
                  onMouseEnter={() => setHighlightedIndex(allResults.findIndex(r => r.type === 'backlog' && r.task_id === item.task_id))}
                >
                  <span className="fw-semibold">{item.name}</span>
                  <span className="text-muted small ms-2">{item.description}</span>
                </div>
              ))}
              {(projectResults.length + sprintResults.length + backlogResults.length === 0) && (
                <div className="px-3 py-2 text-muted">No results found.</div>
              )}
            </div>
          )}
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {user.type !== "DEV" && <Link to="/createuser" className= {`btn d-flex align-items-center ${theme === 'dark' ? 'btn-dark' : 'btn-primary'}`}>
            <FaPlus className="me-1" />
            Create User
          </Link>}

          <div className="position-relative" ref={notifDropdownRef}>
            <FaBell
              className={`text-secondary fs-5 cursor-pointer icon-hover ${theme === 'dark' ? 'bg-secondary text-light' : 'text-secondary'}`}
              onClick={() => setShowNotifDropdown(v => !v)}
            />
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.7rem' }}>{unreadCount}</span>
            )}
            {showNotifDropdown && (
              <div
                className="dropdown-menu dropdown-menu-end show p-0 m-0 notif-glass shadow-lg border-0"
                style={{
                  minWidth: window.innerWidth <= 600 ? '95vw' : 400,
                  maxWidth: window.innerWidth <= 600 ? '98vw' : 450,
                  width: window.innerWidth <= 600 ? '95vw' : undefined,
                  left: window.innerWidth <= 600 ? 0 : 'auto',
                  right: window.innerWidth <= 600 ? 0 : 0,
                  top: window.innerWidth <= 600 ? '60px' : undefined,
                  position: window.innerWidth <= 600 ? 'fixed' : 'absolute',
                  maxHeight: '80vh',
                  overflowY: 'auto',
                  zIndex: 2000,
                  backdropFilter: 'blur(12px)',
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #23272f 80%, #181a20 100%)'
                    : 'linear-gradient(135deg, #fff 80%, #f8fafc 100%)',
                  border: theme === 'dark'
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid rgba(0,0,0,0.08)',
                  color: theme === 'dark' ? '#f1f1f1' : '#222',
                  boxShadow: theme === 'dark'
                    ? '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.18)'
                    : '0 8px 32px rgba(31,38,135,0.15), 0 2px 8px rgba(0,0,0,0.07)',
                }}
              >
                <div
                  className="notif-header d-flex justify-content-between align-items-center"
                  style={{
                    background: theme === 'dark'
                      ? 'rgba(36, 40, 47, 0.95)'
                      : 'rgba(245,245,250,0.95)',
                    color: theme === 'dark' ? '#f1f1f1' : '#222',
                    borderBottom: theme === 'dark'
                      ? '1px solid rgba(255,255,255,0.08)'
                      : '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  <div className="d-flex align-items-center">
                    <FaBell className={`me-2 ${theme === 'dark' ? 'text-light' : 'text-primary'}`} style={{ fontSize: 20 }} />
                    <span className={`fw-bold ${theme === 'dark' ? 'text-light' : 'text-dark'}`}>Notifications</span>
                  </div>
                  <span className={`badge rounded-pill ${theme === 'dark' ? 'bg-white text-dark' : 'bg-primary'}`} >{notifications.length}</span>
                </div>
                
                {notifications.length === 0 && (
                  <div className="notif-empty">
                    <div className={`text-center py-4 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>
                      <FaBell className="mb-2" style={{ fontSize: 24, opacity: 0.5 }} />
                      <p className="mb-0">No notifications yet</p>
                    </div>
                  </div>
                )}
                
                {notifications.map(notif => {
                  let message = notif.message;
                  const taskIdMatch = message && message.match(/task #(\d+)/i);
                  if (taskIdMatch) {
                    const taskId = taskIdMatch[1];
                    let taskName = '';
                    for (const approval of pendingApprovals) {
                      let newData = {};
                      try {
                        newData = typeof approval.new_data === 'string' ? JSON.parse(approval.new_data) : approval.new_data;
                      } catch {}
                      if ((approval.entity_id && String(approval.entity_id) === taskId) || (newData.id && String(newData.id) === taskId)) {
                        taskName = newData.name || newData.task_name || '';
                        break;
                      }
                    }
                    if (taskName) {
                      message = message.replace(/task #\d+/i, `task "${taskName}"`);
                    }
                  }
                  return (
                    <div
                      key={notif.id}
                      className={`notif-item d-flex align-items-start gap-3 p-3 ${notif.status === 'unread' ? 'notif-unread' : ''}`}
                      style={{
                        background: notif.status === 'unread'
                          ? (theme === 'dark' ? 'rgba(0,123,255,0.13)' : 'rgba(0,123,255,0.07)')
                          : (theme === 'dark' ? 'rgba(36,40,47,0.92)' : 'transparent'),
                        borderRadius: 12,
                        transition: 'background 0.2s, color 0.2s',
                        cursor: 'pointer',
                        color: theme === 'dark' ? '#f1f1f1' : '#222',
                      }}
                      onMouseEnter={e => {
                        if (theme === 'dark') {
                          e.currentTarget.style.background = '#fff';
                          e.currentTarget.style.color = '#222';
                          e.currentTarget.querySelectorAll('*').forEach(el => {
                            el.style.color = '#222';
                          });
                        } else {
                          e.currentTarget.style.background = '#e6f0ff';
                          e.currentTarget.style.color = '#222';
                        }
                      }}
                      onMouseLeave={e => {
                        if (theme === 'dark') {
                          e.currentTarget.style.background = notif.status === 'unread' ? 'rgba(0,123,255,0.13)' : 'rgba(36,40,47,0.92)';
                          e.currentTarget.style.color = '#f1f1f1';

                          e.currentTarget.querySelectorAll('*').forEach(el => {
                            el.style.color = '#f1f1f1';
                          });
                        } else {
                          e.currentTarget.style.background = notif.status === 'unread' ? 'rgba(0,123,255,0.07)' : 'transparent';
                          e.currentTarget.style.color = '#222';
                        }
                      }}
                      onClick={() => markNotificationRead(notif.id)}
                    >
                      <div className="position-relative">
                        <span className={`notif-dot ${notif.status === 'unread' ? 'bg-primary' : 'bg-secondary'}`} />
                      </div>
                      <div className="flex-grow-1">
                        <div className={theme === 'dark' ? 'text-light' : 'text-dark'} 
                          style={{ fontWeight: notif.status === 'unread' ? 600 : 400, lineHeight: 1.4 }}>
                          {message}
                        </div>
                        <small className={`${theme === 'dark' ? 'text-light' : 'text-muted'}`} style={{ opacity: 0.7 }}>
                          {notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}
                        </small>
                      </div>
                    </div>
                  );
                })}
                {userType === 'PM' && (
                  <>
                    <div className={`p-3 border-top fw-bold d-flex align-items-center gap-2 ${theme === 'dark' ? 'text-light bg-dark' : 'text-dark'}`}>
                      <FaGem className="text-warning me-2" style={{ fontSize: 20 }} /> Pending Approvals
                    </div>
                    {pendingApprovals.length === 0 && (
                      <div className={`p-4 text-center ${theme === 'dark' ? 'text-white' : 'text-muted'}`}>
                        <div className="mb-2">📋</div>
                        No pending approvals
                      </div>
                    )}
                    {pendingApprovals.map(edit => {
                      let newData = {};
                      try {
                        newData = typeof edit.new_data === 'string' ? JSON.parse(edit.new_data) : edit.new_data;
                      } catch (e) {}
                      const taskName = newData.name || newData.task_name || 'Unknown Task';
                      const requester = edit.requested_by_name || edit.requested_by || 'Unknown User';

                      const fields = [
                        {key: 'name', label: 'Name'},
                        {key: 'description', label: 'Description'},
                        {key: 'status', label: 'Status'},
                        {key: 'priority', label: 'Priority'},
                        {key: 'due_date', label: 'Due Date'},
                        {key: 'assignee', label: 'Assignee'}
                      ];
                      return (
                        <div key={edit.id} className="dropdown-item notif-approval rounded-3 mb-2" style={{ minWidth: 0, maxWidth: '100%', width: '100%', wordBreak: 'break-word', overflow: 'hidden', overflowWrap: 'anywhere', marginLeft: 0, paddingLeft: 0 }}>
                          <div className="d-flex align-items-center gap-2 mb-2 flex-wrap ms-2" style={{ minWidth: 0, width: '100%' }}>
                            <span className="badge bg-primary me-2" style={{ fontSize: '0.85em' }}>Task</span>
                            <span className="fw-semibold" style={{ minWidth: 0, wordBreak: 'break-word', overflowWrap: 'anywhere', flex: 1 }}>{taskName}</span>
                          </div>
                          <div className="mb-2 text-muted ms-2" style={{ fontSize: '0.95em', minWidth: 0, wordBreak: 'break-word', overflowWrap: 'anywhere', width: '100%' }}>
                            Requested by <span className="fw-semibold">{requester}</span>
                          </div>
                          <div className="changes-table mb-3 ms-2" style={{ background: '#f8f9fa', borderRadius: '8px', overflow: 'hidden', minWidth: 0, width: '100%' }}>
                            {fields.map(f => (
                              newData[f.key] !== undefined && (
                                <div key={f.key} className="d-flex border-bottom flex-wrap" style={{ minWidth: 0, width: '100%' }}>
                                  <div className="p-2" style={{ fontWeight: 500, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'anywhere', width: '120px', maxWidth: '40%' }}>{f.label}</div>
                                  <div className="flex-grow-1 p-2" style={{ minWidth: 0, wordBreak: 'break-word', overflowWrap: 'anywhere', width: '0', flexBasis: 0 }}>{String(newData[f.key])}</div>
                                </div>
                              )
                            ))}
                          </div>
                          <div className="d-flex gap-2 mt-2 ms-2 justify-content-end flex-wrap" style={{ minWidth: 0, width: '100%' }}>
                            <button className="btn btn-sm btn-success px-3" style={{ whiteSpace: 'nowrap' }} onClick={() => handleApproval(edit.id, 'approved')}>Approve</button>
                            <button className="btn btn-sm btn-outline-danger px-3" style={{ whiteSpace: 'nowrap' }} onClick={() => handleApproval(edit.id, 'rejected')}>Reject</button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
          
          <FaQuestionCircle
            type="button"
            className= {`cursor-pointer icon-hover fs-5  ${theme === 'dark' ? 'text-light' : 'text-secondary'}`}
            onClick={() => navigate('/help')}
          />

          <div className="dropdown">
            <button
              className="btn btn-link p-0 d-inline-flex align-items-center"
              type="button"
              id="settingsDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ lineHeight: 1 }}
            >
              <FaCog className={`fs-5 cursor-pointer icon-hover  ${theme === 'dark' ? 'text-light' : 'text-secondary'}`} />
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-0 m-0" aria-labelledby="settingsDropdown">
              <li>
                <button
                  className="dropdown-item d-flex align-items-center gap-2 theme-btn"
                  type="button"
                  onClick={handleThemeChange}
                  style={{
                    background: theme === 'dark'
                      ? 'linear-gradient(90deg, #ffecb3 0%, #ffe082 100%)'
                      : 'linear-gradient(90deg, #232526 0%, #414345 100%)',
                    color: theme === 'dark' ? '#333' : '#fff',
                    boxShadow: theme === 'dark'
                      ? '0 4px 16px 0 rgba(255,224,130,0.15), 0 0 8px 2px #ffe08233'
                      : '0 4px 16px 0 rgba(65,67,69,0.15), 0 0 8px 2px #23252633',
                    fontWeight: 600,
                    transition: 'background 0.3s, box-shadow 0.3s, transform 0.2s',
                    border: 'none',
                    borderRadius: "5px",
                    padding: '10px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    fontSize: '1.08rem',
                    letterSpacing: '0.03em',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = theme === 'dark'
                      ? 'linear-gradient(90deg, #ffe082 0%, #ffecb3 100%)'
                      : 'linear-gradient(90deg, #414345 0%, #232526 100%)';
                    e.currentTarget.style.boxShadow = theme === 'dark'
                      ? '0 6px 24px 0 rgba(255,224,130,0.22), 0 0 12px 3px #ffe08255'
                      : '0 6px 24px 0 rgba(65,67,69,0.22), 0 0 12px 3px #23252655';
                    e.currentTarget.style.transform = 'scale(1.04)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = theme === 'dark'
                      ? 'linear-gradient(90deg, #ffecb3 0%, #ffe082 100%)'
                      : 'linear-gradient(90deg, #232526 0%, #414345 100%)';
                    e.currentTarget.style.boxShadow = theme === 'dark'
                      ? '0 4px 16px 0 rgba(255,224,130,0.15), 0 0 8px 2px #ffe08233'
                      : '0 4px 16px 0 rgba(65,67,69,0.15), 0 0 8px 2px #23252633';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {theme === 'dark' ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="6" fill="#ffe082"/>
                      <g stroke="#ffb300" strokeWidth="1.5" strokeLinecap="round">
                        <line x1="12" y1="2" x2="12" y2="4" />
                        <line x1="12" y1="20" x2="12" y2="22" />
                        <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
                        <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
                        <line x1="2" y1="12" x2="4" y2="12" />
                        <line x1="20" y1="12" x2="22" y2="12" />
                        <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
                        <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
                      </g>
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="#232526" stroke="#fff" strokeWidth="1.5"/>
                    </svg>
                  )}
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </button>
              </li>
            </ul>
          </div>

          <div className="dropdown">
            <button
              className= {`text-white rounded-circle d-flex align-items-center justify-content-center fw-bold border-0 ${theme === 'dark' ? 'bg-black' : 'bg-success'}`}
              type="button"
              id="userDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{
                width: '35px',
                height: '35px',
                cursor: 'pointer',
                padding: 0,
                lineHeight: '35px',
                textAlign: 'center',
              }}
              title={username}
            >
              {firstLetter}
            </button>

            <ul
              className="dropdown-menu dropdown-menu-end shadow-lg"
              aria-labelledby="userDropdown"
              style={{ minWidth: '280px', borderRadius: '12px', border: 'none', padding: '0.5rem' }}
            >
              <li className="px-4 py-3">
                <div className="d-flex flex-column">
                  <div className="d-flex align-items-center mb-2">
                    <div className={`rounded-circle d-flex justify-content-center align-items-center me-2 ${theme === 'dark' ? 'bg-primary' : 'bg-primary'}`} 
                         style={{ width: 48, height: 48 }}>
                      <span className="text-white fs-4">{firstLetter}</span>
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold">{user.username}</h6>
                      <small className="text-muted" style={{ wordBreak: 'break-word' }}>
                        {user.email}
                      </small>
                    </div>
                  </div>
                </div>
              </li>
              
              <li>
                <hr className="dropdown-divider mx-2 my-2" />
              </li>

              <li className="px-4 py-2">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-person me-2 text-primary"></i>
                  <div className="d-flex justify-content-between w-100">
                    <span className="text-muted">Age</span>
                    <span className="fw-medium">{user.age ?? '-'}</span>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <i className="bi bi-telephone me-2 text-primary"></i>
                  <div className="d-flex justify-content-between w-100">
                    <span className="text-muted">📞</span>
                    <span className="fw-medium">{user.phone_number ?? '-'}</span>
                  </div>
                </div>
              </li>

              <li>
                <hr className="dropdown-divider mx-2 my-2" />
              </li>

              <li className="px-2 pb-2">
                <button
                  className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2"
                  type="button"
                  onClick={() => handleLogout()}
                  style={{ borderRadius: '8px' }}
                >
                  <i className="bi bi-box-arrow-right"></i>
                  <span>Logout</span>
                </button>
              </li>
            </ul>

          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
