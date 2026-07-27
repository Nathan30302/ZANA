import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AuthService } from '../auth/auth.service';

const uploadRoot = join(process.cwd(), 'uploads');

function ensureUploadDir() {
  if (!existsSync(uploadRoot)) mkdirSync(uploadRoot, { recursive: true });
}

@Controller('uploads')
export class UploadsController {
  constructor(private readonly auth: AuthService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 6, {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureUploadDir();
          cb(null, uploadRoot);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only images allowed') as never, false);
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @Headers('authorization') authorization: string | undefined,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const user = await this.auth.userFromToken(authorization);
    if (!user) throw new UnauthorizedException();
    if (!files?.length) throw new BadRequestException('No files uploaded');

    const base =
      process.env.PUBLIC_BASE_URL ||
      `http://localhost:${process.env.PORT || 3000}`;

    return {
      urls: files.map((f) => `${base}/uploads/${f.filename}`),
    };
  }
}
