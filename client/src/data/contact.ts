export interface ContactDetails {
  businessEmail?: string;
  phone?: { label: string; href: string };
  officeAddress?: string;
  socialLinks?: readonly { label: string; href: string }[];
}

// Add only client-approved business contacts and certified office details.
// Empty fields stay hidden, so office information can be added once the
// certification details supplied by the client are available in source form.
export const contactDetails: ContactDetails = {};
