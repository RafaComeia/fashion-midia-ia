export enum WorkspaceRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  GENERATING = 'generating',
  READY = 'ready',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum AssetType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum FashionStyle {
  CASUAL = 'casual',
  FESTA = 'festa',
  FITNESS = 'fitness',
  INFANTIL = 'infantil',
  EXECUTIVO = 'executivo',
  PRAIA = 'praia',
  NOIVAS = 'noivas',
  PLUS_SIZE = 'plus_size',
}

export enum GenerationJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum PlanType {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}
