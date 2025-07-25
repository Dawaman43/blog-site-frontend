import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const blogSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(100, { message: "Title cannot exceed 100 characters" }),
  content: z
    .string()
    .min(5, { message: "Content must be at least 5 characters" })
    .max(5000, { message: "Content cannot exceed 5000 characters" }),
  category: z.string().min(2, { message: "Please select a category" }),
  images: z
    .array(
      z.object({
        url: z.url({ message: "Invalid image URL" }),
        public_id: z.string().min(1, { message: "Missing public ID" }),
      })
    )
    .optional(),
});

type BlogFormValues = z.infer<typeof blogSchema>;

// Predefined category list
const categories = [
  "Technology",
  "Lifestyle",
  "Travel",
  "Food",
  "Health",
  "Business",
  "Education",
  "Entertainment",
];

function CreateBlogPage() {
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
    },
  });

  const contentLength = form.watch("content")?.length || 0;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (imageFiles.length + newFiles.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    setImageFiles((prev) => [...prev, ...newFiles]);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setImageFiles([]);
    setPreviewUrls([]);
  };

  async function onSubmit(values: BlogFormValues) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("content", values.content);
      formData.append("category", values.category);

      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Unauthorized: No token provided");
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/blogs/create`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error in submitting blog");
      }

      toast.success("Blog created successfully");
      form.reset();
      setImageFiles([]);
      setPreviewUrls([]);
    } catch (error) {
      console.error(error);
      toast.error("Error in creating blog");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Create New Blog
        </h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold text-gray-700">
                    Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Enter blog title"
                      className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm mt-1" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold text-gray-700">
                    Category
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 text-sm mt-1" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold text-gray-700">
                    Content
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your blog content here"
                      className="border-gray-300 focus:ring-blue-500 focus:border-blue-500 min-h-[200px]"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <div className="text-sm text-gray-500 mt-1">
                    {contentLength}/5000 characters
                  </div>
                  <FormMessage className="text-red-500 text-sm mt-1" />
                </FormItem>
              )}
            />
            <div>
              <FormLabel className="text-lg font-semibold text-gray-700 mb-2">
                Upload Images (Max 5)
              </FormLabel>
              <div className="relative border-2 border-dashed border-gray-300 rounded-md p-4 hover:border-blue-500 transition-colors">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  disabled={loading}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <p className="text-gray-600">
                    Drag and drop images here, or click to select files
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    (Supported formats: JPG, PNG, GIF)
                  </p>
                </div>
              </div>
              {previewUrls.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">
                      {previewUrls.length} image
                      {previewUrls.length !== 1 ? "s" : ""} selected
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearAllImages}
                      disabled={loading}
                      className="text-red-500 border-red-500 hover:bg-red-50"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {previewUrls.map((src, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={src}
                          alt={`preview-${i}`}
                          className="w-full h-32 object-cover rounded-md border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={loading}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Creating blog...
                </span>
              ) : (
                "Create Blog"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default CreateBlogPage;
