import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Trash2,
  Share2,
  Clock,
  Search,
  Bookmark,
  PenIcon,
  Tag,
  Twitter,
  Facebook,
  Linkedin,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
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

// Define API response interfaces
interface BlogsResponse {
  success: boolean;
  blogs: Blog[];
  message?: string;
}

interface CategoriesResponse {
  success: boolean;
  categories: string[];
  message?: string;
}

// Define props for HomePageErrorBoundary
interface HomePageErrorBoundaryProps {
  error?: Error;
  children: React.ReactNode;
}

// Custom components for ReactMarkdown to prevent <a> nesting
const markdownComponents: Components = {
  a: ({ children, ...props }) => <span {...props}>{children}</span>,
};

const HomePageErrorBoundary: React.FC<HomePageErrorBoundaryProps> = ({
  error,
  children,
}) => {
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (error) {
      setHasError(true);
      setErrorMessage(error.message);
    }
  }, [error]);

  if (hasError) {
    return (
      <div className="text-destructive bg-destructive/10 p-4 rounded-lg text-center max-w-4xl mx-auto">
        Something went wrong: {errorMessage}. Please refresh the page or try
        again later.
      </div>
    );
  }
  return <>{children}</>;
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newBlog, setNewBlog] = useState<{
    title: string;
    content: string;
    category: string;
  }>({
    title: "",
    content: "",
    category: "",
  });
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem("bookmarks");
    return saved ? JSON.parse(saved) : [];
  });
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>(
    {}
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [blogToDelete, setBlogToDelete] = useState<string | null>(null);
  const [recentlyRead, setRecentlyRead] = useState<Blog[]>([]);
  const blogsPerPage = 6;

  const isAdmin = user?.role === "admin";

  async function fetchBlogs() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/blogs/getAll`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: BlogsResponse = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error fetching blogs");
      }

      setBlogs(data.blogs);
      setFilteredBlogs(data.blogs);
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

  async function fetchCategories() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/blogs/categories`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data: CategoriesResponse = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error fetching categories");
      }

      setCategories(["All", ...data.categories]);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch categories";
      toast.error(errorMessage, { duration: 3000 });
    }
  }

  const sortedAndFilteredBlogs = useMemo(() => {
    let result = blogs;
    if (searchQuery) {
      result = result.filter(
        (blog: Blog) =>
          blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          blog.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      result = [...result].sort(
        (a: Blog, b: Blog) => b.commentCount - a.commentCount
      );
    }
    if (selectedCategory !== "All") {
      result = result.filter(
        (blog: Blog) => blog.category === selectedCategory
      );
    }
    if (!searchQuery) {
      if (sortBy === "date-desc") {
        result = [...result].sort(
          (a: Blog, b: Blog) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (sortBy === "date-asc") {
        result = [...result].sort(
          (a: Blog, b: Blog) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      } else if (sortBy === "title") {
        result = [...result].sort((a: Blog, b: Blog) =>
          a.title.localeCompare(b.title)
        );
      } else if (sortBy === "popularity") {
        result = [...result].sort(
          (a: Blog, b: Blog) => b.readCount - a.readCount
        );
      }
    }
    return result;
  }, [searchQuery, selectedCategory, sortBy, blogs]);

  const slideshowBlogs = useMemo(() => {
    return sortedAndFilteredBlogs
      .sort((a: Blog, b: Blog) => b.readCount - a.readCount)
      .slice(0, 3);
  }, [sortedAndFilteredBlogs]);

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
    // Load recently read blogs from localStorage
    const storedRecent = localStorage.getItem("recentlyRead");
    if (storedRecent) {
      const parsedRecent: Blog[] = JSON.parse(storedRecent);
      setRecentlyRead(parsedRecent.filter((blog: Blog) => blog._id));
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(
        (prev) => (prev + 1) % Math.min(3, slideshowBlogs.length)
      );
    }, 5000);
    return () => clearInterval(timer);
  }, [slideshowBlogs.length]);

  useEffect(() => {
    setFilteredBlogs(sortedAndFilteredBlogs);
    setCurrentPage(1);
  }, [sortedAndFilteredBlogs]);

  useEffect(() => {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirstBlog, indexOfLastBlog);
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);

  const handleDeleteBlog = async (blogId: string) => {
    setBlogToDelete(blogId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteBlog = async () => {
    if (!blogToDelete) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Unauthorized: No token provided");
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/blogs/${blogToDelete}`,
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
      setBlogs((prevBlogs) => prevBlogs.filter((b) => b._id !== blogToDelete));
      // Remove from recently read if present
      setRecentlyRead((prev) => prev.filter((b) => b._id !== blogToDelete));
      localStorage.setItem(
        "recentlyRead",
        JSON.stringify(recentlyRead.filter((b) => b._id !== blogToDelete))
      );
      // Remove from bookmarks if present
      setBookmarks((prev) => prev.filter((id) => id !== blogToDelete));
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Can't delete post";
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setBlogToDelete(null);
    }
  };

  const handleCreateBlog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("Only admins can create blogs", { duration: 3000 });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Unauthorized: No token provided");
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/blogs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newBlog),
        }
      );

      const data: { success: boolean; blog: Blog; message?: string } =
        await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Can't create blog");
      }

      toast.success("Blog created successfully", { duration: 3000 });
      setBlogs((prevBlogs) => [
        { ...data.blog, commentCount: 0, readCount: 0 },
        ...prevBlogs,
      ]);
      setIsModalOpen(false);
      setNewBlog({ title: "", content: "", category: "" });
      fetchCategories();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Can't create blog";
      toast.error(errorMessage, { duration: 3000 });
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
      // Check if view has already been incremented in this session
      const viewedBlogs = JSON.parse(
        sessionStorage.getItem("viewedBlogs") || "[]"
      ) as string[];
      if (viewedBlogs.includes(blog._id)) {
        console.log(
          "[HomePage] View already incremented for blogId:",
          blog._id
        );
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/blogs/${blog._id}/view`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Invalid response: Expected JSON");
      }

      const data = await res.json();
      if (!data.success) {
        console.error(
          "[HomePage] Failed to increment view count:",
          data.message
        );
        return;
      }

      const updatedReadCount = data.readCount;
      setBlogs((prevBlogs) =>
        prevBlogs.map((b) =>
          b._id === blog._id ? { ...b, readCount: updatedReadCount } : b
        )
      );

      // Update recently read
      setRecentlyRead((prev) => {
        const updated = [
          { ...blog, readCount: updatedReadCount },
          ...prev.filter((b) => b._id !== blog._id),
        ].slice(0, 3);
        localStorage.setItem("recentlyRead", JSON.stringify(updated));
        return updated;
      });

      // Mark blog as viewed in session
      sessionStorage.setItem(
        "viewedBlogs",
        JSON.stringify([...viewedBlogs, blog._id])
      );
    } catch (err: unknown) {
      console.error("[HomePage] Error updating read count:", err);
    }
  };

  const getReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? Math.min(2, slideshowBlogs.length - 1) : prev - 1
    );
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.min(3, slideshowBlogs.length));
  };

  return (
    <HomePageErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* SEO Meta Tags */}
        <Helmet>
          <title>Explore Our Blogs | Your Blog Platform</title>
          <meta
            name="description"
            content="Discover trending blogs, explore diverse categories, and engage with captivating content on our blog platform."
          />
          <meta
            name="keywords"
            content={`blogs, ${categories
              .filter((cat) => cat !== "All")
              .join(", ")}, trending articles, blog platform`}
          />
          <meta name="robots" content="index, follow" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="canonical" href={window.location.origin} />
        </Helmet>

        {/* Hero Section */}
        <section className="bg-card text-foreground py-20 text-center border-b border-border">
          <div className="max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              {isAdmin ? "Manage Your Blog" : "Explore Our Blogs"}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg mb-8 text-muted-foreground"
            >
              {isAdmin
                ? "Create and share your stories"
                : "Discover captivating content"}
            </motion.p>
            {isAdmin && (
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                aria-label="Create new blog"
              >
                Create New Blog
              </Button>
            )}
          </div>
        </section>

        {/* Trending Blogs Slideshow */}
        {slideshowBlogs.length > 0 && (
          <section className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
              Trending Blogs{" "}
              {selectedCategory !== "All" ? `in ${selectedCategory}` : ""}
            </h2>
            <div className="relative">
              <div className="relative h-[400px] md:h-[600px] overflow-hidden rounded-xl shadow-lg">
                <AnimatePresence>
                  {slideshowBlogs.map((blog, index) => (
                    <motion.article
                      key={blog._id}
                      className="absolute inset-0"
                      initial={{ opacity: 0, x: 100 }}
                      animate={{
                        opacity: index === currentSlide ? 1 : 0,
                        x: index === currentSlide ? 0 : 100,
                      }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.7, ease: "easeInOut" }}
                    >
                      <Link
                        to={`/blog/${blog.slug}`}
                        className="block h-full"
                        onClick={() => handleBlogView(blog)}
                      >
                        <div className="relative w-full h-full">
                          <img
                            src={blog.images?.[0]?.url || "/fallback-image.jpg"}
                            alt={`Featured image for ${blog.title}`}
                            className="w-full h-full object-cover"
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
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 md:p-8 flex flex-col justify-end">
                          {blog.category && (
                            <span className="inline-flex items-center px-3 py-1 mb-4 rounded-full text-sm font-medium bg-primary/20 text-primary">
                              <Tag className="h-4 w-4 mr-2" />
                              {blog.category}
                            </span>
                          )}
                          <h3 className="text-2xl md:text-4xl font-bold text-white mb-2 line-clamp-2">
                            {blog.title}
                          </h3>
                          <div className="text-sm md:text-base text-gray-200 mb-4 line-clamp-2 prose prose-invert max-w-none">
                            <ReactMarkdown components={markdownComponents}>
                              {blog.content}
                            </ReactMarkdown>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-300">
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
                        </div>
                      </Link>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                onClick={handlePrevSlide}
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                onClick={handleNextSlide}
                aria-label="Next slide"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
              <div className="flex justify-center gap-3 mt-6">
                {slideshowBlogs.slice(0, 3).map((_, index) => (
                  <button
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? "bg-primary scale-125"
                        : "bg-muted hover:bg-muted-foreground"
                    }`}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recently Read Blogs */}
        {recentlyRead.length > 0 && (
          <section className="max-w-5xl mx-auto p-6">
            <h2 className="text-3xl font-semibold text-foreground mb-6">
              Recently Read
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <AnimatePresence>
                {recentlyRead.map((blog) => (
                  <motion.article
                    key={blog._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-card rounded-lg shadow-md border border-border hover:shadow-lg transition-transform transform hover:-translate-y-2 min-w-[200px]"
                  >
                    {blog.images && blog.images.length > 0 ? (
                      <div className="relative">
                        <img
                          src={blog.images[0].url || "/fallback-image.jpg"}
                          alt={`Image for ${blog.title}`}
                          className="w-full h-40 object-cover rounded-t-lg"
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
                      </div>
                    ) : (
                      <div className="relative h-40 bg-muted rounded-t-lg flex items-center justify-center text-muted-foreground italic">
                        No image available
                      </div>
                    )}
                    <div className="p-4">
                      <Link
                        to={`/blog/${blog.slug}`}
                        onClick={() => handleBlogView(blog)}
                      >
                        <h3 className="text-lg font-semibold text-foreground mb-2 hover:text-primary transition">
                          {blog.title}
                        </h3>
                      </Link>
                      {blog.category && (
                        <div className="mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            <Tag className="h-3 w-3 mr-1" />
                            {blog.category}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
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
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Search, Filter, and Sort */}
        <section className="max-w-4xl mx-auto p-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
              aria-label="Search blogs"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.length <= 1 ? (
              <p className="text-muted-foreground italic">
                No categories available
              </p>
            ) : (
              categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className={
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "text-foreground border-border hover:bg-muted"
                  }
                  onClick={() => setSelectedCategory(cat)}
                  aria-label={`Filter by ${cat}`}
                >
                  {cat}
                </Button>
              ))
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSortBy(e.target.value)
            }
            className="p-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Sort blogs"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="title">Title A-Z</option>
            <option value="popularity">Most Popular</option>
          </select>
        </section>

        {/* Blog Grid */}
        <section className="max-w-5xl mx-auto p-6">
          <h2 className="text-3xl font-semibold text-foreground mb-6">
            {searchQuery ? "Top Search Results" : "All Blogs"}
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
                onClick={fetchBlogs}
                className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                aria-label="Retry fetching blogs"
              >
                Retry
              </Button>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <p className="text-muted-foreground italic text-center py-8 text-lg">
              No blogs found. Try adjusting your search or filters.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence>
                {currentBlogs.map((blog) => (
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
                              onClick={() =>
                                navigate(`/update-blog/${blog._id}`)
                              }
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
                              onClick={() =>
                                navigate(`/update-blog/${blog._id}`)
                              }
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
                                bookmarks.includes(blog._id)
                                  ? "default"
                                  : "ghost"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <section className="max-w-4xl mx-auto p-6 flex justify-center gap-2">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="border-border text-foreground hover:bg-muted"
              aria-label="Previous page"
            >
              Previous
            </Button>
            {[...Array(totalPages)].map((_, i) => (
              <Button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                variant={currentPage === i + 1 ? "default" : "outline"}
                className={
                  currentPage === i + 1
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-border text-foreground hover:bg-muted"
                }
                aria-label={`Page ${i + 1}`}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              variant="outline"
              className="border-border text-foreground hover:bg-muted"
              aria-label="Next page"
            >
              Next
            </Button>
          </section>
        )}

        {/* Blog Creation Modal (Admin Only) */}
        {isAdmin && isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-card rounded-lg p-6 max-w-lg w-full border border-border"
            >
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Create New Blog
              </h2>
              <form onSubmit={handleCreateBlog} className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-foreground"
                  >
                    Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={newBlog.title}
                    onChange={(e) =>
                      setNewBlog({ ...newBlog, title: e.target.value })
                    }
                    className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-card text-foreground"
                    required
                    aria-label="Blog title"
                  />
                </div>
                <div>
                  <label
                    htmlFor="content"
                    className="block text-sm font-medium text-foreground"
                  >
                    Content (Markdown supported)
                  </label>
                  <textarea
                    id="content"
                    value={newBlog.content}
                    onChange={(e) =>
                      setNewBlog({ ...newBlog, content: e.target.value })
                    }
                    className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-card text-foreground font-mono"
                    rows={8}
                    required
                    placeholder="Write your content in Markdown (e.g., **bold**, *italic*, # Heading)"
                    aria-label="Blog content (Markdown)"
                  />
                </div>
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-foreground"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    value={newBlog.category}
                    onChange={(e) =>
                      setNewBlog({ ...newBlog, category: e.target.value })
                    }
                    className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-card text-foreground"
                    aria-label="Blog category"
                  >
                    <option value="">Select a category</option>
                    {categories
                      .filter((cat) => cat !== "All")
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border text-foreground hover:bg-muted"
                    onClick={() => setIsModalOpen(false)}
                    aria-label="Cancel blog creation"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    aria-label="Submit new blog"
                  >
                    Create Blog
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Delete Confirmation Modal (Admin Only) */}
        {isAdmin && isDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-card rounded-lg p-6 max-w-md w-full border border-border"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Confirm Deletion
              </h2>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to delete this blog? This action cannot be
                undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setBlogToDelete(null);
                  }}
                  aria-label="Cancel deletion"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteBlog}
                  aria-label="Confirm blog deletion"
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Footer */}
        <Footer />
      </div>
    </HomePageErrorBoundary>
  );
};

export default HomePage;
