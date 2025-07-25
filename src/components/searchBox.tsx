import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
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
  message: string;
}

export function SearchBox() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Blog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        setIsModalOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.get<ApiResponse>(
          `${import.meta.env.VITE_BACKEND_API}/blogs/getAll`,
          {
            params: { search: searchQuery, limit: 5 },
            withCredentials: true,
          }
        );

        if (response.data.success) {
          setSuggestions(response.data.blogs);
          setIsModalOpen(true);
        } else {
          setSuggestions([]);
          setIsModalOpen(false);
        }
      } catch (err) {
        setSuggestions([]);
        setIsModalOpen(false);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Handle clicks outside the search box
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target as Node)
      ) {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsModalOpen(false);
    navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
  };

  // Truncate Markdown content for preview
  const truncateContent = (content: string, maxLength: number) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + "...";
  };

  return (
    <div
      ref={searchBoxRef}
      className="relative flex w-full max-w-xs sm:max-w-sm md:max-w-md items-center gap-2"
    >
      <form onSubmit={handleSearch} className="flex w-full items-center gap-2">
        <Input
          type="text"
          placeholder="Search blog"
          className="border border-border rounded-md w-full text-sm sm:text-base"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button type="submit" variant="outline" className="cursor-pointer p-2">
          <Search className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>
      </form>

      {isModalOpen && (
        <div className="absolute top-12 left-0 z-50 w-full rounded-md border bg-background shadow-lg">
          {isLoading ? (
            <p className="p-3 sm:p-4 text-muted-foreground text-sm sm:text-base">
              Loading suggestions...
            </p>
          ) : suggestions.length === 0 ? (
            <p className="p-3 sm:p-4 text-muted-foreground text-sm sm:text-base">
              No suggestions found.
            </p>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {suggestions.map((blog) => (
                <li
                  key={blog._id}
                  className="border-b border-border p-3 sm:p-4 last:border-b-0 cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <Link
                    to={`/blog/${blog.slug}`}
                    onClick={() => setIsModalOpen(false)}
                  >
                    <h4 className="text-sm sm:text-base font-semibold text-foreground">
                      {blog.title}
                    </h4>
                    <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Optional: Customize rendering of Markdown elements
                          p: ({ children }) => (
                            <p className="m-0">{children}</p>
                          ),
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              className="text-primary underline"
                              onClick={(e) => e.preventDefault()} // Prevent link navigation in preview
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {truncateContent(blog.content, 50)}
                      </ReactMarkdown>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
