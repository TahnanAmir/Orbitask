import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useSelector } from 'react-redux';
import axios from 'axios';

const schema = yup.object().shape({
  username: yup.string().required('Username is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required(),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  age: yup
    .number()
    .typeError('Age must be a number')
    .min(13, 'You must be at least 13')
    .required('Age is required'),
  phone: yup
    .string()
    .matches(/^[0-9]{10,}$/, 'Phone must be at least 10 digits')
    .required('Phone number is required'),
  terms: yup.boolean().oneOf([true], 'You must accept the terms'),
  type: yup.string().required('Type is required'),
});

const CreateUser = () => {
  const navigate = useNavigate();
  const theme = useSelector((state) => state.theme.mode);
  const loggedInUser = useSelector((state) => state.auth.user);
  const collapsed = useSelector((state) => state.sidebar.isCollapsed);

  let typeOptions = [];
  let showTypeDropdown = true;
  if (loggedInUser && loggedInUser.type) 
  {
    switch (loggedInUser.type)
    {
      case 'AD':
        typeOptions = [{ value: 'PM', label: 'Project Manager' }];
        break;
      case 'PM':
        typeOptions = [
          { value: 'TL', label: 'Team Lead' },
          { value: 'DEV', label: 'Developer' },
        ];
        break;
      case 'TL':
        typeOptions = [{ value: 'DEV', label: 'Developer' }];
        break;
      case 'DEV':
        showTypeDropdown = false;
        break;
      default:
        showTypeDropdown = false;
    }
  }
  else 
  {
    showTypeDropdown = false;
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data) => {
    const payload = {
      username: data.username,
      email: data.email,
      password: data.password,
      age: data.age,
      phone_number: data.phone,
    };

    if (showTypeDropdown) {
      payload.type = data.type;
    }

    axios.post('http://localhost:3000/users', payload, {
      headers: { 'Content-Type': 'application/json' }
    })
      .then(response => {
        reset();
      })
      .catch(error => {
        if (error.response) {
          if (error.response.status === 400) {
            alert(error.response.data.message);
          } else {
            alert('Signup failed. Please try again.');
          }
        } else {
          alert('Signup failed. Please try again.');
        }
        console.error('Error saving user:', error);
      });
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-dark' : 'bg-light'} min-vh-100 d-flex`}>
      <Sidebar />
      <div className={`main-content flex-grow-1 d-flex flex-column${collapsed ? ' collapsed' : ''}`}>
        <Navbar />
        <div className={`container-fluid d-flex justify-content-center align-items-center flex-grow-1 px-3 py-5 ${theme === 'dark' ? 'bg-dark' : 'bg-light'}`}
          style={{ minHeight: '90vh' }}
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="card shadow-lg border w-100"
            style={{ maxWidth: '650px', borderRadius: '0.75rem' }}
          >
            <div className={`p-4 w-100 ${theme === 'dark' ? 'bg-dark text-white' : ''}`}
                 style={{ borderRadius: '0.75rem' }}
            >
              <h2 className= {`text-center fw-bold mb-4 fw-bold card-title ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Create User</h2>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Username</label>
                  <input
                    {...register('username')}
                    className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-secondary dark-placeholder' : 'light-placeholder'} ${errors.username ? 'is-invalid' : ''}`}
                    placeholder="Enter Username"
                    style={{
                      backgroundColor: theme === 'dark' ? '#343a40' : '#f8f9fa',
                      borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                    }}
                  />
                  <div className="invalid-feedback">{errors.username?.message}</div>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Email</label>
                  <input
                    {...register('email')}
                    className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-secondary dark-placeholder' : 'light-placeholder'} ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="Enter Email"
                    style={{
                      backgroundColor: theme === 'dark' ? '#343a40' : '#f8f9fa',
                      borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                    }}
                  />
                  <div className="invalid-feedback">{errors.email?.message}</div>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Password</label>
                  <input
                    {...register('password')}
                    type="password"
                    className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-secondary dark-placeholder' : 'light-placeholder'} ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="Enter Password"
                    style={{
                      backgroundColor: theme === 'dark' ? '#343a40' : '#f8f9fa',
                      borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                    }}
                  />
                  <div className="invalid-feedback">{errors.password?.message}</div>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Confirm Password</label>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-secondary dark-placeholder' : 'light-placeholder'} ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    placeholder="Re-enter Password"
                    style={{
                      backgroundColor: theme === 'dark' ? '#343a40' : '#f8f9fa',
                      borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                    }}
                  />
                  <div className="invalid-feedback">{errors.confirmPassword?.message}</div>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Age</label>
                  <input
                    {...register('age')}
                    type="number"
                    className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-secondary dark-placeholder' : 'light-placeholder'} ${errors.age ? 'is-invalid' : ''}`}
                    placeholder="Enter Age"
                    style={{
                      backgroundColor: theme === 'dark' ? '#343a40' : '#f8f9fa',
                      borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                    }}
                  />
                  <div className="invalid-feedback">{errors.age?.message}</div>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Phone Number</label>
                  <input
                    {...register('phone')}
                    type="text"
                    className={`form-control ${theme === 'dark' ? 'bg-dark text-white border-secondary dark-placeholder' : 'light-placeholder'} ${errors.phone ? 'is-invalid' : ''}`}
                    placeholder="Enter Phone Number"
                    style={{
                      backgroundColor: theme === 'dark' ? '#343a40' : '#f8f9fa',
                      borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                    }}
                  />
                  <div className="invalid-feedback">{errors.phone?.message}</div>
                </div>

                {showTypeDropdown && (
                  <div className="col-md-12 mb-3">
                    <div className="row align-items-center">
                      <label className="form-label fw-bold">Type</label>
                      <div className="col-md-6">
                        <select
                          {...register('type')}
                          className={`form-select ${theme === 'dark' ? 'bg-dark text-white border-secondary' : ''} ${errors.type ? 'is-invalid' : ''}`}
                          style={{
                            backgroundColor: theme === 'dark' ? '#343a40' : '#f8f9fa',
                            borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>Select Type</option>
                          {typeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <div className="invalid-feedback">{errors.type?.message}</div>
                      </div>
                      <div className="col-md-6 d-flex align-items-start mt-4 mt-md-0">
                        <input
                          type="checkbox"
                          className={`form-check-input me-2 ${theme === 'dark' ? 'bg-dark text-white border-secondary' : ''} ${errors.terms ? 'is-invalid' : ''}`}
                          {...register('terms')}
                          style={{
                              borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                              marginTop: '0.2rem'
                          }}
                        />
                        <div>
                          <label className="form-check-label mb-0">
                            I accept the <a className={`${theme === 'dark' ? 'text-white' : ''}`} href="/termsconditions">Terms & Conditions</a>
                          </label>
                          <div style={{ minHeight: '1.25rem' }}>
                            {errors.terms && (
                              <div className="invalid-feedback d-block">{errors.terms.message}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-end">
                <button 
                  type="submit"
                  className={`btn fw-bold py-2 px-4 ${theme === 'dark' ? 'btn-light text-black' : 'btn-primary'}`}
                >
                  Create User
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateUser;