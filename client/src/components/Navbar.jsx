import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = ({ onNewChat }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="bg-[#171717] border-b border-zinc-800 px-4 py-3
                    flex items-center justify-between shrink-0">

      {/* ✅ Left — Logo */}
      <div className="flex items-center gap-3">
        <h1 className="text-green-400 text-xl font-bold">AskIQ</h1>
        <span className="text-zinc-600 text-xs bg-zinc-800 px-2 py-0.5
                         rounded-full border border-zinc-700">
          RAG Powered
        </span>
      </div>

      {/* ✅ Center — New chat button */}
      <button
        onClick={onNewChat}
        className="text-zinc-400 hover:text-white text-sm
                   transition-colors hidden md:block"
      >
        + New Chat
      </button>

      {/* ✅ Right — User info */}
      <div className="flex items-center gap-3">
        <div className="hidden md:block text-right">
          <p className="text-white text-sm">{user?.name || "User"}</p>
          <p className="text-zinc-500 text-xs">{user?.email || ""}</p>
        </div>

        {/* ✅ Avatar */}
        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center
                        justify-center text-white text-sm font-bold shrink-0">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>

        {/* ✅ Logout */}
        <button
          onClick={handleLogout}
          className="text-zinc-500 hover:text-red-400 text-sm
                     transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;