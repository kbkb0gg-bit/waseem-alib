import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AlertCircle, CheckCircle2, Send, MailWarning } from "lucide-react";
import { sendVerificationEmail } from "../firebase";

export default function SubmitArticle({ user }: { user: any }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  if (!user) {
    return <Navigate to="/" />;
  }

  if (!user.emailVerified) {
    return (
      <div className="max-w-3xl mx-auto">
        <Helmet>
          <title>Verify Email - Reddit Articles</title>
        </Helmet>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MailWarning size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-600 mb-6">
            You need to verify your email address ({user.email}) before you can publish articles.
            Please check your inbox for the verification link.
          </p>
          
          {resendSuccess ? (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg inline-block font-medium">
              Verification email sent! Please check your inbox.
            </div>
          ) : (
            <button
              onClick={async () => {
                setResending(true);
                try {
                  await sendVerificationEmail(user);
                  setResendSuccess(true);
                } catch (err: any) {
                  alert(err.message || "Failed to resend verification email.");
                } finally {
                  setResending(false);
                }
              }}
              disabled={resending}
              className="bg-orange-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend Verification Email"}
            </button>
          )}
          
          <p className="text-sm text-gray-500 mt-6">
            After verifying, please refresh this page.
          </p>
        </div>
      </div>
    );
  }

  const charCount = description.trim().length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (title.length < 30 || title.length > 100) {
      setError("Title must be between 30 and 100 characters.");
      return;
    }
    if (charCount < 300) {
      setError(`Description must be at least 300 characters. Current count: ${charCount}`);
      return;
    }

    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          website,
          tags: tags.split(",").map(t => t.trim()).filter(t => t.length > 0),
        }),
      });

      if (response.ok) {
        const article = await response.json();
        setSuccess(true);
        setTimeout(() => navigate(`/story/${article.slug}`), 2000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to submit article.");
      }
    } catch (error) {
      console.error("Submission failed", error);
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Helmet>
        <title>Submit Article - Reddit Articles</title>
      </Helmet>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
          <Send className="text-orange-600" size={24} />
          Create a Post
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3 text-sm">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3 text-sm">
            <CheckCircle2 size={20} />
            <span>Article published successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Title (30-100 characters)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="An interesting title for your story"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent outline-none text-sm"
              required
            />
            <div className="flex justify-end mt-1">
              <span className={`text-[10px] font-bold ${title.length < 30 || title.length > 100 ? 'text-red-500' : 'text-gray-400'}`}>
                {title.length}/100
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description (min 300 characters)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell your story in detail..."
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent outline-none min-h-[300px] text-sm leading-relaxed"
              required
            />
            <div className="flex justify-end mt-1">
              <span className={`text-[10px] font-bold ${charCount < 300 ? 'text-red-500' : 'text-gray-400'}`}>
                {charCount} characters
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Website (optional)</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tech, news, story"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={submitting || success}
              className="bg-orange-600 text-white px-8 py-2 rounded-full font-bold hover:bg-orange-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {submitting ? "Publishing..." : (
                <>
                  <Send size={18} />
                  <span>Post Article</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
