import React, { useState, useEffect, useRef } from "react";
import { Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { User, Mail, Globe, FileText, Save, CheckCircle2, Camera, ArrowRight, MessageSquare, ThumbsUp } from "lucide-react";
import { auth } from "../firebase";
import { updateProfile } from "firebase/auth";

export default function Profile({ user }: { user: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserArticles();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${user.uid}`);
      const data = await response.json();
      setProfile(data);
      setName(data.name || "");
      setBio(data.bio || "");
      setWebsite(data.website || "");
      setPhotoURL(data.photoURL || user.photoURL || "");
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch profile", error);
      setLoading(false);
    }
  };

  const fetchUserArticles = async () => {
    try {
      const response = await fetch(`/api/users/${user.uid}/articles`);
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error("Failed to fetch articles", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPhotoURL(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      // Update Firebase Auth profile if photoURL changed
      if (auth.currentUser && photoURL !== user.photoURL) {
        // Note: Firebase photoURL has a length limit, so we might just rely on the backend for large base64
        // But we'll try to update it anyway, it might fail if it's too large.
        try {
          await updateProfile(auth.currentUser, { displayName: name, photoURL: photoURL.length < 2000 ? photoURL : user.photoURL });
        } catch (e) {
          console.warn("Could not update Firebase profile photoURL (might be too large), saving to backend only.");
        }
      }

      const token = await user.getIdToken();
      const response = await fetch("/api/users/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, bio, website, photoURL }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Helmet>
        <title>Your Profile - Reddit Articles</title>
      </Helmet>

      {/* Left Column: Profile Edit */}
      <div className="lg:col-span-1">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden sticky top-20">
          <div className="h-24 bg-orange-600"></div>
          <div className="px-6 pb-6 relative flex flex-col items-center">
            <div className="-mt-12 mb-3">
              <div className="relative group">
                <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center text-orange-600 overflow-hidden">
                  {photoURL ? (
                    <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} />
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="text-white" size={24} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>

            <div className="text-center w-full">
              <h1 className="text-xl font-bold text-gray-900">{profile?.name || user.displayName || user.email.split('@')[0]}</h1>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Your Analytics</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                  <div className="text-xs text-orange-800 font-bold mb-1">Article Clicks</div>
                  <div className="text-2xl font-black text-orange-600">
                    {articles.reduce((sum, article) => sum + (article.views || 0), 0)}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="text-xs text-blue-800 font-bold mb-1">Outbound Clicks</div>
                  <div className="text-2xl font-black text-blue-600">
                    {(profile?.outboundClicks || 0) + articles.reduce((sum, article) => sum + (article.outboundClicks || 0), 0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Edit Profile</h2>

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg mb-4 flex items-center gap-2 text-xs">
                  <CheckCircle2 size={16} />
                  <span>Profile updated!</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent outline-none text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Bio</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="w-full pl-9 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent outline-none min-h-[80px] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full pl-9 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold hover:bg-orange-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-sm"
                >
                  {saving ? "Saving..." : (
                    <>
                      <Save size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: User's Articles */}
      <div className="lg:col-span-2">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
            <FileText className="text-orange-600" size={24} />
            Your Published Articles
          </h2>

          {articles.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <FileText className="mx-auto text-gray-400 mb-3" size={48} />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No articles yet</h3>
              <p className="text-gray-500 text-sm mb-4">You haven't published any articles.</p>
              <Link 
                to="/submit" 
                className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-2 rounded-full font-bold hover:bg-orange-700 transition-colors text-sm"
              >
                Create Your First Post
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <div key={article.id} className="border border-gray-100 rounded-lg p-4 hover:border-orange-200 hover:shadow-sm transition-all group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Link to={`/story/${article.slug}`}>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                          {article.title}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={14} />
                          {article.votes} votes
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(article.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <Link 
                      to={`/story/${article.slug}`}
                      className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-100 transition-colors"
                    >
                      <ArrowRight size={20} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
