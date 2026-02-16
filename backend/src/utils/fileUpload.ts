import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { Request } from 'express';

// --- Configuration ---
const BASE_UPLOAD_PATH = path.join(__dirname, '../../uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const COMPRESSION_QUALITY = 90; // Nearly lossless
const THUMBNAIL_SIZE = 200;

// --- Folder Types ---
export enum UploadFolder {
    MENU_ITEMS = 'menu-items',
    ADDONS = 'addons',
    USERS = 'users',
    GENERAL = 'general'
}

// --- Ensure directories exist ---
const ensureDirectoryExists = (dirPath: string): void => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Create all upload folders on startup
Object.values(UploadFolder).forEach(folder => {
    ensureDirectoryExists(path.join(BASE_UPLOAD_PATH, folder));
    ensureDirectoryExists(path.join(BASE_UPLOAD_PATH, folder, 'thumbnails'));
});

// --- Security: Sanitize filename ---
const sanitizeFilename = (filename: string): string => {
    // Remove special characters, keep only alphanumeric, dash, underscore, dot
    return filename
        .replace(/[^a-zA-Z0-9.-_]/g, '_')
        .replace(/_{2,}/g, '_')
        .substring(0, 100); // Limit filename length
};

// --- Security: Validate MIME type ---
const isValidMimeType = (mimetype: string): boolean => {
    return ALLOWED_MIME_TYPES.includes(mimetype.toLowerCase());
};

// --- Security: Validate file extension ---
const isValidExtension = (filename: string): boolean => {
    const ext = path.extname(filename).toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext);
};

// --- Generate unique filename ---
const generateUniqueFilename = (originalName: string): string => {
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1E6);
    const ext = path.extname(originalName).toLowerCase();
    const baseName = sanitizeFilename(path.basename(originalName, ext));
    return `${baseName}_${timestamp}_${randomNum}${ext}`;
};

// --- File Filter for Multer ---
const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
): void => {
    // Check MIME type
    if (!isValidMimeType(file.mimetype)) {
        cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`));
        return;
    }

    // Check extension
    if (!isValidExtension(file.originalname)) {
        cb(new Error(`Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
        return;
    }

    cb(null, true);
};

// --- Multer Storage Configuration ---
const createStorage = (folder: UploadFolder) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = path.join(BASE_UPLOAD_PATH, folder);
            ensureDirectoryExists(uploadPath);
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const uniqueFilename = generateUniqueFilename(file.originalname);
            cb(null, uniqueFilename);
        }
    });
};

// --- Create Multer Upload Middleware ---
export const createUpload = (folder: UploadFolder = UploadFolder.GENERAL) => {
    return multer({
        storage: createStorage(folder),
        fileFilter: fileFilter,
        limits: {
            fileSize: MAX_FILE_SIZE,
            files: 10 // Max 10 files per request
        }
    });
};

// --- Image Compression ---
export const compressImage = async (
    inputPath: string,
    outputPath?: string,
    quality: number = COMPRESSION_QUALITY
): Promise<string> => {
    const targetPath = outputPath || inputPath;
    const tempPath = inputPath + '.compressed.tmp';

    try {
        await sharp(inputPath)
            .rotate() // Auto-rotate based on EXIF
            .jpeg({ quality, mozjpeg: true })
            .toFile(tempPath);

        // Safely replace: copy temp over original, then delete temp
        // This avoids the race condition where unlinkSync(inputPath) succeeds
        // but renameSync fails (common on Windows/OneDrive), leaving no file
        try {
            if (fs.existsSync(inputPath)) {
                fs.unlinkSync(inputPath);
            }
        } catch (e) {
            // If we can't delete original, that's ok - just overwrite via copy
        }
        fs.copyFileSync(tempPath, targetPath);
        fs.unlinkSync(tempPath);

        return targetPath;
    } catch (error) {
        // Cleanup temp file if exists
        if (fs.existsSync(tempPath)) {
            try { fs.unlinkSync(tempPath); } catch { }
        }
        // If compression failed, the original file should still be intact
        console.warn(`Image compression failed for ${inputPath}, using original:`, error);
        return inputPath;
    }
};

