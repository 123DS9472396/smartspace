import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Lock, UserPlus, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  redirectPath?: string;
}

export default function AuthGateModal({
  isOpen,
  onClose,
  message = "Login as Storage Seeker to view warehouse details",
  redirectPath
}: AuthGateModalProps) {

  const handleLogin = () => {
    sessionStorage.setItem('redirectAfterLogin', redirectPath || '/');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Authentication Required</DialogTitle>
          <DialogDescription className="text-center pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p className="font-medium mb-1">Why sign in?</p>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• View complete warehouse details</li>
                  <li>• Book spaces and manage reservations</li>
                  <li>• Get personalized ML recommendations</li>
                  <li>• Save favorites and track inquiries</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full"
              asChild
              onClick={handleLogin}
            >
              <Link to={`/login${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}>
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
            <Button
              className="w-full"
              asChild
              onClick={handleLogin}
            >
              <Link to={`/signup${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}>
                <UserPlus className="mr-2 h-4 w-4" />
                Sign Up
              </Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            className="w-full"
            onClick={onClose}
          >
            Continue Browsing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
