import { createBrowserRouter, RouterProvider, useNavigate } from "react-router-dom";
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import TermsConditions from './pages/TermsConditions';
import SessionManager from './components/SessionManager';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import Help from "./pages/Help";
import Sprints from "./pages/Sprints";
import './App.css'
import Backlog from "./pages/Backlog";
import History from "./pages/History";
import CreateUser from "./pages/CreateUser";

function App() {

  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <>
          <SessionManager/>
          <ProtectedRoute>
            <Home/>
          </ProtectedRoute>
        </>
      )
    },
    {
      path: "/projects",
      element: (
        <>
          <SessionManager/>
          <ProtectedRoute>
            <Projects/>
          </ProtectedRoute>
        </>
      )
    },
    {
      path: "/backlog",
      element: (
        <>
          <SessionManager/>
          <ProtectedRoute>
            <Backlog/>
          </ProtectedRoute>
        </>
      )
    },
    {
      path: "/sprints",
      element: (
        <>
          <SessionManager/>
          <ProtectedRoute>
            <Sprints/>
          </ProtectedRoute>
        </>
      )
    },
    {
      path: "/history",
      element: (
        <>
          <SessionManager/>
          <ProtectedRoute>
            <History/>
          </ProtectedRoute>
        </>
      )
    },
    {
      path: "/createuser",
      element: (
        <>
          <SessionManager/>
          <ProtectedRoute>
            <CreateUser/>
          </ProtectedRoute>
        </>
      )
    },
    {
      path: "/login",
      element: <Login/>
    },
    {
      path: "/termsconditions",
      element: (
        <>
          <SessionManager/>
          <TermsConditions />
        </>
      )
    },
    {
      path: "/help",
      element: (
        <>
          <SessionManager/>
          <Help/>
        </>
      )
    },
    {
      path: "*",
      element: <NotFound />
    }
  ]);

  return (
    <div>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