// --- Generate Thumbnail ---
export const generateThumbnail = async (
    imagePath: string,
    folder: UploadFolder,
    size: number = THUMBNAIL_SIZE
): Promise<string> => {
    const filename = path.basename(imagePath);
    const thumbnailDir = path.join(BASE_UPLOAD_PATH, folder, 'thumbnails');
    ensureDirectoryExists(thumbnailDir);

    const thumbnailPath = path.join(thumbnailDir, `thumb_${filename}`);

    await sharp(imagePath)
        .resize(size, size, {
            fit: 'cover',
            position: 'center'
        })
        .jpeg({ quality: 70 })
        .toFile(thumbnailPath);

    return thumbnailPath;
};

// --- Process Uploaded Images (Compress + Thumbnail) ---
export const processUploadedImages = async (
    files: Express.Multer.File[],
    folder: UploadFolder
): Promise<{ original: string; thumbnail: string }[]> => {
    const results: { original: string; thumbnail: string }[] = [];

    for (const file of files) {
        try {
            // Compress original
            await compressImage(file.path);

            // Generate thumbnail
            const thumbnailPath = await generateThumbnail(file.path, folder);

            // Get relative paths for storage
            const relativePath = `/${folder}/${file.filename}`;
            const relativeThumbnail = `/${folder}/thumbnails/thumb_${file.filename}`;

            results.push({
                original: relativePath,
                thumbnail: relativeThumbnail
            });
        } catch (error) {
            console.error(`Error processing file ${file.filename}:`, error);
            // Continue with other files
        }
    }

    return results;
};

// --- Delete File ---
export const deleteFile = async (relativePath: string): Promise<boolean> => {
    try {
        const fullPath = path.join(BASE_UPLOAD_PATH, relativePath.replace(/^\/uploads\//, ''));

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);

            // Also try to delete thumbnail
            const dir = path.dirname(fullPath);
            const filename = path.basename(fullPath);
            const thumbnailPath = path.join(dir, 'thumbnails', `thumb_${filename}`);

            if (fs.existsSync(thumbnailPath)) {
                fs.unlinkSync(thumbnailPath);
            }

            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};

// --- Delete Multiple Files ---
export const deleteFiles = async (relativePaths: string[]): Promise<number> => {
    let deletedCount = 0;
    for (const path of relativePaths) {
        if (await deleteFile(path)) {
            deletedCount++;
        }
    }
    return deletedCount;
};

// --- Cleanup Orphaned Files ---
export const cleanupOrphanedFiles = async (
    folder: UploadFolder,
    activeFilePaths: string[]
): Promise<string[]> => {
    const uploadDir = path.join(BASE_UPLOAD_PATH, folder);
    const deletedFiles: string[] = [];

    try {
        const files = fs.readdirSync(uploadDir);

        for (const file of files) {
            // Skip thumbnails directory
            if (file === 'thumbnails') continue;

            const relativePath = `/${folder}/${file}`;

            // Check if file is in active list
            if (!activeFilePaths.includes(relativePath) &&
                !activeFilePaths.includes(`/uploads${relativePath}`)) {
                const fullPath = path.join(uploadDir, file);

                // Check if file (not directory)
                if (fs.statSync(fullPath).isFile()) {
                    fs.unlinkSync(fullPath);

                    // Also delete thumbnail
                    const thumbnailPath = path.join(uploadDir, 'thumbnails', `thumb_${file}`);
                    if (fs.existsSync(thumbnailPath)) {
                        fs.unlinkSync(thumbnailPath);
                    }

                    deletedFiles.push(relativePath);
                }
            }
        }
    } catch (error) {
        console.error('Error during cleanup:', error);
    }

    return deletedFiles;
};

// --- Get File Stats ---
export const getFileStats = (relativePath: string): fs.Stats | null => {
    try {
        const fullPath = path.join(BASE_UPLOAD_PATH, relativePath.replace(/^\/uploads\//, ''));
        if (fs.existsSync(fullPath)) {
            return fs.statSync(fullPath);
        }
        return null;
    } catch {
        return null;
    }
};

// --- Default Upload Instances ---
export const menuUpload = createUpload(UploadFolder.MENU_ITEMS);
export const addonUpload = createUpload(UploadFolder.ADDONS);
export const userUpload = createUpload(UploadFolder.USERS);
export const generalUpload = createUpload(UploadFolder.GENERAL);

console.log('📁 File Upload Utility initialized');
console.log(`   Base Path: ${BASE_UPLOAD_PATH}`);
console.log(`   Max Size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
console.log(`   Allowed Types: ${ALLOWED_EXTENSIONS.join(', ')}`);
