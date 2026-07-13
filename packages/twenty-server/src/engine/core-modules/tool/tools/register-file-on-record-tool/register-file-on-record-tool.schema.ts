import { isValidUuid } from 'twenty-shared/utils';
import { z } from 'zod';

export const RegisterFileOnRecordInputZodSchema = z
  .object({
    objectNameSingular: z
      .string()
      .min(1)
      .describe(
        'Singular name of the target CRM object (e.g. company, person, opportunity, or a custom object name)',
      ),
    recordId: z
      .string()
      .refine((value) => isValidUuid(value), {
        message: 'recordId must be a valid UUID',
      })
      .describe('UUID of the target record to register the file on'),
    sourceFileId: z
      .string()
      .refine((value) => isValidUuid(value), {
        message: 'sourceFileId must be a valid UUID',
      })
      .optional()
      .describe(
        'UUID of an AgentChat-uploaded file (from AI Chat uploadAiChatFile). Prefer this for in-app chat files. The original uploaded filename is always preserved — do not pass filename with sourceFileId.',
      ),
    contentBase64: z
      .string()
      .min(1)
      .optional()
      .describe(
        'Base64-encoded file content for MCP clients that do not have a prior AgentChat fileId. Do not include a data URL prefix.',
      ),
    filename: z
      .string()
      .min(1)
      .optional()
      .describe(
        'Required only when contentBase64 is provided. Ignored when sourceFileId is set — the server uses the original chat upload filename.',
      ),
  })
  .superRefine((value, context) => {
    const hasSourceFileId = isValidUuid(value.sourceFileId ?? '');
    const hasContentBase64 =
      typeof value.contentBase64 === 'string' && value.contentBase64.length > 0;

    if (!hasSourceFileId && !hasContentBase64) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide either sourceFileId or contentBase64',
        path: ['sourceFileId'],
      });
    }

    if (hasContentBase64 && !hasSourceFileId && !value.filename) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'filename is required when contentBase64 is provided',
        path: ['filename'],
      });
    }
  });

export type RegisterFileOnRecordInput = z.infer<
  typeof RegisterFileOnRecordInputZodSchema
>;
