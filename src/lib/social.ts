import type { SocialLink } from "@/types/database";

/**
 * The WhatsApp number has its own column, so its link is built here rather than
 * stored as a repeater row. Display order: saved networks first, WhatsApp last.
 */
export function withWhatsAppLink(
  socialLinks: SocialLink[],
  whatsappNumber: string | null,
): SocialLink[] {
  if (!whatsappNumber) return socialLinks;
  return [...socialLinks, { platform: "whatsapp", url: `https://wa.me/${whatsappNumber}` }];
}
