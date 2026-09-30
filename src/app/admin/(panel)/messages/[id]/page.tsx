import { notFound } from "next/navigation";

import { MessageDetail } from "@/components/admin/MessageDetail";
import { requireAdminUser } from "@/lib/auth";
import { getMessage, markMessageRead } from "@/lib/supabase/admin-queries";

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdminUser(`/admin/messages/${id}`);

  const message = await getMessage(id);
  if (!message) notFound();

  if (!message.is_read) {
    await markMessageRead(id);
    message.is_read = true;
  }

  return <MessageDetail message={message} />;
}
