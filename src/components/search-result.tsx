import { useState, useEffect, Component } from "react";
import type { ReactNode } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Define interfaces
interface User {
  username: string;
  email: string;
}

interface Blog {
  _id: string;
  title: string;
  content: string;
  slug: string;
  category: string;
  user: User;
  images: { url: string; public_id: string }[];
  commentCount: number;
  readCount: number;
}

interface ApiResponse {
  success: boolean;
  blogs: Blog[];
  totalBlogs: number;
  totalPages: number;
  currentPage: number;
  message: string;
}

interface CategoriesResponse {
  success: boolean;
  categories: string[];
  message: string;
}

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center text-red-500 bg-red-50 p-4 rounded-md">
          Something went wrong. Please try again later.
        </div>
      );
    }
    return this.props.children;
  }
}

export function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const category = searchParams.get("category") || "all";
  const limit = 10;

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch blogs and categories
  useEffect(() => {
    const fetchBlogs = async () => {
      if (!query) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get<ApiResponse>(
          `${import.meta.env.VITE_BACKEND_API}/blogs/getAll`,
          {
            params: {
              search: query,
              page,
              limit,
              category: category === "all" ? undefined : category,
            },
            withCredentials: true,
          }
        );

        if (response.data.success) {
          setBlogs(response.data.blogs);
          setTotalPages(response.data.totalPages);
        } else {
          setError(response.data.message || "Failed to fetch blogs");
          setBlogs([]);
        }
      } catch (err) {
        console.log(err);

        setError("An error occurred while fetching results. Please try again.");
        setBlogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axios.get<CategoriesResponse>(
          `${import.meta.env.VITE_BACKEND_API}/blogs/categories`,
          { withCredentials: true }
        );
        if (response.data.success) {
          setCategories(response.data.categories);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };

    fetchBlogs();
    fetchCategories();
  }, [query, page, category]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ query, page: newPage.toString(), category });
  };

  const handleCategoryChange = (value: string) => {
    setSearchParams({ query, page: "1", category: value });
  };

  // Generate pagination buttons with ellipses
  const getPaginationRange = () => {
    const maxPagesToShow = 5;
    const pages: (number | string)[] = [];
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Search Results for "{query}"</h1>
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-48 w-full mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center text-red-500 bg-red-50 p-4 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {blogs.length === 0 && !isLoading && !error && (
          <div className="text-center text-gray-500 bg-gray-50 p-4 rounded-md border border-gray-200">
            No blogs found for "{query}".
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <Card
              key={blog._id}
              className="hover:shadow-xl transition-shadow duration-300"
            >
              <CardHeader>
                <Link to={`/blog/${blog.slug}`} className="hover:text-blue-600">
                  <CardTitle className="text-xl font-semibold">
                    {blog.title}
                  </CardTitle>
                </Link>
                <p className="text-sm text-gray-500">
                  By {blog.user?.username || "Unknown"} | {blog.commentCount}{" "}
                  comments | {blog.readCount} reads
                </p>
              </CardHeader>
              <CardContent>
                {blog.images.length > 0 ? (
                  <img
                    src={blog.images[0].url}
                    alt={blog.title}
                    className="w-full h-48 object-cover rounded-md mb-4"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-md mb-4 flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {blog.content.slice(0, 150) +
                      (blog.content.length > 150 ? "..." : "")}
                  </ReactMarkdown>
                </div>
                <Link
                  to={`/blog/${blog.slug}`}
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
                  Read more
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
              className="px-4 py-2"
            >
              Previous
            </Button>
            {getPaginationRange().map((p, i) => (
              <Button
                key={i}
                variant={
                  p === page ? "default" : p === "..." ? "ghost" : "outline"
                }
                onClick={() => typeof p === "number" && handlePageChange(p)}
                disabled={p === "..."}
                className="px-4 py-2"
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="px-4 py-2"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
