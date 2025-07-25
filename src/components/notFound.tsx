import { Button } from "./ui/button";

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-8xl font-bold">404</h1>
      <p className="mt-4 text-lg text-gray-600">Oops! Page not found.</p>
      <Button>
        <a href="/">Go back home</a>
      </Button>
    </div>
  );
}

export default NotFound;
