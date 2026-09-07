export interface ContactDetails {
  businessEmail?: string;
  phone?: { label: string; href: string };
  officeAddress?: string;
  socialLinks?: readonly { label: string; href: string }[];
}

// Certified corporate contact details supplied in the signed ZOBHUNGER
// Corporate Capability Statement. Keep this file as the single source used
// by public contact surfaces and organization metadata.
export const contactDetails: ContactDetails = {
  businessEmail: "help@zobhungr.com",
  phone: {
    label: "+91-548-4051917",
    href: "tel:+915484051917",
  },
  officeAddress:
    "Vijay Villa, 258, Nawapura, CISF Colony, Opium Factory Road, Ghazipur, Uttar Pradesh 233001",
};
