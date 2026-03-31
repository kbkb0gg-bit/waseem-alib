import { Link } from "react-router-dom";
import { ArrowBigUp, ArrowBigDown, MessageSquare, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ArticleCard({ article, user, onVote, hideDescription = false }: { article: any, user: any, onVote: (id: string, type: 'up' | 'down') => void, hideDescription?: boolean, key?: any }) {
  const isUpvoted = article.upvotedBy?.includes(user?.uid);
  const isDownvoted = article.downvotedBy?.includes(user?.uid);

  const handleWebsiteClick = async () => {
    try {
      await fetch(`/api/articles/${article.id}/click`, { method: "POST" });
    } catch (error) {
      console.error("Failed to record click", error);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-400 transition-colors flex overflow-hidden">
      {/* Voting Sidebar */}
      <div className="w-10 bg-gray-50 flex flex-col items-center py-2 gap-1">
        <button 
          onClick={() => onVote(article.id, 'up')}
          className={`p-1 rounded hover:bg-gray-200 ${isUpvoted ? 'text-orange-600' : 'text-gray-400'}`}
        >
          <ArrowBigUp size={24} fill={isUpvoted ? "currentColor" : "none"} />
        </button>
        <span className={`text-xs font-bold ${isUpvoted ? 'text-orange-600' : isDownvoted ? 'text-blue-600' : 'text-gray-900'}`}>
          {article.votes || 0}
        </span>
        <button 
          onClick={() => onVote(article.id, 'down')}
          className={`p-1 rounded hover:bg-gray-200 ${isDownvoted ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <ArrowBigDown size={24} fill={isDownvoted ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-3">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
          <Link to={`/user/${article.authorUid}`} className="font-bold text-gray-900 hover:underline">
            u/{article.authorName}
          </Link>
          <span>•</span>
          <span>{formatDistanceToNow(article.createdAt)} ago</span>
          {article.tags?.map((tag: string) => (
            <span key={tag} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
              #{tag}
            </span>
          ))}
        </div>

        <Link to={`/story/${article.slug}`} className="block">
          <h2 className={`text-lg font-bold text-gray-900 leading-tight hover:underline ${hideDescription ? 'mb-1' : 'mb-2'}`}>
            {article.title}
          </h2>
        </Link>

        {!hideDescription && (
          <p className="text-sm text-gray-600 line-clamp-3 mb-3">
            {article.description}
          </p>
        )}

        <div className={`flex items-center gap-4 text-xs font-bold text-gray-500 ${hideDescription ? 'mt-2' : ''}`}>
          <Link to={`/story/${article.slug}`} className="flex items-center gap-1 hover:bg-gray-100 p-1.5 rounded transition-colors">
            <MessageSquare size={16} />
            <span>Comments</span>
          </Link>
          {article.website && (
            <a 
              href={article.website} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={handleWebsiteClick}
              className="flex items-center gap-1 hover:bg-gray-100 p-1.5 rounded transition-colors text-blue-600"
            >
              <ExternalLink size={16} />
              <span>Website</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
