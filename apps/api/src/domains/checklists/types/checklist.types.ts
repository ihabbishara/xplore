import { z } from 'zod';

// Enums
export enum ChecklistCategory {
  TRAVEL = 'travel',
  RELOCATION = 'relocation', 
  ADVENTURE = 'adventure',
  BUSINESS = 'business',
  WEEKEND = 'weekend',
  OUTDOOR = 'outdoor',
  URBAN = 'urban',
  INTERNATIONAL = 'international',
  DOMESTIC = 'domestic',
  FAMILY = 'family',
  SOLO = 'solo',
  BUDGET = 'budget',
  LUXURY = 'luxury'
}

export enum ChecklistVisibility {
  PRIVATE = 'private',
  SHARED = 'shared',
  PUBLIC = 'public'
}

export enum ChecklistItemPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2
}

export enum ChecklistItemCategory {
  DOCUMENTS = 'documents',
  CLOTHING = 'clothing',
  ELECTRONICS = 'electronics',
  TOILETRIES = 'toiletries',
  HEALTH = 'health',
  MONEY = 'money',
  ACCOMMODATION = 'accommodation',
  TRANSPORTATION = 'transportation',
  ACTIVITIES = 'activities',
  FOOD = 'food',
  EMERGENCY = 'emergency',
  WORK = 'work',
  ENTERTAINMENT = 'entertainment',
  GEAR = 'gear',
  OTHER = 'other'
}

export enum CollaboratorRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

export enum ChecklistActivityAction {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  COMPLETED = 'completed',
  UNCOMPLETED = 'uncompleted',
  ASSIGNED = 'assigned',
  UNASSIGNED = 'unassigned',
  SHARED = 'shared',
  UNSHARED = 'unshared',
  ITEM_ADDED = 'item_added',
  ITEM_REMOVED = 'item_removed',
  ITEM_MOVED = 'item_moved'
}

// Interfaces
export interface ChecklistTemplateDefaultItem {
  name: string;
  description?: string;
  category?: ChecklistItemCategory;
  priority?: ChecklistItemPriority;
  metadata?: {
    quantity?: number;
    weatherDependent?: boolean;
    locationSpecific?: boolean;
    seasonSpecific?: string[];
  };
}

export interface ChecklistTemplateMetadata {
  icon?: string;
  color?: string;
  estimatedItems?: number;
  popularFor?: string[];
  weatherConsiderations?: boolean;
  customizationTips?: string[];
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  category: ChecklistCategory;
  icon?: string;
  isSystem: boolean;
  isPublic: boolean;
  tags: string[];
  defaultItems: ChecklistTemplateDefaultItem[];
  createdBy?: string;
  usageCount: number;
  rating?: number;
  metadata?: ChecklistTemplateMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistMetadata {
  icon?: string;
  color?: string;
  autoSuggestionsEnabled?: boolean;
  weatherAware?: boolean;
  locationAware?: boolean;
  reminderEnabled?: boolean;
  reminderTime?: string; // ISO time string
}

export interface Checklist {
  id: string;
  name: string;
  description?: string;
  userId: string;
  tripId?: string;
  templateId?: string;
  dueDate?: Date;
  isCollaborative: boolean;
  visibility: ChecklistVisibility;
  progress: number; // 0-100
  metadata?: ChecklistMetadata;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (optional, populated when needed)
  user?: any;
  trip?: any;
  template?: ChecklistTemplate;
  items?: ChecklistItem[];
  collaborators?: ChecklistCollaborator[];
  activities?: ChecklistActivity[];
}

export interface ChecklistItemAttachment {
  url: string;
  name: string;
  type: string;
  size?: number;
}

export interface ChecklistItemMetadata {
  quantity?: number;
  weatherDependent?: boolean;
  locationSpecific?: boolean;
  seasonSpecific?: string[];
  estimatedCost?: number;
  currency?: string;
  purchaseUrl?: string;
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  name: string;
  description?: string;
  category?: ChecklistItemCategory;
  priority: ChecklistItemPriority;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: string;
  assignedTo?: string;
  dueDate?: Date;
  notes?: string;
  attachments?: ChecklistItemAttachment[];
  position: number;
  metadata?: ChecklistItemMetadata;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (optional)
  checklist?: Checklist;
  assignee?: any;
  completedUser?: any;
}

export interface ChecklistCollaborator {
  id: string;
  checklistId: string;
  userId: string;
  role: CollaboratorRole;
  canEdit: boolean;
  canComplete: boolean;
  canAssign: boolean;
  invitedBy?: string;
  joinedAt: Date;
  
