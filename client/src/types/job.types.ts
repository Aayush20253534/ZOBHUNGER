export interface Job {
  id: string;
  slug: string;
  title: string;
  location: string;
  category: string;
  jobType: string;
  description: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
  responsibilities?: readonly string[];
  requirements?: readonly string[];
}

export interface JobFilters {
  query?: string;
  location?: string;
  category?: string;
  jobType?: string;
  page?: number;
  pageSize?: number;
}

export interface JobList {
  items: Job[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
