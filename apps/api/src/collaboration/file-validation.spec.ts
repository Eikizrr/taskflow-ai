import { FileTypeValidator } from '@nestjs/common';

describe('Attachment file validation', () => {
  const validator = new FileTypeValidator({
    fileType:
      /(pdf|png|jpe?g|gif|webp|plain|csv|zip|msword|officedocument|spreadsheet|presentation)/,
    fallbackToMimetype: true,
  });

  it('accepts plain text files when no magic number exists', async () => {
    const file = {
      mimetype: 'text/plain',
      buffer: Buffer.from('TaskFlow smoke attachment'),
    } as Express.Multer.File;

    await expect(validator.isValid(file)).resolves.toBe(true);
  });

  it('rejects executable MIME types', async () => {
    const file = {
      mimetype: 'application/x-msdownload',
      buffer: Buffer.from('MZ'),
    } as Express.Multer.File;

    await expect(validator.isValid(file)).resolves.toBe(false);
  });
});