  // Relations (optional)
  checklist?: Checklist;
  user?: any;
  inviter?: any;
}

export interface ChecklistActivity {
  id: string;
  checklistId: string;
  userId: string;
  itemId?: string;
  action: ChecklistActivityAction;
  details?: any;
  createdAt: Date;
  
  // Relations (optional)
  checklist?: Checklist;
  user?: any;
}

// DTOs
export interface CreateChecklistTemplateDto {
  name: string;
  description?: string;
  category: ChecklistCategory;
  icon?: string;
  tags: string[];
  defaultItems: ChecklistTemplateDefaultItem[];
  isPublic?: boolean;
  metadata?: ChecklistTemplateMetadata;
}

export interface UpdateChecklistTemplateDto {
  name?: string;
  description?: string;
  category?: ChecklistCategory;
  icon?: string;
  tags?: string[];
  defaultItems?: ChecklistTemplateDefaultItem[];
  isPublic?: boolean;
  metadata?: ChecklistTemplateMetadata;
}

export interface CreateChecklistDto {
  name: string;
  description?: string;
  tripId?: string;
  templateId?: string;
  dueDate?: Date;
  isCollaborative?: boolean;
  visibility?: ChecklistVisibility;
  metadata?: ChecklistMetadata;
}

export interface UpdateChecklistDto {
  name?: string;
  description?: string;
  dueDate?: Date;
  visibility?: ChecklistVisibility;
  metadata?: ChecklistMetadata;
}

export interface CreateChecklistItemDto {
  name: string;
  description?: string;
  category?: ChecklistItemCategory;
  priority?: ChecklistItemPriority;
  assignedTo?: string;
  dueDate?: Date;
  notes?: string;
  position?: number;
  metadata?: ChecklistItemMetadata;
}

export interface UpdateChecklistItemDto {
  name?: string;
  description?: string;
  category?: ChecklistItemCategory;
  priority?: ChecklistItemPriority;
  assignedTo?: string;
  dueDate?: Date;
  notes?: string;
  position?: number;
  metadata?: ChecklistItemMetadata;
}

export interface BulkCreateChecklistItemsDto {
  items: CreateChecklistItemDto[];
}

export interface ReorderChecklistItemsDto {
  itemIds: string[];
}

export interface AddCollaboratorDto {
  userId: string;
  role?: CollaboratorRole;
  canEdit?: boolean;
  canComplete?: boolean;
  canAssign?: boolean;
}

export interface UpdateCollaboratorDto {
  role?: CollaboratorRole;
  canEdit?: boolean;
  canComplete?: boolean;
  canAssign?: boolean;
}

// Query filters
export interface ChecklistTemplateFilters {
  category?: ChecklistCategory;
  tags?: string[];
  isSystem?: boolean;
  isPublic?: boolean;
  search?: string;
  minRating?: number;
  sortBy?: 'name' | 'rating' | 'usageCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ChecklistFilters {
  userId?: string;
  tripId?: string;
  visibility?: ChecklistVisibility;
  isCollaborative?: boolean;
  hasIncompleteItems?: boolean;
  dueBefore?: Date;
  dueAfter?: Date;
  search?: string;
  sortBy?: 'name' | 'progress' | 'dueDate' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ChecklistItemFilters {
  checklistId?: string;
  category?: ChecklistItemCategory;
  priority?: ChecklistItemPriority;
  isCompleted?: boolean;
  assignedTo?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  search?: string;
}

// WebSocket events
export interface ChecklistWebSocketEvents {
  'checklist:created': { checklist: Checklist };
  'checklist:updated': { checklist: Checklist };
  'checklist:deleted': { checklistId: string };
  'checklist:progress': { checklistId: string; progress: number };
  
  'item:created': { checklistId: string; item: ChecklistItem };
  'item:updated': { checklistId: string; item: ChecklistItem };
  'item:deleted': { checklistId: string; itemId: string };
  'item:completed': { checklistId: string; itemId: string; completedBy: string };
  'item:uncompleted': { checklistId: string; itemId: string };
  'item:reordered': { checklistId: string; itemIds: string[] };
  
  'collaborator:joined': { checklistId: string; collaborator: ChecklistCollaborator };
  'collaborator:left': { checklistId: string; userId: string };
  'collaborator:updated': { checklistId: string; collaborator: ChecklistCollaborator };
}

// Weather-aware suggestions
export interface WeatherBasedSuggestion {
  items: CreateChecklistItemDto[];
  reason: string;
  weatherConditions: {
    temperature: { min: number; max: number };
    conditions: string[];
    precipitation?: number;
  };
}

// Template recommendations
export interface TemplateRecommendation {
  template: ChecklistTemplate;
  score: number;
  reasons: string[];
  matchedTags: string[];
}