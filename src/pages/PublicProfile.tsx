import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { User, Globe, FileText, ArrowRight, ThumbsUp, ExternalLink } from "lucide-react";

export default function PublicProfile({ currentUser }: { currentUser: any }) {
  const { uid } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [userRes, articlesRes] = await Promise.all([
          fetch(`/api/users/${uid}`),
          fetch(`/api/users/${uid}/articles`)
        ]);
        
        if (userRes.ok) {
          const userData = await userRes.json();
          setProfile(userData);
        }
        
        if (articlesRes.ok) {
          const articlesData = await articlesRes.json();
          setArticles(articlesData);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    };

    if (uid) {
      fetchProfile();
    }
  }, [uid]);

  const handleWebsiteClick = async (e: React.MouseEvent) => {
    if (!profile?.website) return;
    try {
      await fetch(`/api/users/${uid}/click`, { method: "POST" });
    } catch (error) {
      console.error("Failed to record click", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
        <Link to="/" className="text-orange-600 hover:underline mt-4 inline-block">Return home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Helmet>
        <title>{profile.name}'s Profile - Reddit Articles</title>
      </Helmet>

      {/* Left Column: Profile Info */}
      <div className="lg:col-span-1">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden sticky top-20">
          <div className="h-24 bg-orange-600"></div>
          <div className="px-6 pb-6 relative flex flex-col items-center text-center">
            <div className="-mt-12 mb-3">
              <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center text-orange-600 overflow-hidden">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} />
                )}
              </div>
            </div>

            <div className="w-full">
              <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
              {profile.bio && (
                <p className="text-sm text-gray-600 mt-4 whitespace-pre-wrap">{profile.bio}</p>
              )}
              
              {profile.website && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <a 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={handleWebsiteClick}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium"
                  >
                    <Globe size={16} />
                    {profile.website.replace(/^https?:\/\//, '')}
                    <ExternalLink size={12} className="ml-auto" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: User's Articles */}
      <div className="lg:col-span-2">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
            <FileText className="text-orange-600" size={24} />
            Articles by {profile.name}
          </h2>

          {articles.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <FileText className="mx-auto text-gray-400 mb-3" size={48} />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No articles yet</h3>
              <p className="text-gray-500 text-sm mb-4">This user hasn't published any articles.</p>
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
