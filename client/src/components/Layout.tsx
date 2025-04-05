import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 pt-[112px]">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
