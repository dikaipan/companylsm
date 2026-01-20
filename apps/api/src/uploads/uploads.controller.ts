
import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {

    @Post('video')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './public/uploads/videos',
            filename: (req: any, file: any, cb: any) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
        fileFilter: (req: any, file: any, cb: any) => {
            if (!file.mimetype.match(/\/(mp4|webm|ogg|mov)$/)) {
                return cb(new BadRequestException('Only video files are allowed!'), false);
            }
            cb(null, true);
        },
        limits: {
            fileSize: 1024 * 1024 * 500, // 500MB
        },
    }))
    @ApiOperation({ summary: 'Upload a video file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async uploadVideo(@UploadedFile() file: any) {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        // Return relative path from the static root
        return {
            url: `/uploads/videos/${file.filename}`,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size
        };
    }

    @Post('file')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './public/uploads/files',
            filename: (req: any, file: any, cb: any) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
        limits: {
            fileSize: 1024 * 1024 * 50, // 50MB
        },
    }))
    @ApiOperation({ summary: 'Upload a generic file (PDF, Doc, etc)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async uploadFile(@UploadedFile() file: any) {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        return {
            url: `/uploads/files/${file.filename}`,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size
        };
    }
}
