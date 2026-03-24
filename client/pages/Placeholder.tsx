import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowRight, Construction } from "lucide-react";
import { Link } from "react-router-dom";

interface PlaceholderProps {
  title: string;
  description: string;
  suggestions?: string[];
}

export default function Placeholder({ title, description, suggestions = [] }: PlaceholderProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-xl text-gray-900">SmartSpace</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/warehouses" className="text-gray-600 hover:text-gray-900 font-medium">Find Warehouses</Link>
            <Link to="/list-property" className="text-gray-600 hover:text-gray-900 font-medium">List Your Property</Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-900 font-medium">About</Link>
            <Link to="/contact" className="text-gray-600 hover:text-gray-900 font-medium">Contact</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="p-8">
            <CardHeader className="pb-6">
              <Construction className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-2xl lg:text-3xl font-bold text-gray-900">
                {title}
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                {description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <p className="text-gray-600">
                This page is currently under development. Our team is working hard to bring you 
                the best experience possible.
              </p>
              
              {suggestions.length > 0 && (
                <div className="space-y-4">
                  <p className="font-medium text-gray-900">In the meantime, you can:</p>
                  <ul className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="text-gray-600 text-left">
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button asChild>
                  <Link to="/">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Back to Homepage
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/warehouses">Browse Warehouses</Link>
                </Button>
              </div>
              
              <div className="pt-6 border-t">
                <p className="text-sm text-gray-500">
                  Have questions or need help? <Link to="/contact" className="text-blue-600 hover:underline">Contact our team</Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
