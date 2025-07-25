import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { debounce } from "lodash";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import toast, { Toaster } from "react-hot-toast";
import { AlertCircle } from "lucide-react";
import CommentInput from "@/components/comment/comment-input";
import CommentList from "@/components/comment/comment-list";
import Footer from "@/components/footer";

interface Blog {
  _id: string;
  title: string;
  content: string;
  slug: string;
  category: string;
  images: { url: string; public_id: string; _id: string }[];
  readCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [refreshComments, setRefreshComments] = useState(0);
  const maxRetries = 3;

  const incrementViewCount = debounce(async (blogId: string) => {
    const viewedBlogs = JSON.parse(
      sessionStorage.getItem("viewedBlogs") || "[]"
    ) as string[];
    if (viewedBlogs.includes(blogId)) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/blogs/${blogId}/view`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP error ${response.status}: ${response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Invalid response: Expected JSON");
      }

      const data = await response.json();
      if (data.success) {
        setBlog((prev) =>
          prev ? { ...prev, readCount: data.readCount } : prev
        );
        sessionStorage.setItem(
          "viewedBlogs",
          JSON.stringify([...viewedBlogs, blogId])
        );
      }
    } catch (err) {
      console.error("[BlogDetailPage] Error incrementing view count:", err);
    }
  }, 1000);

  const fetchBlogAndIncrementView = useCallback(async () => {
    if (blog && retryCount === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 10000);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/blogs/slug/${slug}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        }
      );

      console.log("ENV:", import.meta.env);
      console.log("VITE_BACKEND_API:", import.meta.env.VITE_BACKEND_API);

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `HTTP error: ${response.statusText} (Status: ${response.status})`
        );
      }

      if (!response.headers.get("content-type")?.includes("application/json")) {
        throw new Error("Invalid response: Expected JSON");
      }

      const data = await response.json();
      if (!data.success || !data?.blog) {
        throw new Error(data.message || "Blog not found");
      }

      setBlog(data.blog);
      if (data.blog?._id) {
        incrementViewCount(data.blog._id);
      }
      setRetryCount(0);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Request timed out. Please check your connection.");
      } else if (retryCount < maxRetries) {
        setRetryCount(retryCount + 1);
      } else {
        setError(
          "Failed to load blog. It may not exist or the server is unreachable."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [slug, retryCount, blog]);

  useEffect(() => {
    fetchBlogAndIncrementView();
  }, [fetchBlogAndIncrementView]);

  const copyToClipboard = (code: string) => {
    toast.success("Code copied! 🚀", {
      duration: 2000,
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
    navigator.clipboard.writeText(code);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center p-8 max-w-md w-full rounded-2xl shadow-2xl bg-white dark:bg-gray-800 animate-fade-in">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-red-500 dark:text-red-400 mb-6">
            Error
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">{error}</p>
          <button
            onClick={fetchBlogAndIncrementView}
            className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-lg font-medium text-gray-600 dark:text-gray-300 animate-pulse">
            Loading blog...
          </p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center p-8 max-w-md w-full rounded-2xl shadow-2xl bg-white dark:bg-gray-800 animate-fade-in">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-red-500 dark:text-red-400 mb-6">
            Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            The requested blog could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <article className="min-h-screen bg-gray-50 dark:bg-black py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-5xl mx-auto">
          <header className="mb-10 sm:mb-12 animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight tracking-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
              {blog.title}
            </h1>
            <div className="flex flex-wrap gap-2 sm:gap-4 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              <span className="bg-blue-100 dark:bg-blue-900/50 px-3 sm:px-4 py-1.5 rounded-full font-medium hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors">
                {blog.category}
              </span>
              <span className="hidden sm:inline">·</span>
              <span>Views: {blog.readCount}</span>
              <span className="hidden sm:inline">·</span>
              <span>Comments: {blog.commentCount}</span>
              <span className="hidden sm:inline">·</span>
              <span>
                Published: {new Date(blog.createdAt).toLocaleDateString()}
              </span>
            </div>
          </header>

          {blog.images.length > 0 && (
            <div className="mb-10 sm:mb-12 relative group animate-fade-in">
              <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-2xl h-48 sm:h-64 lg:h-96 w-full" />
              <img
                src={blog.images[0].url}
                srcSet={`${blog.images[0].url}?w=200 200w, ${blog.images[0].url}?w=400 400w, ${blog.images[0].url} 800w`}
                sizes="(max-width: 640px) 200px, (max-width: 1024px) 400px, 800px"
                alt={blog.title}
                loading="lazy"
                className="absolute top-0 left-0 w-full h-auto rounded-2xl shadow-lg object-cover max-h-48 sm:max-h-64 lg:max-h-96 cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                onClick={() => setIsLightboxOpen(true)}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-sm sm:text-base font-medium">
                  Click to enlarge
                </p>
              </div>
            </div>
          )}

          <div className="prose prose-invert max-w-none text-gray-700 dark:text-gray-200 prose-headings:font-extrabold prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:tracking-tight prose-h1:text-2xl sm:prose-h1:text-3xl lg:prose-h1:text-4xl prose-h2:text-xl sm:prose-h2:text-2xl lg:prose-h2:text-3xl prose-h3:text-lg sm:prose-h3:text-xl lg:prose-h3:text-2xl prose-p:leading-relaxed prose-p:text-base sm:prose-p:text-lg prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:underline hover:prose-a:no-underline hover:prose-a:text-blue-700 dark:hover:prose-a:text-blue-300 prose-a:transition-colors prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-300 prose-blockquote:font-medium prose-ul:list-disc prose-ol:list-decimal prose-li:ml-6 prose-li:text-base sm:prose-li:text-lg animate-fade-in">
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return match ? (
                    <div className="relative my-6 rounded-xl overflow-hidden shadow-lg animate-fade-in-up bg-gray-100 dark:bg-gray-800">
                      <div className="flex justify-between items-center bg-gray-200 dark:bg-gray-700 px-3 py-2 border-b border-gray-300 dark:border-gray-600">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {match[1]}
                        </span>
                        <button
                          onClick={() => copyToClipboard(String(children))}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium hover:shadow-md"
                        >
                          Copy Code
                        </button>
                      </div>
                      <SyntaxHighlighter
                        language={match[1]}
                        PreTag="div"
                        className="rounded-b-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                        codeTagProps={{
                          className: "text-sm font-mono",
                        }}
                        {...(props as React.ComponentProps<
                          typeof SyntaxHighlighter
                        >)}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code
                      className={`${
                        className || ""
                      } bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-sm font-mono text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {blog.content}
            </ReactMarkdown>
          </div>

          {blog.images.length > 1 && (
            <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {blog.images.slice(1).map((image, index) => (
                <div
                  key={image._id}
                  className="relative group cursor-pointer animate-fade-in-up"
                  onClick={() => {
                    setPhotoIndex(index + 1);
                    setIsLightboxOpen(true);
                  }}
                >
                  <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl h-40 sm:h-48 lg:h-64 w-full" />
                  <img
                    src={image.url}
                    srcSet={`${image.url}?w=100 100w, ${image.url}?w=200 200w, ${image.url} 400w`}
                    sizes="(max-width: 640px) 100px, (max-width: 1024px) 200px, 400px"
                    alt={`Image ${index + 2} for ${blog.title}`}
                    loading="lazy"
                    className="absolute top-0 left-0 w-full h-40 sm:h-48 lg:h-64 object-cover rounded-xl shadow-md group-hover:shadow-xl group-hover:scale-[1.03] transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300 flex items-center justify-center">
                    <p className="text-white text-sm sm:text-base font-medium">
                      View Image
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 text-center">
                    Image {index + 2}
                  </p>
                </div>
              ))}
            </div>
          )}

          {isLightboxOpen && (
            <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center animate-fade-in">
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-4 right-4 text-white text-2xl sm:text-3xl font-bold hover:text-gray-300 transition-colors duration-200"
                aria-label="Close lightbox"
              >
                ×
              </button>
              <button
                onClick={() =>
                  setPhotoIndex(
                    (photoIndex + blog.images.length - 1) % blog.images.length
                  )
                }
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-2xl sm:text-3xl font-bold hover:text-gray-300 transition-colors duration-200"
                aria-label="Previous image"
              >
                ←
              </button>
              <button
                onClick={() =>
                  setPhotoIndex((photoIndex + 1) % blog.images.length)
                }
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl sm:text-3xl font-bold hover:text-gray-300 transition-colors duration-200"
                aria-label="Next image"
              >
                →
              </button>
              <div className="max-w-full sm:max-w-4xl w-full p-4 sm:p-6">
                <img
                  src={blog.images[photoIndex].url}
                  alt={blog.title}
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-lg"
                />
                <div className="mt-4 text-center text-white">
                  <p className="text-base sm:text-lg font-medium">
                    {blog.title}
                  </p>
                  <p className="text-sm sm:text-base">
                    Image {photoIndex + 1} of {blog.images.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          <CommentInput
            blogId={blog._id}
            onCommentSubmitted={() => setRefreshComments((prev) => prev + 1)}
          />
          <CommentList blogId={blog._id} key={refreshComments} />
        </div>
      </article>

      <Footer />
    </>
  );
}

export default BlogDetailPage;
