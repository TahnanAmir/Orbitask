import React from 'react'
import { useNavigate } from 'react-router-dom'

const TermsConditions = () => {
  const navigate = useNavigate();

  function handleGoBack()
  {
    navigate('/createuser');
  }

  return (
    <div className="container my-5 px-3 px-md-5">
      <div className="bg-dark text-light p-4 p-md-5 rounded shadow">
        <h1 className="mb-4 text-center">Terms & Conditions</h1>
        <h3 className="mb-3">By signing up, you agree to the following:</h3>
        <ol className="fs-5">
          <li className="mb-3">
            You are responsible for maintaining the confidentiality of your account information.
          </li>
          <li className="mb-3">
            You confirm that all the information you provide is accurate and up to date.
          </li>
          <li className="mb-3">
            Your data may be stored locally for application functionality but will not be shared with others.
          </li>
          <li className="mb-3">
            You agree not to misuse the application or attempt unauthorized access.
          </li>
        </ol>

        <div className="d-flex justify-content-center mt-5">
          <button
            className="btn btn-light fw-bold px-4 px-md-5"
            onClick={handleGoBack}
            style={{ minWidth: '180px' }}
          >
            Go back & Create User
          </button>
        </div>
      </div>
    </div>
  );
}

export default TermsConditions
