export const API_VERSION = 'v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const GENERATION_LIMITS = {
  MAX_REFERENCE_IMAGES: 14,
  MAX_CONCURRENT_JOBS: 3,
  IMAGE_SIZES: ['512', '1K', '2K', '4K'] as const,
  ASPECT_RATIOS: ['1:1', '9:16', '16:9', '4:5', '3:4'] as const,
};

export const STORAGE_BUCKETS = {
  PRODUCTS: 'products',
  CAMPAIGNS: 'campaigns',
  WORKSPACE_ASSETS: 'workspace-assets',
} as const;

export const RATE_LIMITS = {
  GENERAL_PER_MINUTE: 100,
  AI_GENERATION_PER_MINUTE: 10,
} as const;
