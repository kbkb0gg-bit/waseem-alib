import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { auth, logout } from "../firebase";
import { LogIn, LogOut, PlusCircle, User, ShieldCheck, Search } from "lucide-react";
import React, { useState, useEffect } from "react";
import AuthModal from "./AuthModal";

export default function Navbar({ user }: { user: any }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/");
    }
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              r
            </div>
            <span className="font-bold text-xl tracking-tight hidden md:inline">reddit-articles</span>
          </Link>

          <div className="flex-1 max-w-xl mx-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, tags, or authors..."
                className="w-full bg-gray-100 border border-transparent hover:border-gray-200 hover:bg-white focus:bg-white focus:border-orange-600 focus:ring-1 focus:ring-orange-600 rounded-full py-1.5 pl-10 pr-4 text-sm outline-none transition-all"
              />
            </form>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {user ? (
              <>
                <Link to="/submit" className="flex items-center gap-1 text-gray-600 hover:text-orange-600 font-medium">
                  <PlusCircle size={20} />
                  <span className="hidden sm:inline">Submit</span>
                </Link>
                <Link to="/profile" className="flex items-center gap-1 text-gray-600 hover:text-orange-600 font-medium">
                  <User size={20} />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
                <Link to="/admin" className="text-gray-400 hover:text-gray-600">
                  <ShieldCheck size={20} />
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-gray-600 hover:text-red-600 font-medium cursor-pointer"
                >
                  <LogOut size={20} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1 bg-orange-600 text-white px-4 py-1.5 rounded-full font-bold hover:bg-orange-700 transition-colors cursor-pointer"
              >
                <LogIn size={20} />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}
