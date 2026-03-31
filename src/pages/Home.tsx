import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import ArticleCard from "../components/ArticleCard";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const [articles, setArticles] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q")?.toLowerCase() || "";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    fetchArticles();
    return () => unsubscribe();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch("/api/articles");
      const data = await response.json();
      setArticles(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch articles", error);
      setLoading(false);
    }
  };

  const handleVote = async (id: string, type: 'up' | 'down') => {
    if (!user) {
      alert("Please login to vote");
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/articles/${id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const updatedArticle = await response.json();
        setArticles(prev => prev.map(a => a.id === id ? updatedArticle : a));
      }
    } catch (error) {
      console.error("Vote failed", error);
    }
  };

  const trendingArticles = [...articles].sort((a, b) => b.votes - a.votes).slice(0, 5);

  const filteredArticles = articles.filter(article => {
    if (!searchQuery) return true;
    const titleMatch = article.title?.toLowerCase().includes(searchQuery);
    const authorMatch = article.authorName?.toLowerCase().includes(searchQuery);
    const tagsMatch = article.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery));
    return titleMatch || authorMatch || tagsMatch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Helmet>
        <title>{searchQuery ? `Search: ${searchQuery} - Reddit Articles` : 'Reddit Articles - Latest Stories'}</title>
        <meta name="description" content="Discover the latest articles and stories on our Reddit-style content platform." />
      </Helmet>

      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          {searchQuery ? `Search Results for "${searchQuery}"` : 'Latest Articles'}
        </h1>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
            <ArticleCard 
              key={article.id} 
              article={article} 
              user={user} 
              onVote={handleVote} 
              hideDescription={true}
            />
          ))
        ) : (
          <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-500">
              {searchQuery ? 'No articles found matching your search.' : 'No articles yet. Be the first to publish!'}
            </p>
          </div>
        )}
      </div>

      <aside className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Trending Section</h2>
          <div className="space-y-4">
            {trendingArticles.map((article, idx) => (
              <div key={article.id} className="flex gap-3">
                <span className="text-2xl font-bold text-gray-200">{idx + 1}</span>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 hover:underline">
                    <a href={`/story/${article.slug}`}>{article.title}</a>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span>u/{article.authorName}</span>
                    <span>•</span>
                    <span className="text-orange-600 font-bold">{article.votes} votes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">About Community</h2>
          <p className="text-sm text-gray-600 mb-4">
            Welcome to the Reddit-style article platform. Share your stories, earn upvotes, and engage with the community.
          </p>
          <div className="border-t border-gray-100 pt-4 flex justify-between text-sm">
            <div className="flex flex-col">
              <span className="font-bold">{articles.length}</span>
              <span className="text-gray-500 text-xs">Articles</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold">24/7</span>
              <span className="text-gray-500 text-xs">Active</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
