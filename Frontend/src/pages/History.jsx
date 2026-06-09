import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { BsFolder, BsFlag, BsListCheck } from 'react-icons/bs';
import axios from 'axios';

const History = () => {
  const theme = useSelector((state) => state.theme.mode);
  const token = useSelector((state) => state.auth.token);
  const collapsed = useSelector((state) => state.sidebar.isCollapsed);
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allProjects, setAllProjects] = useState([]);
  const [allSprints, setAllSprints] = useState([]);
  const [allTeamLeads, setAllTeamLeads] = useState([]);
  const [allDevelopers, setAllDevelopers] = useState([]);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      axios.get('http://localhost:3000/history/projects', {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get('http://localhost:3000/history/sprints', {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get('http://localhost:3000/history/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get('http://localhost:3000/all-projects', {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get('http://localhost:3000/all-sprints', {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get('http://localhost:3000/teamlead'),
      axios.get('http://localhost:3000/developers'),
    ])
      .then(([
        projRes,
        sprRes,
        tskRes,
        allProjRes,
        allSprRes,
        allTLRes,
        allDevRes
      ]) => {
        setProjects(projRes.data);
        setSprints(sprRes.data);
        setTasks(tskRes.data);
        setAllProjects(allProjRes.data);
        setAllSprints(allSprRes.data);
        setAllTeamLeads(allTLRes.data);
        setAllDevelopers(allDevRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  // Group tasks by name+description+sprint_id
  const groupedTasks = React.useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      const key = `${t.name}|||${t.description}|||${t.sprint_id}`;
      if (!map[key]) {
        map[key] = { ...t, developers: [t.developer] };
      } else {
        if (!map[key].developers.includes(t.developer)) {
          map[key].developers.push(t.developer);
        }
      }
    });
    return Object.values(map);
  }, [tasks]);

  const projectIdToName = React.useMemo(() => {
    const map = {};
    allProjects.forEach(p => { map[p['project-id']] = p.name || p.project_name; });
    return map;
  }, [allProjects]);
  const sprintIdToName = React.useMemo(() => {
    const map = {};
    allSprints.forEach(s => { map[s.sprint_id] = s.name; });
    return map;
  }, [allSprints]);
  const teamLeadIdToName = React.useMemo(() => {
    const map = {};
    allTeamLeads.forEach(tl => { map[tl.id] = tl.username; });
    return map;
  }, [allTeamLeads]);
  const devIdToName = React.useMemo(() => {
    const map = {};
    allDevelopers.forEach(dev => { map[dev.id] = dev.username; });
    return map;
  }, [allDevelopers]);

  const cardClass = theme === 'dark' ? 'bg-secondary text-white' : 'bg-white text-dark';
  const sectionTitleClass = `fw-bold mb-3 d-flex align-items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-primary'}`;

  return (
    <div className={`${theme === 'dark' ? 'bg-dark' : 'bg-light'} min-vh-100 d-flex`}>
      <Sidebar />
      <div className={`main-content flex-grow-1 d-flex flex-column overflow-hidden${collapsed ? ' collapsed' : ''}`}>
        <Navbar />
        <div className="container-fluid py-5">
          <h1 className={`fw-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-primary'} text-center`}>History</h1>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="row g-5">
              <div className="col-12 col-lg-4">
                <div className="mb-4">
                  <span className={sectionTitleClass}><BsFolder size={24}/> Projects</span>
                  {projects.length === 0 ? (
                    <div className={`card shadow-sm p-4 rounded-4 text-center w-100 ${cardClass}`} style={{ minHeight: 120 }}>
                      <h5 className="fw-bold mb-2">No Completed Projects</h5>
                      <p className="mb-0">No projects have been completed yet.</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {projects.map((p) => (
                        <div
                          key={p['project-id']}
                          className={`card shadow-lg border overflow-hidden ${theme === 'dark' ? 'bg-dark text-white' : 'bg-white text-dark'}`}
                          style={{
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            backgroundColor: theme === 'dark' ? '#1a1d23' : '#ffffff',
                            border: theme === 'dark' ? '1px solid #333741' : '1px solid #e9ecef',
                            boxShadow: theme === 'dark'
                              ? '0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.4)'
                              : '0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <div
                            className={`card-header border-0 text-center py-2 ${theme === 'dark' ? 'bg-gradient' : 'bg-primary bg-gradient'}`}
                            style={{
                              background: theme === 'dark'
                                ? 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)'
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              borderBottom: theme === 'dark' ? '1px solid #4b5563' : 'none'
                            }}
                          >
                            <h6 className="card-title text-white fw-bold mb-0">
                              {p.name || p.project_name}
                            </h6>
                          </div>

                          <div className="card-body d-flex flex-column p-3">
                            <p className="mb-2" style={{ fontSize: '0.9rem' }}>
                              <strong>Description:</strong> {p.description || 'No description provided.'}
                            </p>
                            <p className="mb-0 d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                              <strong>Status:</strong>
                              <span
                                className={`badge rounded-pill fw-semibold px-2 py-1 ${
                                  p.status === 'Completed'
                                    ? 'bg-success text-white'
                                    : p.status === 'In Progress'
                                      ? 'bg-warning text-dark'
                                      : 'bg-secondary text-white'
                                }`}
                                style={{
                                  fontSize: '0.8rem',
                                  minWidth: '80px',
                                  boxShadow: theme === 'dark'
                                    ? '0 2px 4px rgba(0,0,0,0.4)'
                                    : '0 1px 2px rgba(0,0,0,0.1)'
                                }}
                              >
                                {p.status || 'Unknown'}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-12 col-lg-4">
                <div className="mb-4">
                  <span className={sectionTitleClass}><BsFlag size={24}/> Sprints</span>
                  {sprints.length === 0 ? (
                    <div className={`card shadow-sm p-4 rounded-4 text-center w-100 ${cardClass}`} style={{ minHeight: 120 }}>
                      <h5 className="fw-bold mb-2">No Completed Sprints</h5>
                      <p className="mb-0">No sprints have been completed yet.</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {sprints.map((s) => (
                        <div
                          key={s.sprint_id}
                          className={`card shadow-lg border overflow-hidden ${theme === 'dark' ? 'bg-dark text-white' : 'bg-white text-dark'}`}
                          style={{
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            backgroundColor: theme === 'dark' ? '#1a1d23' : '#ffffff',
                            border: theme === 'dark' ? '1px solid #333741' : '1px solid #e9ecef',
                            boxShadow: theme === 'dark'
                              ? '0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.4)'
                              : '0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <div
                            className={`card-header border-0 text-center py-2 ${theme === 'dark' ? 'bg-gradient' : 'bg-primary bg-gradient'}`}
                            style={{
                              background: theme === 'dark'
                                ? 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)'
                                : 'linear-gradient(135deg, #17a2b8 0%, #00c6ff 100%)',
                              borderBottom: theme === 'dark' ? '1px solid #4b5563' : 'none'
                            }}
                          >
                            <h6 className="card-title text-white fw-bold mb-0">{s.name}</h6>
                          </div>

                          <div className="card-body d-flex flex-column p-3">
                            <p className="mb-2" style={{ fontSize: '0.9rem' }}>
                              <strong>Project:</strong> {projectIdToName[s.project_id] || s.project_id}
                            </p>
                            <p className="mb-2" style={{ fontSize: '0.9rem' }}>
                              <strong>Team Lead:</strong> {teamLeadIdToName[s.team_lead] || s.team_lead}
                            </p>
                            <p className="mb-2" style={{ fontSize: '0.9rem' }}>
                              <strong>Start:</strong> {new Date(s.start_date).toLocaleDateString()}
                            </p>
                            <p className="mb-2" style={{ fontSize: '0.9rem' }}>
                              <strong>End:</strong> {new Date(s.completion_date).toLocaleDateString()}
                            </p>
                            <p className="mb-0 d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                              <strong>Status:</strong>
                              <span
                                className={`badge rounded-pill fw-semibold px-2 py-1 ${
                                  s.status === 'Completed'
                                    ? 'bg-success text-white'
                                    : s.status === 'In Progress'
                                      ? 'bg-warning text-dark'
                                      : 'bg-secondary text-white'
                                }`}
                                style={{
                                  fontSize: '0.8rem',
                                  minWidth: '80px',
                                  boxShadow: theme === 'dark'
                                    ? '0 2px 4px rgba(0,0,0,0.4)'
                                    : '0 1px 2px rgba(0,0,0,0.1)'
                                }}
                              >
                                {s.status || 'Unknown'}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-12 col-lg-4">
                <div className="mb-4">
                  <span className={sectionTitleClass}><BsListCheck size={24}/> Tasks</span>
                  {groupedTasks.length === 0 ? (
                    <div className={`card shadow-sm p-4 rounded-4 text-center w-100 ${cardClass}`} style={{ minHeight: 120 }}>
                      <h5 className="fw-bold mb-2">No Completed Tasks</h5>
                      <p className="mb-0">No tasks have been completed yet.</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {groupedTasks.map((t, idx) => (
                        <div
                          key={t.name + t.description + t.sprint_id}
                          className={`card shadow-lg border overflow-hidden ${theme === 'dark' ? 'bg-dark text-white' : 'bg-white text-dark'}`}
                          style={{
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            backgroundColor: theme === 'dark' ? '#1a1d23' : '#ffffff',
                            border: theme === 'dark' ? '1px solid #333741' : '1px solid #e9ecef',
                            boxShadow: theme === 'dark'
                              ? '0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.4)'
                              : '0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <div
                            className={`card-header border-0 text-center py-2 ${theme === 'dark' ? 'bg-gradient' : 'bg-primary bg-gradient'}`}
                            style={{
                              background: theme === 'dark'
                                ? 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)'
                                : 'linear-gradient(135deg, #17a2b8 0%, #00c6ff 100%)',
                              borderBottom: theme === 'dark' ? '1px solid #4b5563' : 'none'
                            }}
                          >
                            <h6 className="card-title text-white fw-bold mb-0">{t.name}</h6>
                          </div>
                          <div className="card-body d-flex flex-column p-3">
                            <p className="mb-2" style={{ fontSize: '0.9rem' }}>
                              <strong>Description:</strong> {t.description}
                            </p>
                            <p className="mb-2" style={{ fontSize: '0.9rem' }}>
                              <strong>Sprint:</strong> {sprintIdToName[t.sprint_id] || t.sprint_id}
                            </p>
                            <p className="mb-0 d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                              <strong>Developers:</strong>
                              {t.developers.map((dev, i) => (
                               <span key={dev} className={`badge rounded-pill me-1 ${theme === 'dark' ? 'bg-primary text-white' : 'bg-primary'}`}>{devIdToName[dev] || dev}</span>
                            ))}
                            </p>
                            <p className="mb-0 d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                              <strong>Status:</strong>
                              <span
                                className={`badge rounded-pill fw-semibold px-2 py-1 ${
                                  t.status === 'Completed'
                                    ? 'bg-success text-white'
                                    : t.status === 'In Progress'
                                      ? 'bg-warning text-dark'
                                      : 'bg-secondary text-white'
                                }`}
                                style={{
                                  fontSize: '0.8rem',
                                  minWidth: '80px',
                                  boxShadow: theme === 'dark'
                                    ? '0 2px 4px rgba(0,0,0,0.4)'
                                    : '0 1px 2px rgba(0,0,0,0.1)'
                                }}
                              >
                                {t.status || 'Unknown'}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
