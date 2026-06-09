import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useSelector } from 'react-redux';
import logo from '../assets/Newlogo.png';
import Sidebar from '../components/Sidebar';

const Home = () => {
  const collapsed = useSelector((state) => state.sidebar.isCollapsed);

  const theme = useSelector((state) => state.theme.mode);
  return (
    <div className={`${theme === 'dark' ? 'bg-dark' : 'bg-light'} min-vh-100 d-flex`}>
      <Sidebar />
      <div className={`main-content flex-grow-1 d-flex flex-column${collapsed ? ' collapsed' : ''}`}>
        <Navbar />
        <div className="container flex-grow-1 d-flex justify-content-center align-items-center">
          <div className={`card shadow-lg border-0 p-5 rounded-4 w-100 ${theme === 'dark' ? 'bg-secondary text-white' : 'bg-white text-dark'}`} style={{ maxWidth: '600px' }}>
            <div className="d-flex flex-column align-items-center">
              <div className={`bg-gradient rounded-circle d-flex justify-content-center align-items-center mb-4 ${theme === 'dark' ? 'bg-dark' : 'bg-primary'}`} style={{ width: '90px', height: '90px' }}>
                <img src={logo} alt="Task Manager" style={{ width: '40px', height: '40px' }} />
              </div>
              <h1 className={`text-center fw-bold display-4 mb-3 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Welcome!</h1>
              <p className={`text-center fs-5 mb-0 ${theme === 'dark' ? 'text-white' : 'text-secondary'}`}>
                Manage your projects, resources, and teams efficiently with Orbitask.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default Home;
