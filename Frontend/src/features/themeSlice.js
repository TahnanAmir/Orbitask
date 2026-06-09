import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  mode: localStorage.getItem('theme') || 'light',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.mode);
    },
    setTheme: (state, action) => {
      state.mode = action.payload;
    },
    resetTheme: (state) => {
        state.mode = 'light';
    },
  },
});

export const { toggleTheme, setTheme, resetTheme } = themeSlice.actions;
export default themeSlice.reducer;
