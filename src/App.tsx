import { Route, Routes } from "react-router-dom";
import Home from "./pages/home";
import CategoryPage from "./pages/categoryPage";
import ContactPage from "./pages/contact";
import NotFound from "./components/notFound";
import AuthPage from "./pages/auth";
import Navbar from "./components/navbar";
import CreateBlogPage from "./pages/blog/create";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import UnAuthorized from "./components/unAuthorized";
import BlogDetailPage from "./pages/blog/blog-detail";
import UpdateBlogPage from "./pages/blog/update-blog";
import BlogCategory from "./pages/blog/category";
import Unsubscribed from "./pages/unsubscribed";
import { SearchResultsPage } from "./components/search-result";
import BookmarkPage from "./pages/blog/bookmarked-blog";
import ProfilePage from "./pages/profile";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category" element={<BlogCategory />} />
        <Route path="/category/:categoryName" element={<CategoryPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/blog/:slug" element={<BlogDetailPage />} />
        <Route path="/unsubscribed" element={<Unsubscribed />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/bookmarks" element={<BookmarkPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/create"
          element={
            <AdminProtectedRoute>
              <CreateBlogPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/update-blog/:blogId"
          element={
            <AdminProtectedRoute>
              <UpdateBlogPage />
            </AdminProtectedRoute>
          }
        />
        <Route path="/unAuthorized" element={<UnAuthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
