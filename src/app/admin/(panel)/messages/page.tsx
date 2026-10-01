import type { Metadata } from "next";
import Link from "next/link";

import { countUnreadMessages, listMessages } from "@/lib/supabase/admin-queries";
import { formatDateID } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

function EmailBadge({ sent }: { sent: boolean }) {
  return (
    <span
      className={
        sent
          ? "border border-emerald-400/40 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-emerald-200"
          : "border border-amber-400/40 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-amber-200"
      }
    >
      {sent ? "Email terkirim" : "Email gagal kirim"}
    </span>
  );
}

export default async function MessagesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const unreadOnly = filter === "unread";

  const [messages, unread] = await Promise.all([
    listMessages(unreadOnly),
    countUnreadMessages(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-light uppercase tracking-[0.2em]">Pesan</h1>
        <p className="mt-1 text-sm text-ash">
          {messages.length} pesan ditampilkan · {unread} belum dibaca. Membuka pesan akan langsung
          menandainya sebagai sudah dibaca.
        </p>
      </header>

      <nav className="flex gap-2 text-xs">
        <Link
          href="/admin/messages"
          className={
            unreadOnly
              ? "admin-button"
              : "admin-button admin-button-primary"
          }
        >
          Semua
        </Link>
        <Link
          href="/admin/messages?filter=unread"
          className={
            unreadOnly
              ? "admin-button admin-button-primary"
              : "admin-button"
          }
        >
          Belum dibaca
        </Link>
      </nav>

      {messages.length === 0 ? (
        <p className="admin-card px-5 py-10 text-center text-sm text-ash">
          {unreadOnly
            ? "Tidak ada pesan yang belum dibaca."
            : "Belum ada pesan. Pengiriman dari form Contact akan muncul di sini."}
        </p>
      ) : (
        <ul className="space-y-2">
          {messages.map((message) => (
            <li key={message.id}>
              <Link
                href={`/admin/messages/${message.id}`}
                className="admin-card flex flex-wrap items-center gap-3 px-4 py-3 hover:border-chalk/40"
              >
                <span
                  aria-label={message.is_read ? "Sudah dibaca" : "Belum dibaca"}
                  className={
                    message.is_read
                      ? "h-2 w-2 shrink-0 rounded-full border border-line"
                      : "h-2 w-2 shrink-0 rounded-full bg-chalk"
                  }
                />

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-2">
                    <span className={message.is_read ? "text-sm text-ash" : "text-sm"}>
                      {message.name}
                    </span>
                    <span className="ui-label truncate text-ash">{message.email}</span>
                  </span>
                  <span className={message.is_read ? "mt-1 block truncate text-xs text-ash" : "mt-1 block truncate text-xs"}>
                    {message.body}
                  </span>
                </span>

                {message.service_name ? (
                  <span className="border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-ash">
                    {message.service_name}
                  </span>
                ) : null}

                <EmailBadge sent={message.email_sent} />

                {message.created_at ? (
                  <span className="ui-label shrink-0 text-ash">{formatDateID(message.created_at)}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
