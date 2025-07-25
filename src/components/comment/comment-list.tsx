import { useState, useCallback, useEffect, Component } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  AlertCircle,
  X,
  ThumbsUp,
  Reply,
  Trash2,
  Edit,
  Pin,
} from "lucide-react";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import type { EmojiClickData } from "emoji-picker-react";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  _id: string;
  username: string;
  email: string;
  role?: string;
}

interface Comment {
  _id: string;
  text: string;
  user: User;
  createdAt: string;
  likes: string[];
  replies?: Comment[];
  parentComment?: string | null;
  pinned?: boolean;
  edited?: boolean;
  editedAt?: string;
}

interface CommentInputProps {
  blogId: string;
  onCommentSubmitted: (newComment: Comment) => void;
  parentCommentId?: string | null;
  parentCommentAuthor?: string;
  onCancelReply?: () => void;
}

interface CommentListProps {
  blogId: string;
}

interface CommentInputErrorBoundaryProps {
  children: ReactNode;
}

interface CommentInputErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class CommentInputErrorBoundary extends Component<
  CommentInputErrorBoundaryProps,
  CommentInputErrorBoundaryState
> {
  state: CommentInputErrorBoundaryState = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(
    error: Error
  ): CommentInputErrorBoundaryState {
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
  const { user } = useAuth();
  const [commentText, setCommentText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const maxLength = 500;

  const getToken = (): string | null => {
    const token = localStorage.getItem("token");
    console.log(
      "[CommentInput] Token retrieved from localStorage:",
      token ? "Present" : "Absent"
    );
    return token;
  };

  const handleSubmit = useCallback(async () => {
    const token = getToken();
    if (!token || !user) {
      toast.error("Please log in to comment", {
        duration: 4000,
        position: "top-right",
        style: {
          background: document.documentElement.classList.contains("dark")
            ? "#1f2937"
            : "#ffffff",
          color: document.documentElement.classList.contains("dark")
            ? "#ffffff"
            : "#000000",
        },
      });
      navigate("/auth");
      return;
    }

    if (!commentText.trim()) {
      setError("Comment cannot be empty");
      toast.error("Comment cannot be empty", { duration: 4000 });
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("[CommentInput] Sending request with headers:", {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });
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

      const newComment: Comment = data.data;
      toast.success(
        parentCommentId ? "Reply submitted!" : "Comment submitted!",
        {
          duration: 3000,
          icon: <Send className="h-5 w-5 text-primary" />,
        }
      );

      setCommentText("");
      setShowPreview(false);
      onCommentSubmitted(newComment);
      if (parentCommentId && onCancelReply) onCancelReply();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit comment";
      console.error("[CommentInput] Error:", errorMessage);
      setError(errorMessage);
      if (
        errorMessage.includes("Invalid token") ||
        errorMessage.includes("Token expired")
      ) {
        localStorage.removeItem("token");
        navigate("/auth");
        toast.error("Session invalid, please log in again", { duration: 4000 });
      } else {
        toast.error(errorMessage, { duration: 4000 });
      }
    } finally {
      setLoading(false);
    }
  }, [
    blogId,
    commentText,
    onCommentSubmitted,
    parentCommentId,
    onCancelReply,
    navigate,
    user,
  ]);

  const handleEmojiClick = (emojiObject: EmojiClickData) => {
    setCommentText((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const token = getToken();

  return (
    <CommentInputErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-full sm:max-w-3xl mx-auto p-4 sm:p-6 bg-card rounded-lg shadow-lg"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {parentCommentId
              ? `Replying to ${parentCommentAuthor}`
              : "Add a Comment"}
          </h2>
          {parentCommentId && (
            <Button
              variant="ghost"
              onClick={onCancelReply}
              aria-label="Cancel reply"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="relative">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value.slice(0, maxLength))}
            placeholder={
              token
                ? parentCommentId
                  ? "Write your reply..."
                  : "Write your comment..."
                : "Log in to comment"
            }
            className="w-full p-4 pr-12 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 transition-all duration-300 resize-y min-h-[120px] text-sm sm:text-base shadow-sm hover:shadow-md"
            aria-label={parentCommentId ? "Reply input" : "Comment input"}
            disabled={loading || !token}
          />
          <div className="absolute right-4 top-4 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              aria-label="Toggle emoji picker"
            >
              😊
            </motion.button>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={handleSubmit}
                disabled={loading || !commentText.trim()}
                className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50"
                aria-label={parentCommentId ? "Submit reply" : "Submit comment"}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-2"
            >
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-2 space-y-2">
          <div className="flex justify-between items-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                aria-label="Toggle preview"
              >
                {showPreview ? "Edit" : "Preview"}
              </Button>
            </motion.div>
            <span
              className={`text-sm ${
                commentText.length > 450
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {commentText.length}/{maxLength}
            </span>
          </div>
          <Progress
            value={(commentText.length / maxLength) * 100}
            className="h-2"
          />
        </div>

        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-4 bg-muted rounded-lg"
            >
              <h3 className="text-sm font-semibold mb-2">Preview</h3>
              <p className="text-foreground">
                {commentText || "Nothing to preview"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 text-destructive bg-destructive/10 p-4 rounded-lg flex items-center"
            >
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {!token && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-4 text-muted-foreground bg-accent/10 p-4 rounded-lg flex items-center"
          >
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
          </motion.div>
        )}
      </motion.div>
    </CommentInputErrorBoundary>
  );
}

function CommentList({ blogId }: CommentListProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const getToken = (): string | null => {
    const token = localStorage.getItem("token");
    console.log("[CommentList] Token retrieved:", token ? "Present" : "Absent");
    return token;
  };

  const fetchComments = useCallback(async () => {
    try {
      const token = getToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      console.log("[fetchComments] Sending request with headers:", headers);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/blogs/${blogId}/comment`,
        {
          method: "GET",
          headers,
        }
      );

      const data = await response.json();
      console.log("[fetchComments] API response:", data);
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch comments");
      }

      setComments(data.comments);
      setLoading(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch comments";
      setError(errorMessage);
      toast.error(errorMessage, { duration: 4000 });
      setLoading(false);
    }
  }, [blogId]);

  const handleLike = async (commentId: string) => {
    try {
      const token = getToken();
      if (!token) throw new Error("Please log in to like a comment");

      console.log("[handleLike] Sending request with token:", token);
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_API
        }/blogs/${blogId}/comment/${commentId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("[handleLike] API response:", data);
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to like comment");
      }

      setComments((prevComments) =>
        updateCommentLikes(prevComments, commentId, data.comment.likes)
      );
      toast.success(data.message || "Comment liked!", { duration: 2000 });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to like comment";
      console.error("[handleLike] Error:", errorMessage);
      toast.error(errorMessage, { duration: 4000 });
    }
  };

  const handleEdit = async (commentId: string) => {
    try {
      const token = getToken();
      if (!token) throw new Error("Please log in to edit a comment");

      console.log("[handleEdit] Sending request with token:", token);
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_API
        }/blogs/${blogId}/comment/${commentId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: editContent }),
        }
      );

      const data = await response.json();
      console.log("[handleEdit] API response:", data);
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update comment");
      }

      setComments((prevComments) =>
        updateComment(prevComments, commentId, {
          text: editContent,
          edited: true,
          editedAt: new Date().toISOString(),
        })
      );
      setEditingComment(null);
      setEditContent("");
      toast.success("Comment updated!", { duration: 2000 });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update comment";
      console.error("[handleEdit] Error:", errorMessage);
      toast.error(errorMessage, { duration: 4000 });
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const token = getToken();
      if (!token) throw new Error("Please log in to delete a comment");

      console.log("[handleDelete] Sending request with token:", token);
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_API
        }/blogs/${blogId}/comment/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("[handleDelete] API response:", data);
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete comment");
      }

      setComments((prevComments) =>
        prevComments.filter(
          (comment) =>
            comment._id !== commentId &&
            !comment.replies?.some((reply) => reply._id === commentId)
        )
      );
      toast.success("Comment deleted successfully", { duration: 4000 });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete comment";
      console.error("[handleDelete] Error:", errorMessage);
      if (errorMessage.includes("Unauthorized")) {
        toast.error("You are not authorized to delete this comment", {
          duration: 4000,
        });
      } else {
        toast.error(errorMessage, { duration: 4000 });
      }
    }
  };

  const findParentUsername = (
    comments: Comment[],
    parentId: string | null
  ): string | null => {
    if (!parentId) return null;
    for (const comment of comments) {
      if (comment._id === parentId) return comment.user.username;
      if (comment.replies) {
        const found = findParentUsername(comment.replies, parentId);
        if (found) return found;
      }
    }
    return null;
  };

  const updateComment = (
    comments: Comment[],
    commentId: string,
    updates: Partial<Comment>
  ): Comment[] => {
    return comments.map((comment) => {
      if (comment._id === commentId) {
        return { ...comment, ...updates };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: updateComment(comment.replies, commentId, updates),
        };
      }
      return comment;
    });
  };

  const updateCommentLikes = (
    comments: Comment[],
    commentId: string,
    newLikes: string[]
  ): Comment[] => {
    return comments.map((comment) => {
      if (comment._id === commentId) {
        return { ...comment, likes: newLikes };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: updateCommentLikes(comment.replies, commentId, newLikes),
        };
      }
      return comment;
    });
  };

  const addReplyToComment = (
    comments: Comment[],
    parentId: string,
    newComment: Comment
  ): Comment[] => {
    return comments.map((comment) => {
      if (comment._id === parentId) {
        return {
          ...comment,
          replies: comment.replies
            ? [...comment.replies, newComment]
            : [newComment],
        };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: addReplyToComment(comment.replies, parentId, newComment),
        };
      }
      return comment;
    });
  };

  const handleReplySubmit = (newComment: Comment) => {
    console.log(
      "[CommentList] Handling reply submit:",
      newComment,
      "Parent ID:",
      replyingTo
    );
    if (!replyingTo) {
      setComments((prevComments) => [...prevComments, newComment]);
    } else {
      setComments((prevComments) =>
        addReplyToComment(prevComments, replyingTo, newComment)
      );
    }
    setReplyingTo(null);
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    const isAuthor = user && comment.user._id === user._id;
    const isAdmin = user && user.role === "admin";
    const canEditOrDelete = user && (isAuthor || isAdmin);
    const isLiked = user && comment.likes.includes(user._id);

    return (
      <motion.div
        key={comment._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`border-b border-border py-4 ${
          depth > 0
            ? `ml-${Math.min(depth * 4, 12)} sm:ml-${Math.min(depth * 6, 16)}`
            : ""
        } ${comment.pinned ? "bg-primary/5 border-primary/50" : ""}`}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">
                {comment.user.username}
              </p>
              {comment.pinned && <Pin className="h-4 w-4 text-primary" />}
              {comment.edited && (
                <span className="text-xs text-muted-foreground">(edited)</span>
              )}
            </div>
            {comment.parentComment && depth > 0 && (
              <p className="text-sm text-muted-foreground">
                Replying to @
                {findParentUsername(comments, comment.parentComment)}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
              })}
            </p>
            {editingComment === comment._id ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                  rows={4}
                  aria-label="Edit comment"
                />
                <div className="flex gap-2 mt-2">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => handleEdit(comment._id)}
                      size="sm"
                      aria-label="Save edited comment"
                    >
                      Save
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => setEditingComment(null)}
                      size="sm"
                      aria-label="Cancel editing"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <p className="mt-2 text-foreground">{comment.text}</p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={{
                scale: isLiked ? [1, 1.3, 1] : 1,
                color: isLiked ? "#ff4d4f" : "#333333",
              }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(comment._id)}
                aria-label={`Like comment by ${comment.user.username}`}
              >
                <ThumbsUp className="h-4 w-4" />
                <span className="ml-1">{comment.likes.length}</span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReplyingTo(comment._id);
                  setEditingComment(null);
                }}
                aria-label={`Reply to comment by ${comment.user.username}`}
              >
                <Reply className="h-4 w-4" />
              </Button>
            </motion.div>
            {canEditOrDelete && (
              <>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingComment(comment._id);
                      setEditContent(comment.text);
                      setReplyingTo(null);
                    }}
                    aria-label={`Edit comment by ${comment.user.username}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(comment._id)}
                    aria-label={`Delete comment by ${comment.user.username}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              </>
            )}
          </div>
        </div>
        <AnimatePresence>
          {replyingTo === comment._id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="mt-4"
            >
              <CommentInput
                blogId={blogId}
                parentCommentId={comment._id}
                parentCommentAuthor={comment.user.username}
                onCommentSubmitted={handleReplySubmit}
                onCancelReply={() => setReplyingTo(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {comment.replies?.length ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4"
          >
            {comment.replies.map((reply: Comment) => (
              <div key={reply._id}>{renderComment(reply, depth + 1)}</div>
            ))}
          </motion.div>
        ) : null}
      </motion.div>
    );
  };

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const sortedComments = [...comments].sort((a: Comment, b: Comment) =>
    sortOrder === "newest"
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground">
          Comments ({comments.length})
        </h2>
        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={sortOrder === "newest" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortOrder("newest")}
            >
              Newest
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={sortOrder === "oldest" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortOrder("oldest")}
            >
              Oldest
            </Button>
          </motion.div>
        </div>
      </div>
      <CommentInput blogId={blogId} onCommentSubmitted={handleReplySubmit} />
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-4 bg-card rounded-lg border border-border"
            >
              <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-destructive">{error}</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={fetchComments}
              className="mt-4"
              aria-label="Retry fetching comments"
            >
              Retry
            </Button>
          </motion.div>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-muted-foreground italic">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <AnimatePresence>
          {sortedComments.map((comment: Comment) => renderComment(comment))}
        </AnimatePresence>
      )}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: document.documentElement.classList.contains("dark")
              ? "#1f2937"
              : "#ffffff",
            color: document.documentElement.classList.contains("dark")
              ? "#ffffff"
              : "#000000",
          },
        }}
      />
    </div>
  );
}

export default CommentList;
