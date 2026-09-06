export interface ContactDetails {
  businessEmail?: string;
  phone?: { label: string; href: string };
  officeAddress?: string;
  socialLinks?: readonly { label: string; href: string }[];
}

// Add only client-approved business contacts. The WhatsApp sender's private
// number is not a verified public business number. Empty fields stay hidden.
export const contactDetails: ContactDetails = {};
