export const articleCategories = [
  "Hiring Trends",
  "Workforce Management",
  "Sales Hiring",
  "Gig Economy",
  "Retail Execution",
  "Trade Marketing",
  "Industry Insights",
] as const;

export type ArticleCategory = (typeof articleCategories)[number];

export interface ArticleImage {
  url: string;
  alt: string;
  caption?: string;
}

export interface ArticleSection {
  id: string;
  heading: string;
  paragraphs: string[];
  points?: string[];
  quotes?: string[];
  images?: ArticleImage[];
}

export interface ArticleSummary {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  readingMinutes: number;
  authorName?: string | null;
  tags?: string[];
  coverImageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  ogImageUrl?: string | null;
  publishedAt?: string | null;
  updatedAt?: string;
  isPublished: boolean;
  isSample: boolean;
}

export interface Article extends ArticleSummary {
  takeaway: string;
  sections: ArticleSection[];
}

export interface ArticleFilters {
  query?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface ArticleList {
  items: ArticleSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
