import { redirect } from "next/navigation";

export default function SimulateRedirectPage({
  params,
}: {
  params: { receiptId?: string; id?: string };
}) {
  const receiptId = params.receiptId || params.id;
  redirect(`/dashboard/${receiptId}`);
}