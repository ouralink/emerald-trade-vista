import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative">
      <Button
        onClick={() => navigate(-1)}
        variant="ghost"
        className="absolute top-4 left-4 text-white hover:bg-gray-800"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-green-400">404</h1>
        <p className="text-xl text-gray-300 mb-4">Oops! Page not found</p>
        <Button
          onClick={() => navigate("/")}
          className="bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
