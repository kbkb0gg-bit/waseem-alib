import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ArticleDetail from "./pages/ArticleDetail";
import SubmitArticle from "./pages/SubmitArticle";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import React, { useEffect, useState } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth } from "./firebase";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        const token = await result.user.getIdToken();
        await fetch("/api/users/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });
      }
    }).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <Router>
        <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex flex-col">
          <Navbar user={user} />
          <main className="max-w-5xl mx-auto px-4 py-6 flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/story/:slug" element={<ArticleDetail user={user} />} />
              <Route path="/submit" element={<SubmitArticle user={user} />} />
              <Route path="/profile" element={<Profile user={user} />} />
              <Route path="/user/:uid" element={<PublicProfile currentUser={user} />} />
            </Routes>
          </main>
          <footer className="bg-white border-t border-gray-200 py-8 mt-12">
            <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  r
                </div>
                <span className="font-bold text-gray-900">reddit-articles</span>
              </div>
              <div className="flex items-center gap-6 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <span>© 2026 Reddit Articles</span>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </HelmetProvider>
  );
}
