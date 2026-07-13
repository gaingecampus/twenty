import { RegisterFileOnRecordInputZodSchema } from 'src/engine/core-modules/tool/tools/register-file-on-record-tool/register-file-on-record-tool.schema';

describe('RegisterFileOnRecordInputZodSchema', () => {
  it('accepts sourceFileId path', () => {
    const parsed = RegisterFileOnRecordInputZodSchema.safeParse({
      objectNameSingular: 'company',
      recordId: '11111111-1111-4111-8111-111111111111',
      sourceFileId: '22222222-2222-4222-8222-222222222222',
    });

    expect(parsed.success).toBe(true);
  });

  it('accepts contentBase64 path with filename', () => {
    const parsed = RegisterFileOnRecordInputZodSchema.safeParse({
      objectNameSingular: 'person',
      recordId: '11111111-1111-4111-8111-111111111111',
      contentBase64: 'aGVsbG8=',
      filename: 'hello.txt',
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects missing file source', () => {
    const parsed = RegisterFileOnRecordInputZodSchema.safeParse({
      objectNameSingular: 'company',
      recordId: '11111111-1111-4111-8111-111111111111',
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects contentBase64 without filename', () => {
    const parsed = RegisterFileOnRecordInputZodSchema.safeParse({
      objectNameSingular: 'company',
      recordId: '11111111-1111-4111-8111-111111111111',
      contentBase64: 'aGVsbG8=',
    });

    expect(parsed.success).toBe(false);
  });

  it('accepts sourceFileId even when filename is also provided', () => {
    const parsed = RegisterFileOnRecordInputZodSchema.safeParse({
      objectNameSingular: 'company',
      recordId: '11111111-1111-4111-8111-111111111111',
      sourceFileId: '22222222-2222-4222-8222-222222222222',
      filename: 'ignored-by-server.png',
    });

    expect(parsed.success).toBe(true);
  });

  it('accepts both sources (server prefers sourceFileId)', () => {
    const parsed = RegisterFileOnRecordInputZodSchema.safeParse({
      objectNameSingular: 'company',
      recordId: '11111111-1111-4111-8111-111111111111',
      sourceFileId: '22222222-2222-4222-8222-222222222222',
      contentBase64: 'aGVsbG8=',
      filename: 'ignored-when-source-present.txt',
    });

    expect(parsed.success).toBe(true);
  });
});
