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
export interface ArticleSection {
  id: string;
  heading: string;
  paragraphs: string[];
  points?: string[];
}
export interface ArticleSummary {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  readingMinutes: number;
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
