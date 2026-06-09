import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import themeReducer from './features/themeSlice';
import sidebarReducer from './features/sidebarSlice';
import searchReducer from './features/searchSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    sidebar: sidebarReducer,
    search: searchReducer,
    },
})