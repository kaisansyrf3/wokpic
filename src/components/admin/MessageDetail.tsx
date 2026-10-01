"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FlashMessage, useFlash } from "@/components/admin/Flash";
import { deleteMessage, setMessageRead } from "@/app/admin/(panel)/messages/actions";
import { siteConfig } from "@/config/site";
import { formatDateID } from "@/lib/utils";

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service_name: string | null;
  category_name: string | null;
  body: string;
  ip: string | null;
  email_sent: boolean;
  is_read: boolean;
  created_at: string | null;
};

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="ui-label text-ash">{label}</p>
      <p className="text-sm break-words">{value}</p>
    </div>
  );
}

export function MessageDetail({ message }: { message: Message }) {
  const router = useRouter();
  const { flash, run } = useFlash();

  const [pending, setPending] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const subject = `Re: Pesan lewat situs ${siteConfig.name} (${message.name})`;
  const mailto = `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(subject)}`;

  const toggleRead = async () => {
    setPending(true);
    await run(setMessageRead(message.id, !message.is_read));
    setPending(false);
    router.refresh();
  };

  const confirmDelete = async () => {
    setPending(true);
    const ok = await run(deleteMessage(message.id));
    setPending(false);
    if (ok) router.push("/admin/messages");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/messages" className="ui-label text-ash hover:text-chalk">
            ← Semua pesan
          </Link>
          <h1 className="mt-2 text-xl font-light uppercase tracking-[0.2em]">{message.name}</h1>
          {message.created_at ? (
            <p className="mt-1 text-sm text-ash">
              {formatDateID(message.created_at)} WIB
            </p>
          ) : null}
        </div>

        <span
          className={
            message.email_sent
              ? "border border-emerald-400/40 px-2 py-1 text-[10px] uppercase tracking-widest text-emerald-200"
              : "border border-amber-400/40 px-2 py-1 text-[10px] uppercase tracking-widest text-amber-200"
          }
        >
          {message.email_sent ? "Email terkirim" : "Email gagal kirim"}
        </span>
      </header>

      {!message.email_sent ? (
        <p className="border-l-2 border-amber-400/70 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Email notifikasi ke pemilik gagal terkirim. Isi pesan di bawah tetap aman dan bisa
          dibalas langsung dari halaman ini.
        </p>
      ) : null}

      <FlashMessage flash={flash} />

      <section className="admin-card grid gap-5 p-5 sm:grid-cols-2">
        <Field label="Email" value={message.email} />
        <Field label="Telepon / WhatsApp" value={message.phone} />
        <Field label="Paket yang dipilih" value={message.service_name ?? "Konsultasi dulu"} />
        <Field label="Kategori asal" value={message.category_name} />
        <Field label="Alamat IP" value={message.ip} />
      </section>

      <section className="admin-card space-y-3 p-5">
        <p className="admin-heading">Isi pesan</p>
        <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <Link href="/admin/messages" className="admin-button">
          Kembali
        </Link>
        <button
          type="button"
          onClick={toggleRead}
          disabled={pending}
          className="admin-button"
        >
          {message.is_read ? "Tandai belum dibaca" : "Tandai sudah dibaca"}
        </button>
        <button type="button" onClick={confirmDelete} className="admin-button admin-button-danger">
          Hapus
        </button>
        <a href={mailto} className="admin-button admin-button-primary">
          Balas via email
        </a>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        busy={pending}
        title="Hapus pesan ini?"
        description="Pesan akan dihapus permanen dari kotak masuk. Simpan dulu isinya jika masih diperlukan."
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
