import { z } from 'zod'

// Chat message schemas
export const createChatMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(5000),
  category: z.enum(['GENERAL', 'ANNOUNCEMENTS', 'PROJECTS', 'RESOURCES', 'QUESTIONS']).default('GENERAL'),
  attachmentUrl: z.string().url().optional(),
  attachmentName: z.string().max(255).optional(),
})

export const updateChatMessageSchema = z.object({
  content: z.string().min(1).max(5000),
})

// Committee document schemas
export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['GOVERNANCE', 'FINANCIAL', 'LEGAL', 'EDUCATIONAL', 'OPERATIONAL']),
  fileUrl: z.string().url('Valid file URL is required'),
  fileName: z.string().min(1, 'File name is required').max(255),
  fileType: z.string().min(1, 'File type is required'),
  fileSize: z.number().positive('File size must be positive'),
})

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  category: z.enum(['GOVERNANCE', 'FINANCIAL', 'LEGAL', 'EDUCATIONAL', 'OPERATIONAL']).optional(),
  isShared: z.boolean().optional(),
})

// AI summary generation schema
export const generateSummarySchema = z.object({
  weekStarting: z.string().datetime().optional(), // ISO date string, defaults to last Sunday
})

// Committee enrollment schema (for questionnaire)
export const enrollCommitteesSchema = z.object({
  committeeIds: z.array(z.string()).min(1, 'Select at least one committee'),
})

export type CreateChatMessageInput = z.infer<typeof createChatMessageSchema>
export type UpdateChatMessageInput = z.infer<typeof updateChatMessageSchema>
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>
export type GenerateSummaryInput = z.infer<typeof generateSummarySchema>
export type EnrollCommitteesInput = z.infer<typeof enrollCommitteesSchema>
