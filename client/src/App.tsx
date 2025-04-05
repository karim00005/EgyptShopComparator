import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Favorites from "@/pages/Favorites";
import { AppHeader } from "./components/AppHeader";
import { AppFooter } from "./components/AppFooter";
import { SearchProvider } from "./context/SearchContext";
import { FavoritesProvider } from "./context/FavoritesContext";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <div className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/favorites" component={Favorites} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <AppFooter />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SearchProvider>
        <FavoritesProvider>
          <Router />
          <Toaster />
        </FavoritesProvider>
      </SearchProvider>
    </QueryClientProvider>
  );
}

export default App;
