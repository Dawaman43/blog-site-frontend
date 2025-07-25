import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  PenIcon,
  Save,
  User,
  Mail,
  Lock,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import Footer from "@/components/footer";

// Define User interface based on users.js schema
interface UserData {
  _id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}

// Define API response interfaces
interface UserResponse {
  success: boolean;
  user: UserData;
  message?: string;
}

interface UpdateUserResponse {
  success: boolean;
  user: UserData;
  message?: string;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [updatedUser, setUpdatedUser] = useState<{
    username: string;
    email: string;
    password: string;
  }>({
    username: "",
    email: "",
    password: "",
  });

  // Fetch user data on mount
  useEffect(() => {
    if (!user) {
      setError("Please log in to view your profile");
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Unauthorized: No token provided");
        }

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API}/api/get`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data: UserResponse = await response.json();
        console.log("API response:", data); // Debug log
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Error fetching user data");
        }

        if (!data.user) {
          throw new Error("No user data returned from API");
        }

        setUserData(data.user);
        setUpdatedUser({
          username: data.user.username || "",
          email: data.user.email || "",
          password: "",
        });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        toast.error(errorMessage, { duration: 3000 });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Handle user info update
  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Unauthorized: No token provided");
      }

      const updateData: {
        username?: string;
        email?: string;
        password?: string;
      } = {
        username: updatedUser.username,
        email: updatedUser.email,
      };
      if (updatedUser.password) {
        updateData.password = updatedUser.password;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/api/update`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      const data: UpdateUserResponse = await response.json();
      console.log("Update API response:", data); // Debug log
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Can't update profile");
      }

      setUserData(data.user);
      setUpdatedUser({ ...updatedUser, password: "" });
      setIsModalOpen(false);
      toast.success("Profile updated successfully", { duration: 3000 });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Can't update profile";
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        <div className="text-destructive bg-destructive/10 p-4 rounded-lg text-center max-w-md">
          Please log in to view your profile.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Your Profile | Blog Platform</title>
        <meta
          name="description"
          content="View and update your profile information on our blog platform."
        />
        <meta
          name="keywords"
          content="profile, user, blog platform, account settings"
        />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`${window.location.origin}/profile`} />
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
            Your Profile
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg mb-8 text-muted-foreground"
          >
            Manage your account details and preferences
          </motion.p>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            aria-label="Update profile"
            disabled={loading}
          >
            <PenIcon className="h-4 w-4 mr-2" />
            Update Profile
          </Button>
        </div>
      </section>

      {/* Profile Information */}
      <section className="max-w-4xl mx-auto p-6">
        {loading ? (
          <div className="animate-pulse bg-card p-6 rounded-lg shadow-md border border-border">
            <div className="h-6 bg-muted rounded mb-4 w-1/3"></div>
            <div className="h-4 bg-muted rounded mb-2 w-1/2"></div>
            <div className="h-4 bg-muted rounded mb-2 w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/5"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-destructive bg-destructive/10 p-4 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error: {error}
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
              aria-label="Retry fetching profile"
            >
              Retry
            </Button>
          </div>
        ) : !userData ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground bg-muted/10 p-4 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              No profile data available.
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card rounded-lg shadow-md border border-border p-6"
          >
            <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center">
              <User className="h-6 w-6 mr-2 text-primary" />
              Profile Details
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <p>
                  <span className="font-medium">Username:</span>{" "}
                  {userData.username || "N/A"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {userData.email || "N/A"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <p>
                  <span className="font-medium">Role:</span>{" "}
                  {userData.role || "N/A"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <p>
                  <span className="font-medium">Joined:</span>{" "}
                  {userData.createdAt
                    ? new Date(userData.createdAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </section>

      {/* Update Profile Modal */}
      {isModalOpen && (
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
            <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center">
              <PenIcon className="h-6 w-6 mr-2 text-primary" />
              Update Profile
            </h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-foreground"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={updatedUser.username}
                  onChange={(e) =>
                    setUpdatedUser({ ...updatedUser, username: e.target.value })
                  }
                  className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-card text-foreground"
                  required
                  aria-label="Update username"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={updatedUser.email}
                  onChange={(e) =>
                    setUpdatedUser({ ...updatedUser, email: e.target.value })
                  }
                  className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-card text-foreground"
                  required
                  aria-label="Update email"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground"
                >
                  New Password (leave blank to keep unchanged)
                </label>
                <input
                  id="password"
                  type="password"
                  value={updatedUser.password}
                  onChange={(e) =>
                    setUpdatedUser({ ...updatedUser, password: e.target.value })
                  }
                  className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-card text-foreground"
                  placeholder="Enter new password"
                  aria-label="Update password"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Cancel profile update"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={loading}
                  aria-label="Save profile changes"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ProfilePage;
