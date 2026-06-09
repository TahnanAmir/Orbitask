import React from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar';
import { useSelector } from 'react-redux';
import Sidebar from '../components/Sidebar';

const Help = () => {

  const theme = useSelector((state) => state.theme.mode);
  const collapsed = useSelector((state) => state.sidebar.isCollapsed);

  return (
    <div className={`${theme === 'dark' ? 'bg-dark' : 'bg-light'} min-vh-100 d-flex`}>
      <Sidebar /> 
      <div className={`main-content flex-grow-1 ${collapsed ? ' collapsed' : ''}`}>
        <Navbar />
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-12 col-md-10 col-lg-8">
              <div className={`card shadow-lg border-0 p-4 p-md-5 rounded-4 ${theme === 'dark' ? 'bg-secondary text-white' : 'bg-white text-dark'}`}>
                <div className="d-flex flex-column align-items-center mb-4">
                  <div
                    className={`bg-gradient rounded-circle d-flex justify-content-center align-items-center mb-3 ${theme === 'dark' ? 'bg-dark' : 'bg-primary'}`}
                    style={{ width: '70px', height: '70px' }}
                  >
                    <span className="fs-2 text-white">?</span>
                  </div>
                  <h1 className={`mb-2 text-center fw-bold ${theme === 'dark' ? 'text-white' : 'text-primary'}`} style={{ letterSpacing: '1.5px' }}>
                    Help & Support
                  </h1>
                  <h3 className={`mb-4 text-center fst-italic fs-5 ${theme === 'dark' ? 'text-white' : 'text-secondary'}`}>
                    We're here to assist you. Find answers to common questions below.
                  </h3>
                </div>
                <ol className="fs-5 ps-3" style={{ lineHeight: 1.7 }}>
                  <li className="mb-3">
                    <strong>Account Info:</strong> To view your account information, open the Profile dropdown from the sidebar or access it from the navbar.
                  </li>
                  <li className="mb-3">
                    <strong>Creating Projects:</strong> Project Managers can add new projects by clicking the "Add Project" button on the Projects page. Fill in all required fields and submit to create a project.
                  </li>
                  <li className="mb-3">
                    <strong>Managing Sprints & Tasks:</strong> Go to the Sprints page to view, create, or update sprints and their tasks. Assign developers to tasks and track progress using the status indicators.
                  </li>
                  <li className="mb-3">
                    <strong>Deleting Projects:</strong> Only Project Managers can delete projects from the Projects page. Deleted projects are permanently removed and cannot be recovered.
                  </li>
                  <li className="mb-3">
                    <strong>Support & Feedback:</strong> For technical issues or feedback, contact support via the provided email. You can also check notifications for important updates.
                  </li>
                </ol>
                <div className="text-center mt-5">
                  <small className={`fst-italic ${theme === 'dark' ? 'text-white' : 'text-secondary'}`}>
                    © {new Date().getFullYear()} Orbitask. All rights reserved.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}

export default Help
