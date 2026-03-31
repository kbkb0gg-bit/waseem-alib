import React, { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { User } from "lucide-react";

export default function CommentSection({ articleId, user }: { articleId: string, user: any }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/articles/${articleId}/comments`);
      const data = await response.json();
      setComments(data.sort((a: any, b: any) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error("Failed to fetch comments", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to comment");
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/articles/${articleId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newComment }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments(prev => [comment, ...prev]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Comment failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
        Comments ({comments.length})
      </h2>

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="What are your thoughts?"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent outline-none min-h-[100px] text-sm"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="bg-orange-600 text-white px-6 py-1.5 rounded-full font-bold hover:bg-orange-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Posting..." : "Comment"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
          <p className="text-sm text-gray-600">Please login to join the conversation.</p>
        </div>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
              <User size={16} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs mb-1">
                <span className="font-bold text-gray-900">u/{comment.authorName}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-500">{formatDistanceToNow(comment.createdAt)} ago</span>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">
                {comment.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
