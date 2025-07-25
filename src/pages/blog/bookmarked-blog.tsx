import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bookmark,
  Clock,
  Eye,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Tag,
  Trash2,
  PenIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Helmet } from "react-helmet-async";
import Footer from "@/components/footer";
import type { Components } from "react-markdown";

// Define Blog interface
interface Blog {
  _id: string;
  title: string;
  content: string;
  category: string;
  slug: string;
  images: { url: string; public_id: string }[];
  createdAt: string;
  commentCount: number;
  readCount: number;
  user: { username: string; email: string };
}

// Define API response interface
interface BlogsResponse {
  success: boolean;
  blogs: Blog[];
  message?: string;
}

// Custom components for ReactMarkdown to prevent <a> nesting
const markdownComponents: Components = {
  a: ({ children, ...props }) => <span {...props}>{children}</span>,
};

const BookmarkPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem("bookmarks");
    return saved ? JSON.parse(saved) : [];
  });
  const [bookmarkedBlogs, setBookmarkedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>(
    {}
  );

  const isAdmin = user?.role === "admin";

  async function fetchBookmarkedBlogs() {
    if (bookmarks.length === 0) {
      setBookmarkedBlogs([]);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/blogs/getAll?ids=${bookmarks.join(
          ","
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: BlogsResponse = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error fetching bookmarked blogs");
      }

      setBookmarkedBlogs(data.blogs);
      const initialLoadingState = data.blogs.reduce(
        (acc: Record<string, boolean>, blog: Blog) => {
          acc[blog._id] = true;
          return acc;
        },
        {}
      );
      setLoadingImages(initialLoadingState);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookmarkedBlogs();
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const handleBookmark = (blogId: string) => {
    setBookmarks((prev) =>
      prev.includes(blogId)
        ? prev.filter((id) => id !== blogId)
        : [...prev, blogId]
    );
    toast.success(
      bookmarks.includes(blogId) ? "Bookmark removed" : "Blog bookmarked",
      { duration: 3000 }
    );
  };

  const handleBlogView = async (blog: Blog) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `${import.meta.env.VITE_BACKEND_API}/blogs/${blog._id}/view`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBookmarkedBlogs((prevBlogs) =>
        prevBlogs.map((b) =>
          b._id === blog._id ? { ...b, readCount: b.readCount + 1 } : b
        )
      );
    } catch (err: unknown) {
      console.error("Error updating read count:", err);
    }
  };

  const handleShare = (
    blog: Blog,
    platform: "twitter" | "facebook" | "linkedin" | "copy"
  ) => {
    const shareUrl = `${window.location.origin}/blog/${blog.slug}`;
    let url = "";
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          shareUrl
        )}&text=${encodeURIComponent(blog.title)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
          shareUrl
        )}&title=${encodeURIComponent(blog.title)}`;
        break;
      default:
        navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!", { duration: 3000 });
        return;
    }
    window.open(url, "_blank");
  };

  const getReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const handleDeleteBlog = async (blogId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Unauthorized: No token provided");
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/blogs/${blogId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: { success: boolean; message?: string } =
        await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Can't delete blog");
      }

      toast.success("Post deleted successfully", { duration: 3000 });
      setBookmarkedBlogs((prevBlogs) =>
        prevBlogs.filter((b) => b._id !== blogId)
      );
      setBookmarks((prev) => prev.filter((id) => id !== blogId));
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Can't delete post";
      toast.error(errorMessage, { duration: 3000 });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Your Bookmarked Blogs | Your Blog Platform</title>
        <meta
          name="description"
          content="View and manage your bookmarked blogs on our platform."
        />
        <meta name="keywords" content="bookmarks, blogs, saved articles" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`${window.location.origin}/bookmarks`} />
      </Helmet>

      {/* Header Section */}
      <section className="bg-card text-foreground py-20 text-center border-b border-border">
        <div className="max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Your Bookmarked Blogs
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg mb-8 text-muted-foreground"
          >
            Explore the blogs you've saved for later.
          </motion.p>
        </div>
      </section>

      {/* Bookmarked Blogs Grid */}
      <section className="max-w-5xl mx-auto p-6">
        <h2 className="text-3xl font-semibold text-foreground mb-6">
          Bookmarked Blogs
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <article
                key={i}
                className="animate-pulse bg-card p-4 rounded-lg shadow-md border border-border min-w-[300px]"
              >
                <div className="h-52 bg-muted rounded-t-lg mb-4"></div>
                <div className="h-6 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded"></div>
              </article>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 max-w-4xl mx-auto">
            <div className="text-destructive bg-destructive/10 p-4 rounded-lg">
              Error: {error}
            </div>
            <Button
              onClick={fetchBookmarkedBlogs}
              className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
              aria-label="Retry fetching bookmarked blogs"
            >
              Retry
            </Button>
          </div>
        ) : bookmarkedBlogs.length === 0 ? (
          <p className="text-muted-foreground italic text-center py-8 text-lg">
            No bookmarked blogs found. Start bookmarking from the homepage!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {bookmarkedBlogs.map((blog) => (
                <motion.article
                  key={blog._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-card rounded-lg shadow-md border border-border hover:shadow-lg transition-transform transform hover:-translate-y-2 min-w-[300px]"
                >
                  {blog.images && blog.images.length > 0 ? (
                    <div className="relative">
                      <img
                        src={blog.images[0].url || "/fallback-image.jpg"}
                        alt={`Image for ${blog.title}`}
                        className="w-full h-52 object-cover rounded-t-lg"
                        loading="lazy"
                        onLoad={() =>
                          setLoadingImages((prev) => ({
                            ...prev,
                            [blog._id]: false,
                          }))
                        }
                      />
                      {loadingImages[blog._id] && (
                        <div className="absolute inset-0 bg-muted animate-pulse">
                          <div className="w-full h-full bg-gradient-to-r from-muted to-muted-foreground/50" />
                        </div>
                      )}
                      {isAdmin && (
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            className="bg-muted text-foreground hover:bg-muted/90"
                            onClick={() => navigate(`/update-blog/${blog._id}`)}
                            aria-label={`Edit blog ${blog.title}`}
                          >
                            <PenIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteBlog(blog._id)}
                            aria-label={`Delete blog ${blog.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative h-52 bg-muted rounded-t-lg flex items-center justify-center text-muted-foreground italic">
                      No image available
                      {isAdmin && (
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            className="bg-muted text-foreground hover:bg-muted/90"
                            onClick={() => navigate(`/update-blog/${blog._id}`)}
                            aria-label={`Edit blog ${blog.title}`}
                          >
                            <PenIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteBlog(blog._id)}
                            aria-label={`Delete blog ${blog.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-5">
                    <Link
                      to={`/blog/${blog.slug}`}
                      onClick={() => handleBlogView(blog)}
                    >
                      <h2 className="text-xl font-semibold text-foreground mb-2 hover:text-primary transition">
                        {blog.title}
                      </h2>
                    </Link>
                    {blog.category && (
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          <Tag className="h-3 w-3 mr-1" />
                          {blog.category}
                        </span>
                      </div>
                    )}
                    <div className="prose prose-invert text-muted-foreground text-sm mb-4 max-w-none line-clamp-3">
                      <ReactMarkdown components={markdownComponents}>
                        {blog.content}
                      </ReactMarkdown>
                    </div>
                    <div className="relative pt-2">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${Math.min(
                              getReadingTime(blog.content) * 10,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-sm text-muted-foreground mt-2 flex-wrap gap-2">
                        <div className="flex gap-4">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {getReadingTime(blog.content)} min read
                          </span>
                          <span className="flex items-center">
                            <svg
                              className="h-4 w-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5v-4a2 2 0 012-2h10a2 2 0 012 2v4h-4M12 16h.01"
                              />
                            </svg>
                            {blog.commentCount} comments
                          </span>
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {blog.readCount} views
                          </span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(blog, "twitter")}
                            className="text-muted-foreground hover:text-primary"
                            aria-label={`Share ${blog.title} on Twitter`}
                          >
                            <Twitter className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(blog, "facebook")}
                            className="text-muted-foreground hover:text-primary"
                            aria-label={`Share ${blog.title} on Facebook`}
                          >
                            <Facebook className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(blog, "linkedin")}
                            className="text-muted-foreground hover:text-primary"
                            aria-label={`Share ${blog.title} on LinkedIn`}
                          >
                            <Linkedin className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(blog, "copy")}
                            className="text-muted-foreground hover:text-primary"
                            aria-label={`Copy ${blog.title} link`}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={
                              bookmarks.includes(blog._id) ? "default" : "ghost"
                            }
                            size="sm"
                            onClick={() => handleBookmark(blog._id)}
                            className={
                              bookmarks.includes(blog._id)
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "text-muted-foreground hover:text-primary"
                            }
                            aria-label={
                              bookmarks.includes(blog._id)
                                ? `Remove bookmark for ${blog.title}`
                                : `Bookmark ${blog.title}`
                            }
                          >
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default BookmarkPage;
