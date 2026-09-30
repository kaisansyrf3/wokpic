"use client";

import { useActionState } from "react";

import { sendMessage, type ContactFormState } from "@/app/(site)/contact/actions";

export function ContactForm({
  services,
  initialService,
}: {
  services: { slug: string; name: string }[];
  initialService: string;
}) {
  const INITIAL: ContactFormState = {
    ok: false,
    message: "",
    values: { name: "", email: "", phone: "", service: initialService, body: "" },
  };
  const [state, action, pending] = useActionState(sendMessage, INITIAL);

  return (
    <form action={action} className="space-y-6">
      <div aria-hidden className="hidden">
        <label>
          Jangan diisi
          <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {state.message ? (
        <p
          role="status"
          className={
            state.ok
              ? "border-l-2 border-chalk/60 bg-ink-soft px-4 py-3 text-sm"
              : "border-l-2 border-red-400/60 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field name="name" label="Nama" required error={state.errors?.name}>
          <input
            id="name"
            name="name"
            required
            maxLength={80}
            defaultValue={state.values.name}
            className="field-input"
          />
        </Field>

        <Field name="email" label="Email" required error={state.errors?.email}>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={160}
            defaultValue={state.values.email}
            className="field-input"
          />
        </Field>

        <Field name="phone" label="Telepon/WhatsApp" error={state.errors?.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            maxLength={30}
            defaultValue={state.values.phone}
            className="field-input"
          />
        </Field>

        <Field name="service" label="Paket">
          {/* A changed defaultValue alone never re-applies to a <select> after
              React resets the form, so the element is remounted on each state. */}
          <select
            id="service"
            name="service"
            key={state.values.service}
            defaultValue={state.values.service}
            className="field-input"
          >
            <option value="">Belum tahu, ingin konsultasi dulu</option>
            {services.map((service) => (
              <option key={service.slug} value={service.slug}>
                {service.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field name="body" label="Pesan" required error={state.errors?.body}>
        <textarea
          id="body"
          name="body"
          required
          minLength={10}
          maxLength={2000}
          rows={6}
          defaultValue={state.values.body}
          className="field-input min-h-40"
          placeholder="Ceritakan rencana acaranya: tanggal, lokasi, dan yang paling Anda ingin ingat."
        />
      </Field>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="ui-label border border-chalk bg-chalk px-8 py-4 uppercase tracking-widest text-ink transition-opacity disabled:opacity-40"
        >
          {pending ? "Mengirim…" : "Kirim pesan"}
        </button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  required = false,
  error,
  children,
}: {
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="ui-label text-ash">
        {label}
        {required ? <span className="text-chalk"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-200">
          {label}: {error}
        </p>
      ) : null}
    </div>
  );
}
