import React from 'react'

const NotFound = () => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-dark px-3 text-center">
      <h1 className="text-light fw-bold mb-3" style={{ fontSize: 'clamp(2rem, 10vw, 6rem)' }}>
        404
      </h1>
      <h2 className="text-light fw-semibold mb-4" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}>
        Page Not Found!
      </h2>
      <p className="text-light fs-5 mb-4" style={{ maxWidth: '400px' }}>
        Sorry, the page you are looking for does not exist. Please check the URL or return to the homepage.
      </p>
      <button
        className="btn btn-light btn-lg fw-bold"
        onClick={() => window.history.back()}
        style={{ minWidth: '150px' }}
      >
        Go Back
      </button>
    </div>
  );
}

export default NotFound
