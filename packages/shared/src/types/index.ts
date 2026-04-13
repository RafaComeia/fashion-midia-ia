import { WorkspaceRole, CampaignStatus, AssetType, FashionStyle, GenerationJobStatus, PlanType } from '../enums';

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  error?: ApiError;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  segment?: FashionStyle;
  plan: PlanType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  workspaceId?: string;
  role?: WorkspaceRole;
}

export interface Campaign {
  id: string;
  workspaceId: string;
  collectionId?: string;
  title: string;
  description?: string;
  style: FashionStyle;
  prompt: string;
  status: CampaignStatus;
  assets: CampaignAsset[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignAsset {
  id: string;
  campaignId: string;
  workspaceId: string;
  type: AssetType;
  storageUrl: string;
  thumbnailUrl?: string;
  aspectRatio?: string;
  durationSecs?: number;
  createdAt: string;
}

export interface GenerationJob {
  id: string;
  campaignId: string;
  workspaceId: string;
  type: AssetType;
  status: GenerationJobStatus;
  prompt: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Collection {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  season?: string;
  createdAt: string;
}

export interface PromptStyle {
  id: string;
  name: string;
  style: FashionStyle;
  description: string;
  basePrompt: string;
  previewUrl?: string;
}
