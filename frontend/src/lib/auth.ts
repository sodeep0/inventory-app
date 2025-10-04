export const getAuthHeaders = () => {
  const user = localStorage.getItem('user');
  let token = null;
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      token = userData.token;
    } catch (error) {
      console.error('Failed to parse user data:', error);
    }
  }
  
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Function to handle API errors and logout on 401
export const handleAuthError = (error: unknown, logout: () => void) => {
  if (error && typeof error === 'object' && 'response' in error && 
      error.response && typeof error.response === 'object' && 'status' in error.response && 
      error.response.status === 401) {
    console.log('Authentication failed, logging out user');
    logout();
  }
};
