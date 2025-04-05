import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertCircle, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-lg mx-4 shadow-lg border-t-4 border-t-primary-500">
        <CardContent className="pt-8 pb-8 px-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">404 Page Not Found</h1>
            <p className="text-gray-600 max-w-md">
              Sorry, we couldn't find the page you're looking for. The page might have been removed or is temporarily unavailable.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Button asChild variant="default" className="flex items-center gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                <span>Back to Home</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="flex items-center gap-2">
              <Link href="/?query=">
                <Search className="h-4 w-4" />
                <span>Search Products</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
