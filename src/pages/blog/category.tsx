import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/footer";

const BlogCategory: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API}/blogs/categories`,
          {
            credentials: "include",
          }
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch categories");
        }

        setCategories(data.categories);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Error fetching categories";
        setError(errorMessage);
        toast.error(errorMessage, { duration: 3000 });
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Blog Categories | Blog Platform</title>
        <meta
          name="description"
          content="Explore blog categories on our platform to find content that interests you."
        />
        <meta
          name="keywords"
          content="blog categories, topics, blog platform"
        />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`${window.location.origin}/categories`} />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-card text-foreground py-20 text-center border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Explore Categories
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg mb-8 text-muted-foreground"
          >
            Discover blogs by topic and find content that sparks your interest
          </motion.p>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/10 via-muted/10 to-destructive/10 opacity-50 blur-3xl" />

        <AnimatePresence>
          {loadingCategories ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
              <p className="mt-4 text-lg font-medium text-muted-foreground animate-pulse">
                Loading categories...
              </p>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="text-destructive bg-destructive/10 p-4 rounded-lg flex items-center justify-center max-w-md mx-auto">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
              <Button
                onClick={() => window.location.reload()}
                className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                aria-label="Retry fetching categories"
              >
                Retry
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12"
            >
              <h2 className="text-3xl font-semibold text-foreground mb-6 text-center">
                Browse Categories
              </h2>
              <div className="flex flex-wrap gap-4 justify-center items-center">
                {categories.map((category) => (
                  <motion.div
                    key={category}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link
                      to={`/category/${encodeURIComponent(category)}`}
                      className="relative px-6 py-3 rounded-full text-base font-semibold bg-card text-foreground border border-border hover:bg-muted/50 transition-colors duration-300"
                    >
                      <span className="relative z-10">{category}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default BlogCategory;
