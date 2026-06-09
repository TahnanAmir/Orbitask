import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/authSlice';
import logo from '../assets/Newlogo.png'
import axios from 'axios';

const schema = yup.object().shape({
  username: yup.string().required('Username is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required(),
});

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onSubmit = async (data) => {
    try {
      const response = await axios.post('http://localhost:3000/login', data, {
        headers: { 'Content-Type': 'application/json' }
      });
      const { token, user } = response.data;

      dispatch(setCredentials({ user, token }));
      navigate('/');
    } catch (error) {
      if (error.response) {
        alert('Login failed');
      } else {
        alert('Something went wrong');
      }
      console.error('Login error:', error);
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex justify-content-center align-items-center">
      <div className="container d-flex justify-content-center align-items-center py-5">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="card shadow-lg border-0 p-4 p-md-5 rounded-4 w-100"
          style={{ maxWidth: '400px' }}
        >
          <div className="d-flex flex-column align-items-center mb-4">
            <div className="bg-primary bg-gradient rounded-circle d-flex justify-content-center align-items-center mb-3" style={{ width: '60px', height: '60px' }}>
              <img src={logo} alt="Task Manager" style={{ width: '40px', height: '40px' }} />
            </div>
            <h2 className="text-center mb-0 fw-bold text-primary">Login</h2>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Username</label>
            <input
              {...register('username')}
              type="text"
              className={`form-control ${errors.username ? 'is-invalid' : ''}`}
              placeholder="Enter Username"
            />
            <div className="invalid-feedback">{errors.username?.message}</div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Password</label>
            <input
              {...register('password')}
              type="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              placeholder="Enter Password"
            />
            <div className="invalid-feedback">{errors.password?.message}</div>
          </div>

          <div className="d-grid gap-2 mt-4">
            <button type="submit" className="btn btn-primary fw-bold py-2">
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
