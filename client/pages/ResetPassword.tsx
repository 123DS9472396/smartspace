import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../services/supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const setupRecoverySession = async () => {
      try {
        const hash = window.location.hash.replace("#", "");
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const type = params.get("type");

        if (hash.includes("error=access_denied")) {
          toast({
            title: "Reset link expired",
            description: "Please request a new reset email.",
            variant: "destructive",
          });
          setReady(false);
          setLoading(false);
          return;
        }

        if (!accessToken || !refreshToken || type !== "recovery") {
          setReady(false);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          toast({
            title: "Invalid recovery link",
            description: error.message,
            variant: "destructive",
          });
          setReady(false);
          setLoading(false);
          return;
        }

        setReady(true);
        setLoading(false);
      } catch (error) {
        toast({
          title: "Recovery failed",
          description: "Unable to process the recovery link.",
          variant: "destructive",
        });
        setReady(false);
        setLoading(false);
      }
    };

    setupRecoverySession();
  }, [toast]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please re-enter the same password.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Password updated",
      description: "You can now sign in with your new password.",
    });
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-200">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Reset Password</CardTitle>
          <CardDescription className="text-slate-400">
            {ready
              ? "Enter a new password for your account."
              : "This reset link is invalid or expired."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ready ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-slate-200">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-200">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Update password</Button>
            </form>
          ) : (
            <Button onClick={() => navigate("/login")} className="w-full bg-blue-600 hover:bg-blue-700">Back to login</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
