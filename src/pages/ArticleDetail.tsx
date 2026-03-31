import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowBigUp, ArrowBigDown, ExternalLink, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import CommentSection from "../components/CommentSection";

export default function ArticleDetail({ user }: { user: any }) {
  const { slug } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [slug]);

  const fetchArticle = async () => {
    try {
      const response = await fetch(`/api/articles/${slug}`);
      const data = await response.json();
      setArticle(data);
      setLoading(false);
      
      // Track view
      if (data && data.id) {
        fetch(`/api/articles/${data.id}/view`, { method: "POST" }).catch(console.error);
      }
    } catch (error) {
      console.error("Failed to fetch article", error);
      setLoading(false);
    }
  };

  const handleWebsiteClick = async () => {
    try {
      if (article && article.id) {
        await fetch(`/api/articles/${article.id}/click`, { method: "POST" });
      }
    } catch (error) {
      console.error("Failed to record click", error);
    }
  };

  const handleVote = async (type: 'up' | 'down') => {
    if (!user) {
      alert("Please login to vote");
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/articles/${article.id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const updatedArticle = await response.json();
        setArticle(updatedArticle);
      }
    } catch (error) {
      console.error("Vote failed", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
        <Link to="/" className="text-orange-600 font-bold hover:underline">Go back home</Link>
      </div>
    );
  }

  const isUpvoted = article.upvotedBy?.includes(user?.uid);
  const isDownvoted = article.downvotedBy?.includes(user?.uid);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Helmet>
        <title>{article.title} - Reddit Articles</title>
        <meta name="description" content={article.description.substring(0, 160)} />
      </Helmet>

      <div className="lg:col-span-2">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="flex">
            {/* Voting Sidebar */}
            <div className="w-10 bg-gray-50 flex flex-col items-center py-4 gap-1">
              <button 
                onClick={() => handleVote('up')}
                className={`p-1 rounded hover:bg-gray-200 ${isUpvoted ? 'text-orange-600' : 'text-gray-400'}`}
              >
                <ArrowBigUp size={28} fill={isUpvoted ? "currentColor" : "none"} />
              </button>
              <span className={`text-sm font-bold ${isUpvoted ? 'text-orange-600' : isDownvoted ? 'text-blue-600' : 'text-gray-900'}`}>
                {article.votes || 0}
              </span>
              <button 
                onClick={() => handleVote('down')}
                className={`p-1 rounded hover:bg-gray-200 ${isDownvoted ? 'text-blue-600' : 'text-gray-400'}`}
              >
                <ArrowBigDown size={28} fill={isDownvoted ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 sm:p-6">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                  <User size={12} />
                </div>
                <Link to={`/user/${article.authorUid}`} className="font-bold text-gray-900 hover:underline">
                  u/{article.authorName}
                </Link>
                <span>•</span>
                <span>{formatDistanceToNow(article.createdAt)} ago</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-6">
                {article.title}
              </h1>

              <div className="prose prose-sm sm:prose-base max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap mb-8">
                {article.description}
              </div>

              {article.website && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="text-blue-600" size={20} />
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Related Website</p>
                      <a 
                        href={article.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={handleWebsiteClick}
                        className="text-sm font-bold text-blue-800 hover:underline break-all"
                      >
                        {article.website}
                      </a>
                    </div>
                  </div>
                  <a 
                    href={article.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={handleWebsiteClick}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-blue-700 transition-colors"
                  >
                    Visit
                  </a>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-8">
                {article.tags?.map((tag: string) => (
                  <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                    #{tag}
                  </span>
                ))}
              </div>

              <CommentSection articleId={article.id} user={user} />
            </div>
          </div>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Author Info</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
              <User size={24} />
            </div>
            <div>
              <Link to={`/user/${article.authorUid}`} className="font-bold text-gray-900 hover:underline">
                u/{article.authorName}
              </Link>
              <p className="text-xs text-gray-500">Joined recently</p>
            </div>
          </div>
          <Link 
            to={`/user/${article.authorUid}`}
            className="block w-full text-center bg-orange-600 text-white py-2 rounded-full font-bold hover:bg-orange-700 transition-colors text-sm"
          >
            View Profile
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Rules</h2>
          <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
            <li>Be respectful to others</li>
            <li>No spam or self-promotion</li>
            <li>Provide sources for your claims</li>
            <li>Use descriptive titles</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
