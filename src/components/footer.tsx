import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Linkedin, Github, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string) => {
    return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
  };

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address", { duration: 3000 });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/api/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Subscription failed");
      }

      toast.success("Subscribed successfully! Check your inbox!", {
        duration: 3000,
      });
      setEmail("");
    } catch (err: unknown) {
      console.log(err);

      toast.error("Failed to subscribe. Try again later.", {
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card text-foreground border-t border-border w-full py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Branding & Description */}
          <div className="flex flex-col items-center md:items-start">
            <h2 className="text-2xl font-bold text-primary mb-2">
              D-Blog Platform
            </h2>
            <p className="text-muted-foreground text-sm text-center md:text-left">
              Discover and share captivating stories from creators around the
              world.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/"
                  className="hover:text-primary transition-colors"
                  aria-label="Go to Home page"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/category"
                  className="hover:text-primary transition-colors"
                  aria-label="Go to Blogs page"
                >
                  Category
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-primary transition-colors"
                  aria-label="Go to About page"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-primary transition-colors"
                  aria-label="Go to Contact page"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Subscription Form */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Subscribe to Our Newsletter
            </h3>
            <form
              onSubmit={handleSubscribe}
              className="flex w-full max-w-sm gap-2"
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-border text-foreground focus:ring-primary"
                aria-label="Email for newsletter subscription"
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isSubmitting}
                aria-label="Subscribe to newsletter"
              >
                <Mail className="h-4 w-4 mr-2" />
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
            <p className="text-muted-foreground text-sm mt-2 text-center md:text-left">
              Get the latest blogs delivered to your inbox.
            </p>
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-4">
            <a
              href="www.linkedin.com/in/dawit-worku-jima"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Visit our LinkedIn page"
            >
              <Linkedin className="h-6 w-6" />
            </a>
            <a
              href="https://github.com/dawaman43"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Visit our GitHub page"
            >
              <Github className="h-6 w-6" />
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} D-Blog Platform. All rights reserved.
          </p>
        </div>
      </div>
    </motion.footer>
  );
}

export default Footer;
