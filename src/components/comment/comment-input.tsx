import { useState, useCallback, Component } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, AlertCircle, X } from "lucide-react";
import toast from "react-hot-toast";

interface CommentInputProps {
  blogId: string;
  onCommentSubmitted: () => void;
  parentCommentId?: string | null;
  parentCommentAuthor?: string;
  onCancelReply?: () => void;
}

class CommentInputErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  state = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-destructive bg-destructive/10 p-4 rounded-lg text-center max-w-full sm:max-w-3xl mx-auto">
          Something went wrong: {this.state.errorMessage}
        </div>
      );
    }
    return this.props.children;
  }
}

function CommentInput({
  blogId,
  onCommentSubmitted,
  parentCommentId = null,
  parentCommentAuthor,
  onCancelReply,
}: CommentInputProps) {
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const maxLength = 500;

  const getToken = () => {
    const token = localStorage.getItem("token");
    console.log(
      "[CommentInput] Token retrieved from localStorage:",
      token ? "Present" : "Absent"
    );
    return token;
  };

  const handleSubmit = useCallback(async () => {
    const token = getToken();
    if (!token) {
      console.log("[CommentInput] No token found, redirecting to /auth");
      toast.error("Please log in to comment", {
        duration: 3000,
        position: "top-right",
        style: {
          background: document.documentElement.classList.contains("dark")
            ? "#1f2937"
            : "#ffffff",
          color: document.documentElement.classList.contains("dark")
            ? "#ffffff"
            : "#000000",
          border: "1px solid",
          borderColor: document.documentElement.classList.contains("dark")
            ? "#4b5563"
            : "#e5e7eb",
        },
      });
      navigate("/auth");
      return;
    }

    if (!commentText.trim()) {
      console.log("[CommentInput] Empty comment submitted");
      setError("Comment cannot be empty");
      toast.error("Comment cannot be empty", {
        duration: 3000,
        position: "top-right",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
        style: {
          background: document.documentElement.classList.contains("dark")
            ? "#1f2937"
            : "#ffffff",
          color: document.documentElement.classList.contains("dark")
            ? "#ffffff"
            : "#000000",
          border: "1px solid",
          borderColor: document.documentElement.classList.contains("dark")
            ? "#4b5563"
            : "#e5e7eb",
        },
      });
      return;
    }

    setLoading(true);
    setError("");
    console.log(
      "[CommentInput] Submitting comment for blogId:",
      blogId,
      "parentCommentId:",
      parentCommentId
    );

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/blogs/${blogId}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: commentText.trim(),
            parentComment: parentCommentId,
          }),
        }
      );

      const data = await response.json();
      console.log("[CommentInput] API response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit comment");
      }

      toast.success(
        parentCommentId
          ? "Reply submitted successfully!"
          : "Comment submitted successfully!",
        {
          duration: 2000,
          position: "top-right",
          icon: <Send className="h-5 w-5 text-primary" />,
          style: {
            background: document.documentElement.classList.contains("dark")
              ? "#1f2937"
              : "#ffffff",
            color: document.documentElement.classList.contains("dark")
              ? "#ffffff"
              : "#000000",
            border: "1px solid",
            borderColor: document.documentElement.classList.contains("dark")
              ? "#4b5563"
              : "#e5e7eb",
          },
        }
      );

      setCommentText("");
      onCommentSubmitted();
      if (parentCommentId && onCancelReply) {
        onCancelReply();
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit comment";
      console.error("[CommentInput] Error submitting comment:", errorMessage);
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 3000,
        position: "top-right",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
        style: {
          background: document.documentElement.classList.contains("dark")
            ? "#1f2937"
            : "#ffffff",
          color: document.documentElement.classList.contains("dark")
            ? "#ffffff"
            : "#000000",
          border: "1px solid",
          borderColor: document.documentElement.classList.contains("dark")
            ? "#4b5563"
            : "#e5e7eb",
        },
      });
    } finally {
      setLoading(false);
      console.log("[CommentInput] Loading state set to false");
    }
  }, [
    blogId,
    commentText,
    onCommentSubmitted,
    parentCommentId,
    onCancelReply,
    navigate,
  ]);

  const token = getToken();

  return (
    <CommentInputErrorBoundary>
      <div className="max-w-full sm:max-w-3xl mx-auto p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6 animate-fade-in-up">
          {parentCommentId
            ? `Replying to ${parentCommentAuthor}`
            : "Add a Comment"}
        </h2>
        <div className="relative group">
          {parentCommentId && (
            <button
              onClick={onCancelReply}
              className="absolute top-0 right-0 text-muted-foreground hover:text-primary transition-colors"
              aria-label="Cancel reply"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <div className="relative">
            <textarea
              value={commentText}
              onChange={(e) =>
                setCommentText(e.target.value.slice(0, maxLength))
              }
              placeholder={
                token
                  ? parentCommentId
                    ? "Write your reply here..."
                    : "Write your comment here..."
                  : "Log in to comment"
              }
              className="w-full p-3 sm:p-4 pr-12 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 resize-y min-h-[120px] text-sm sm:text-base font-sans shadow-sm hover:shadow-md"
              aria-label={parentCommentId ? "Reply input" : "Comment input"}
              disabled={loading || !token}
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="absolute right-3 top-3 sm:top-4 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={parentCommentId ? "Submit reply" : "Submit comment"}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
          <div
            className={`mt-2 text-sm text-right ${
              commentText.length > 450
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {commentText.length}/{maxLength}
          </div>
          {error && (
            <div className="mt-3 sm:mt-4 text-destructive bg-destructive/10 p-3 sm:p-4 rounded-lg text-sm sm:text-base animate-fade-in flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}
          {!token && (
            <div className="mt-3 sm:mt-4 text-muted-foreground bg-accent/10 p-3 sm:p-4 rounded-lg text-sm sm:text-base animate-fade-in flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>
                Please{" "}
                <button
                  onClick={() => navigate("/auth")}
                  className="text-primary hover:underline font-medium"
                >
                  log in
                </button>{" "}
                to leave a comment.
              </span>
            </div>
          )}
        </div>
      </div>
    </CommentInputErrorBoundary>
  );
}

export default CommentInput;
