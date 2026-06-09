import React, { useState, useEffect } from 'react';
import logo from '../assets/Newlogo.png';
import { useSelector, useDispatch } from 'react-redux';
import proj from '../assets/proj.png';
import sprint from '../assets/sprint.png';
import home from '../assets/home.png';
import backlog from '../assets/backlog.png';
import history from '../assets/history.png';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toggleCollapse, resetSidebar } from '../features/sidebarSlice';
import { logout } from '../features/authSlice';
import { resetTheme } from '../features/themeSlice';

const Sidebar = () => {
  const collapsed = useSelector((state) => state.sidebar.isCollapsed);
  const user = useSelector((state) => state.auth.user) || {};
  const username = user.username || '';
  const firstLetter = username.charAt(0).toUpperCase();

  const dispatch = useDispatch();

  const location = useLocation();
  const theme = useSelector((state) => state.theme.mode);
  const navigate = useNavigate();

  const isMobile = window.innerWidth <= 768;

  const getPathFromLabel = (label) => {
  switch(label) {
    case 'Projects': return '/projects';
    case 'Backlog': return '/backlog';
    case 'Sprints': return '/sprints';
    case 'History': return '/history';
    default: return '/';
  }
};

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetSidebar());
    dispatch(resetTheme());
    navigate('/login');
  };

  useEffect(() => {
    if (collapsed && window.bootstrap) {
      const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      [...tooltipTriggerList].forEach(el => new window.bootstrap.Tooltip(el));
    }
  }, [collapsed]);

  return (
    <>
      {!collapsed && isMobile && (
        <div className="sidebar-backdrop" onClick={() => dispatch(toggleCollapse())}></div>
      )}

      <div
        className={`d-flex flex-column flex-shrink-0 ${collapsed ? 'text-center' : ''} ${theme === 'dark' ? 'bg-secondary' : 'bg-light'} ${isMobile ? 'sidebar-overlay' : ''} ${(isMobile && collapsed) ? 'sidebar-hidden' : ''}`}
        style={{
          width: isMobile ? (collapsed ? '0' : '280px') : (collapsed ? '4.5rem' : '280px'),
          transition: 'width 0.3s ease',
          borderRight: isMobile && collapsed ? 'none' : (theme === 'dark' ? '1px solid #5b6269ff' : '1px solid #D3D3D3' ),
          overflowX: 'visible',
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          zIndex: 1050
        }}
      >
        <a
          href="#"
          className={`d-flex align-items-center ${collapsed ? 'justify-content-center pt-3 pb-3 ps-2 pe-2' : 'pt-2 pb-2 ps-3 pe-2'} link-dark text-decoration-none`}
          onClick={() => dispatch(toggleCollapse())}
          title={collapsed ? 'Expand Sidebar' : ''}
          data-bs-toggle={collapsed ? 'tooltip' : ''}
          data-bs-placement="right"
        >
          <img src={logo} alt="Orbitask" width={collapsed ? 24 : 30} className={collapsed ? '' : 'me-2'} />
          {!collapsed && <span className={`fs-3 ms-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Orbitask</span>}
        </a>

        <hr className="my-0" style={{ borderTop: `1px solid ${theme === 'dark' ? '#ffffff' : '#000000'}`}} />

        <ul className={`nav nav-pills ${collapsed ? 'nav-flush' : ''} flex-column mb-auto ${collapsed ? 'text-center' : ''}`}>
          {[
            { label: 'Home', icon: home },
            { label: 'Projects', icon: proj },
            { label: 'Backlog', icon: backlog },
            { label: 'Sprints', icon: sprint },
            { label: 'History', icon: history }
          ].filter(Boolean).map(({ label, icon }) => {
            const path = getPathFromLabel(label);
            const isActive = location.pathname === path;

            return (
              <li key={label} className="nav-item">
                <Link
                  to={path}
                  className={`nav-link ${collapsed ? 'py-3 ps-4 border-bottom' : 'link-dark'} ${isActive ? (theme === 'dark' ? 'bg-light text-dark' : 'active text-white' ) : (theme === 'dark' ? 'text-white' : '' )}`}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? label : ''}
                  data-bs-toggle={collapsed ? 'tooltip' : ''}
                  data-bs-placement="right"
                >
                  <img src={icon} alt={label} width="20" className="me-2" />
                  {!collapsed && label}
                </Link>
              </li>
            );
          })}
        </ul>

        <hr className="my-0" style={{ borderTop: `1px solid ${theme === 'dark' ? '#ffffff' : '#000000'}`}} />

        <div className={`dropdown border-top ${collapsed ? 'p-3' : 'px-3 py-2'}`}>
        <a
          href="#"
          className={`d-flex align-items-center ${collapsed ? 'justify-content-center' : 'justify-content-between'} ${theme === 'dark' ? 'text-white' : 'text-dark'} text-decoration-none dropdown-toggle`}
          id="dropdownUser"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          title={collapsed ? 'User Menu' : username}
          style={{ userSelect: 'none', outline: 'none', boxShadow: 'none' }}
        >
          {collapsed ? (
            <div className= {`rounded-circle d-flex justify-content-center align-items-center ${theme === 'dark' ? 'bg-white text-dark' : 'bg-secondary text-white'}`} style={{ width: 32, height: 32 }}>
              {firstLetter}
            </div>
          ) : (
            <>
              <div className="d-flex align-items-center">
                <div className= {`rounded-circle d-flex justify-content-center align-items-center me-2 ${theme === 'dark' ? 'bg-white text-dark' : 'bg-secondary text-white'}`} style={{ width: 32, height: 32 }}>
                  {firstLetter}
                </div>
                <strong>{username}</strong>
              </div>
            </>
          )}
        </a>

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
    </>
  );
};

export default Sidebar;
