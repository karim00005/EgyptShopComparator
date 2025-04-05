import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import Home from "./pages/Home";
import Favorites from "./pages/Favorites";
import { AppHeader } from "./components/AppHeader";
import { AppFooter } from "./components/AppFooter";
import { SearchProvider } from "./context/SearchContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { LanguageProvider } from "./context/LanguageContext";

// Page transition component
function PageTransition({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [location] = useLocation();

  // Reset transition state on location change
  useEffect(() => {
    // First hide the content
    setIsVisible(false);
    
    // Then show it after a short delay for smooth transition
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <div
      className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {children}
    </div>
  );
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <div className="flex-1">
        <PageTransition>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/favorites" component={Favorites} />
            <Route component={NotFound} />
          </Switch>
        </PageTransition>
      </div>
      <AppFooter />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <SearchProvider>
          <FavoritesProvider>
            <Router />
            <Toaster />
          </FavoritesProvider>
        </SearchProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;
