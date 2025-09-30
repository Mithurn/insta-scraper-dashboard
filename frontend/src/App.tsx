import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import SplitPanelDashboard from './components/SplitPanelDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SplitPanelDashboard />
    </QueryClientProvider>
  );
}

export default App;
