import { SearchBox } from "./searchBox";
import ThemeToggle from "./theme-toggle";
import { Button } from "./ui/button";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "./ui/navigation-menu";
import UserMenu from "./auth/user-menu";
import { Home, Bookmark, Tag, Contact, PenSquare, Menu, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const userHeaderNav = [
  { id: 1, title: "Home", link: "/", icon: Home },
  { id: 2, title: "Category", link: "/category", icon: Tag },
  { id: 3, title: "Bookmarks", link: "/bookmarks", icon: Bookmark },
  { id: 4, title: "Contact", link: "/contact", icon: Contact },
];

const adminHeaderNav = [
  { id: 1, title: "Home", link: "/", icon: Home },
  { id: 2, title: "Create", link: "/create", icon: PenSquare },
  { id: 3, title: "Category", link: "/category", icon: Tag },
  { id: 4, title: "Bookmarks", link: "/bookmarks", icon: Bookmark },
];

function Navbar() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarOpen]);

  // Determine navigation items based on user role
  const navItems = user?.role === "admin" ? adminHeaderNav : userHeaderNav;

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
        {/* Logo */}
        <motion.div
          className="text-2xl font-bold text-foreground flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <a href="/" className="flex items-center gap-2">
            <motion.span
              initial={{ rotate: 0 }}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="text-primary"
            >
              📝
            </motion.span>
            D-Blog
          </a>
        </motion.div>

        {/* Hamburger Menu for Mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-foreground hover:bg-primary/10"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
        >
          {isSidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:block">
          <NavigationMenuList className="flex gap-4">
            {navItems.map((nav) => (
              <NavigationMenuItem key={nav.id}>
                <NavigationMenuLink asChild>
                  <motion.a
                    href={nav.link}
                    className="flex items-center gap-2 px-3 py-2 text-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors text-base font-medium"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <nav.icon className="h-5 w-5" />
                    {nav.title}
                  </motion.a>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right Side: Search, Theme, and User/Login */}
        <div className="hidden md:flex items-center gap-4">
          <SearchBox />
          <ThemeToggle />
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
            >
              <motion.a
                href="/auth"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                Login
              </motion.a>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            ref={sidebarRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 right-0 h-full w-64 bg-background border-l border-border shadow-lg z-50 md:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="flex justify-between items-center p-4 border-b border-border">
                <span className="text-xl font-bold text-foreground">
                  D-Blog
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="text-foreground hover:bg-primary/10"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 flex flex-col gap-4 p-4">
                {/* SearchBox at the Top */}
                <div>
                  <SearchBox />
                </div>

                {/* Sidebar Navigation */}
                <nav className="flex flex-col gap-2">
                  {navItems.map((nav) => (
                    <motion.a
                      key={nav.id}
                      href={nav.link}
                      className="flex items-center gap-3 px-4 py-2 text-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors text-base font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      onClick={toggleSidebar}
                    >
                      <nav.icon className="h-5 w-5" />
                      {nav.title}
                    </motion.a>
                  ))}
                </nav>
              </div>

              {/* Sidebar Footer: Theme, User/Login */}
              <div className="p-4 border-t border-border">
                <div className="mb-4">
                  <ThemeToggle />
                </div>
                {user ? (
                  <UserMenu user={user} />
                ) : (
                  <Button
                    asChild
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
                  >
                    <motion.a
                      href="/auth"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      onClick={toggleSidebar}
                    >
                      Login
                    </motion.a>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-40 md:hidden"
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
