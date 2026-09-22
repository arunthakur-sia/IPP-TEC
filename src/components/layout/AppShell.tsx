import { TopNav } from "./TopNav";
import type { User } from "@/lib/types/domain";

export function AppShell({
  currentUser,
  children,
}: {
  currentUser: User | null;
  children: React.ReactNode;
}) {
  return (
    <>
      <TopNav currentUser={currentUser} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </>
  );
}
