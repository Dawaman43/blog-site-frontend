import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Markdown from "react-markdown";

// Define the Blog type based on your backend response
interface Blog {
  _id: string;
  title: string;
  content: string;
  slug: string;
  category: string;
  images: { url: string; public_id: string }[];
  createdAt: string;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-12">
          <p className="text-lg font-medium text-red-500 bg-red-50 px-6 py-3 rounded-lg shadow-md">
            An error occurred:{" "}
            {this.state.error?.message || "Something went wrong."}
          </p>
          <Link
            to="/category"
            className="inline-block mt-4 text-sm font-medium text-blue-600 hover:underline"
          >
            Back to Categories
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}

const CategoryPage = () => {
  const { categoryName } = useParams<{ categoryName?: string }>();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      if (!categoryName) {
        setError("No category specified");
        setLoadingBlogs(false);
        return;
      }

      setLoadingBlogs(true);
      try {
        // ⚠️ Removed `.toLowerCase()` to match exact casing
        const url = `${
          import.meta.env.VITE_BACKEND_API
        }/blogs/getAll?category=${encodeURIComponent(categoryName)}`;
        console.log("Fetching URL:", url);
        const response = await fetch(url, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response:", data);

        if (data.success) {
          setBlogs(data.blogs || []);
        } else {
          setError(data.message || "Failed to fetch blogs");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(`Error fetching blogs: ${errorMessage}`);
      } finally {
        setLoadingBlogs(false);
      }
    };

    fetchBlogs();
  }, [categoryName]);

  return (
    <ErrorBoundary>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 opacity-50 blur-3xl" />

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center capitalize">
            {categoryName ? categoryName.replace(/-/g, " ") : "Category"} Blogs
          </h2>
          <Link
            to="/category"
            className="inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to All Categories
          </Link>
        </div>

        <div>
          {loadingBlogs ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 mx-auto" />
              <p className="mt-4 text-lg font-medium text-gray-700 animate-pulse">
                Loading blogs...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-red-500 bg-red-50 px-6 py-3 rounded-lg shadow-md">
                {error}
              </p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-gray-600">
                No blogs found in this category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <Link
                  to={`/blog/${blog.slug}`}
                  key={blog._id}
                  className="group bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <div className="relative h-48 overflow-hidden">
                    {blog.images && blog.images[0]?.url ? (
                      <img
                        src={blog.images[0].url}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-200 to-purple-200 flex items-center justify-center">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                      {blog.title}
                    </h3>
                    <div className="text-gray-600 mt-2 line-clamp-2 markdown-content">
                      <Markdown
                        components={{
                          p: ({ children }) => (
                            <p className="text-gray-600">{children}</p>
                          ),
                          h1: ({ children }) => (
                            <h1 className="text-2xl font-bold text-gray-800 mt-4">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-xl font-semibold text-gray-800 mt-4">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-lg font-medium text-gray-800 mt-3">
                              {children}
                            </h3>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside text-gray-600 mt-2">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside text-gray-600 mt-2">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="ml-4">{children}</li>
                          ),
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              className="text-blue-600 hover:underline"
                            >
                              {children}
                            </a>
                          ),
                          code: ({ children }) => (
                            <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded">
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <pre className="bg-gray-100 p-4 rounded-lg mt-2 overflow-x-auto">
                              {children}
                            </pre>
                          ),
                        }}
                      >
                        {blog.content}
                      </Markdown>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-600">
                        {blog.category}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default CategoryPage;
