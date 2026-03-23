import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";

import NotFound from "./pages/NotFound.tsx";
import HiveLogin from "./pages/HiveLogin.tsx";
import HiveCommunity from "./pages/HiveCommunity.tsx";
import SetupPassword from "./pages/SetupPassword.tsx";
import CustomCursor from "./components/CustomCursor.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CustomCursor />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Route "/" available for new page */}
          <Route path="/old-version" element={<Index />} />
          <Route path="/the-hive" element={<HiveLogin />} />
          <Route path="/the-hive/setup-password" element={<SetupPassword />} />
          <Route path="/the-hive/community" element={<HiveCommunity />} />
          <Route path="/the-hive/community/:view" element={<HiveCommunity />} />
          <Route path="/the-hive/community/post/:postId" element={<HiveCommunity />} />
          <Route path="/the-hive/community/profile/:userId" element={<HiveCommunity />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
