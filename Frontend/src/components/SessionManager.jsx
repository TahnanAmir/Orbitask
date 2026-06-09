import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/authSlice";


const SessionManager = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const timeoutRef = useRef(null); // holds the ID of the timeout timer (used to clear or reset it)

  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        alert("Your session has expired due to inactivity. Please log in again to continue.");
        dispatch(logout());
        navigate("/login");
      }, 10 * 60 * 1000); // 10 minutes
    };

    const activityEvents = ["mousemove", "keydown", "click"];

    activityEvents.forEach(event =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer();

    return () => {
      activityEvents.forEach(event =>
        window.removeEventListener(event, resetTimer)
      );
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user, dispatch, navigate]);

  return null; // Because SessionManager is a non-visual component — its only job is to run side effects (like auto-logout timers), not to render anything on the screen
};

export default SessionManager;
