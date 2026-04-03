import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { ShieldCheck, Users, FileText, MessageSquare, Trash2, Search, Database, BarChart3, LogOut } from "lucide-react";

// For Netlify deployment, you can set VITE_API_URL in Netlify environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "articles" | "comments">("articles");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: {
          "x-admin-password": password,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setIsAuthorized(true);
      } else {
        setError("Invalid admin password.");
      }
    } catch (error) {
      setError("Failed to connect to admin API. Check if your backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/${type}/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": password,
        },
      });

      if (response.ok) {
        // Refresh stats
        const statsResponse = await fetch(`${API_BASE_URL}/api/admin/stats`, {
          headers: { "x-admin-password": password },
        });
        const data = await statsResponse.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    setPassword("");
    setStats(null);
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto mt-20 px-4">
        <Helmet>
          <title>Admin Login - Reddit Articles</title>
        </Helmet>
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mx-auto mb-6">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-sm text-gray-500 mb-8">Enter the secret password to access the dashboard.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent outline-none text-center"
              required
            />
            {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Verifying..." : "Access Dashboard"}
            </button>
          </form>
          <p className="mt-6 text-[10px] text-gray-400 uppercase tracking-widest">Hint: admin_secret_123</p>
        </div>
      </div>
    );
  }

  const filteredData = stats ? stats[activeTab].filter((item: any) => {
    const searchStr = searchTerm.toLowerCase();
    if (activeTab === "users") return item.name?.toLowerCase().includes(searchStr) || item.email?.toLowerCase().includes(searchStr);
    if (activeTab === "articles") return item.title?.toLowerCase().includes(searchStr) || item.authorName?.toLowerCase().includes(searchStr);
    if (activeTab === "comments") return item.text?.toLowerCase().includes(searchStr) || item.authorName?.toLowerCase().includes(searchStr);
    return true;
  }) : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <Helmet>
        <title>Admin Dashboard - Reddit Articles</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="text-orange-600" size={28} />
          Admin Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="bg-transparent outline-none text-sm w-40 sm:w-60"
            />
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Articles</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalArticles}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
            <MessageSquare size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Comments</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalComments}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("articles")}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === "articles" ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50/30" : "text-gray-500 hover:bg-gray-50"}`}
          >
            Articles
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === "users" ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50/30" : "text-gray-500 hover:bg-gray-50"}`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === "comments" ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50/30" : "text-gray-500 hover:bg-gray-50"}`}
          >
            Comments
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-widest border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">ID / UID</th>
                <th className="px-6 py-4">Content / Name</th>
                <th className="px-6 py-4">Author / Email</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((item: any) => (
                <tr key={item.id || item.uid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-[10px] text-gray-400">
                    {(item.id || item.uid).substring(0, 12)}...
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate font-bold text-gray-900">
                      {activeTab === "articles" ? item.title : activeTab === "users" ? item.name : item.text}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {activeTab === "users" ? item.email : item.authorName}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(activeTab, item.id || item.uid)}
                      className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="py-20 text-center text-gray-400">
            <Database size={48} className="mx-auto mb-4 opacity-20" />
            <p>No data found matching your search.</p>
          </div>
        )}
      </div>

      {/* Raw JSON View */}
      <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 size={18} className="text-orange-500" />
            Raw JSON Data View
          </h2>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">Read-Only</span>
        </div>
        <div className="bg-black/50 rounded-lg p-4 max-h-[400px] overflow-auto font-mono text-xs text-green-400">
          <pre>{JSON.stringify(stats, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
