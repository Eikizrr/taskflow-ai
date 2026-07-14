import { Injectable, NotFoundException } from '@nestjs/common';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createReadStream, existsSync, mkdirSync, promises as fs } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';
@Injectable()
export class StorageService {
  private client?: S3Client;
  private bucket = process.env.STORAGE_BUCKET ?? '';
  constructor() {
    if (
      process.env.STORAGE_ENDPOINT &&
      process.env.STORAGE_ACCESS_KEY &&
      process.env.STORAGE_SECRET_KEY &&
      this.bucket
    )
      this.client = new S3Client({
        region: process.env.STORAGE_REGION ?? 'us-east-1',
        endpoint: process.env.STORAGE_ENDPOINT,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.STORAGE_ACCESS_KEY,
          secretAccessKey: process.env.STORAGE_SECRET_KEY,
        },
      });
  }
  async save(
    file: Express.Multer.File,
    organizationId: string,
    taskId: string,
  ) {
    const key = `${organizationId}/${taskId}/${randomUUID()}${extname(file.originalname).toLowerCase()}`;
    if (this.client) {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: { originalName: encodeURIComponent(file.originalname) },
        }),
      );
      return `s3:${key}`;
    }
    const directory = join(process.cwd(), 'uploads', organizationId, taskId);
    mkdirSync(directory, { recursive: true });
    const path = join(directory, key.split('/').pop()!);
    await fs.writeFile(path, file.buffer);
    return `local:${path}`;
  }
  async read(reference: string): Promise<Readable> {
    if (reference.startsWith('s3:') && this.client) {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: reference.slice(3) }),
      );
      if (!response.Body) throw new NotFoundException('Arquivo não encontrado');
      return response.Body as Readable;
    }
    const path = reference.replace(/^local:/, '');
    if (!existsSync(path))
      throw new NotFoundException('Arquivo não encontrado');
    return createReadStream(path);
  }
}
