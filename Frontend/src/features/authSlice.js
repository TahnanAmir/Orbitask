import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: JSON.parse(localStorage.getItem('loggedInUser')) || null,
  token: localStorage.getItem('authToken') || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;

      localStorage.setItem('loggedInUser', JSON.stringify(user));
      localStorage.setItem('authToken', token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('loggedInUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('theme');
      localStorage.removeItem('sidebarCollapse');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
