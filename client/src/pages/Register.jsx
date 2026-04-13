import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // ✅ Validation
    if (!form.name || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/api/auth/register", form);
      // ✅ Auto login after register
      login(res.data.token, res.data.user);
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-zinc-900">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-800 p-6 rounded-lg w-80 space-y-4 shadow-lg"
      >
        {/* Logo/Title */}
        <div className="text-center">
          <h1 className="text-green-400 text-2xl font-bold">AskIQ</h1>
          <p className="text-zinc-400 text-sm mt-1">Create your account</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400
                          text-sm p-2 rounded">
            {error}
          </div>
        )}

        {/* Name */}
        <input
          type="text"
          placeholder="Full Name"
          value={form.name}
          className="w-full p-2 bg-zinc-700 text-white rounded
                     focus:outline-none focus:ring-2 focus:ring-green-500"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          className="w-full p-2 bg-zinc-700 text-white rounded
                     focus:outline-none focus:ring-2 focus:ring-green-500"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={form.password}
          className="w-full p-2 bg-zinc-700 text-white rounded
                     focus:outline-none focus:ring-2 focus:ring-green-500"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800
                     disabled:cursor-not-allowed text-white p-2 rounded
                     transition-colors font-medium"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="text-sm text-center text-zinc-400">
          Already have an account?{" "}
          <Link to="/login" className="text-green-400 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;