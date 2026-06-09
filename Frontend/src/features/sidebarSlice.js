import { createSlice } from '@reduxjs/toolkit';

const stored = localStorage.getItem('sidebarCollapse');

const initialState = {
  isCollapsed: stored !== null ? JSON.parse(stored) : false,
};

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleCollapse: (state) => {
      state.isCollapsed = !state.isCollapsed;
      localStorage.setItem('sidebarCollapse', JSON.stringify(state.isCollapsed));
    },
    resetSidebar: (state) => {
      state.isCollapsed = false;
    },
  },
});

export const { toggleCollapse, resetSidebar } = sidebarSlice.actions;
export default sidebarSlice.reducer;
