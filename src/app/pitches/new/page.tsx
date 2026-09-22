import { requireUser } from "@/lib/auth/session";
import { listIdeasForOwner } from "@/lib/db/queries/ideas";
import { NewPitchForm } from "@/components/pitch/NewPitchForm";

export default async function NewPitchPage() {
  const user = await requireUser();
  const ideas = await listIdeasForOwner(user.id);

  return (
    <div className="mx-auto max-w-2xl">
      <NewPitchForm ideas={ideas} />
    </div>
  );
}
