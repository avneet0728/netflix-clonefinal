import { useNavigate } from "react-router-dom";
import Home from "./Home";

export default function App() {
  const nav  = useNavigate();
  const user = JSON.parse(localStorage.getItem("netflix_user") || "{}");

  const logout = () => {
    localStorage.removeItem("netflix_token");
    localStorage.removeItem("netflix_user");
    nav("/");
  };

  return <Home user={user} onLogout={logout} />;
}
