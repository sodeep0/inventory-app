'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P & { token?: string }>
) => {
  const Wrapper = (props: P) => {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, router, loading]);

    if (loading || !isAuthenticated) {
      return <div>Loading...</div>; // or a loading spinner
    }

    return <WrappedComponent {...props} token={user?.token} />;
  };

  return Wrapper;
};

export default withAuth;
