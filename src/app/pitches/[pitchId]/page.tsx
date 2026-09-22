import { redirect } from "next/navigation";

export default async function PitchIndexPage({ params }: { params: Promise<{ pitchId: string }> }) {
  const { pitchId } = await params;
  redirect(`/pitches/${pitchId}/studio`);
}
