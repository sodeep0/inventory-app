"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P & { token?: string }>
) => {
  const Wrapper = (props: P) => {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push("/login");
      }
    }, [isAuthenticated, router, loading]);

    if (loading || !isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">Loading...</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/login")}
            >
              Go to Login
            </Button>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} token={user?.token} />;
  };

  return Wrapper;
};

export default withAuth;
