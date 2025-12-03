const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const { promisify } = require('util');
const pipeline = promisify(stream.pipeline);

class GoogleDriveConnector {
    constructor(config) {
        this.auth = new google.auth.GoogleAuth({
            keyFile: config.keyFilePath,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        this.drive = google.drive({ version: 'v3', auth: this.auth });
        this.downloadDir = config.downloadDir || './downloads';

        if (!fs.existsSync(this.downloadDir)) {
            fs.mkdirSync(this.downloadDir, { recursive: true });
        }
    }

    async process(folderId) {
        console.log(`[DriveConnector] Starting ingestion for folder: ${folderId}`);
        const files = await this.listFolderRecursively(folderId);
        console.log(`[DriveConnector] Found ${files.length} files. Starting download...`);

        const documents = [];
        for (const file of files) {
            try {
                const localPath = await this.downloadFile(file);
                if (localPath) {
                    documents.push({
                        id: file.id,
                        name: file.name,
                        mimeType: file.mimeType,
                        path: localPath,
                        source: 'google_drive',
                        metadata: {
                            webViewLink: file.webViewLink,
                            createdTime: file.createdTime,
                            modifiedTime: file.modifiedTime,
                        }
                    });
                }
            } catch (err) {
                console.error(`[DriveConnector] Failed to download ${file.name} (${file.id}):`, err.message);
            }
        }
        return documents;
    }

    async listFolderRecursively(folderId, parentPath = '') {
        let allFiles = [];
        let pageToken = null;

        do {
            const res = await this.drive.files.list({
                q: `'${folderId}' in parents and trashed = false`,
                fields: 'nextPageToken, files(id, name, mimeType, webViewLink, createdTime, modifiedTime)',
                pageToken: pageToken,
            });

            const files = res.data.files;
            pageToken = res.data.nextPageToken;

            for (const file of files) {
                if (file.mimeType === 'application/vnd.google-apps.folder') {
                    const subFiles = await this.listFolderRecursively(file.id, path.join(parentPath, file.name));
                    allFiles = allFiles.concat(subFiles);
                } else {
                    file.relativePath = path.join(parentPath, file.name);
                    allFiles.push(file);
                }
            }
        } while (pageToken);

        return allFiles;
    }

    async downloadFile(file) {
        const destPath = path.join(this.downloadDir, file.id + '_' + this.sanitizeFileName(file.name));

        // Handle Google Docs Editors files (Export)
        if (file.mimeType.startsWith('application/vnd.google-apps.')) {
            return this.exportGoogleDoc(file, destPath);
        }

        // Handle Binary files (Download)
        return this.downloadBinaryFile(file, destPath);
    }

    async exportGoogleDoc(file, destPath) {
        let mimeType;
        let ext;

        if (file.mimeType === 'application/vnd.google-apps.document') {
            mimeType = 'text/plain';
            ext = '.txt';
        } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
            mimeType = 'text/csv';
            ext = '.csv';
        } else if (file.mimeType === 'application/vnd.google-apps.presentation') {
            mimeType = 'text/plain'; // Extract text directly if possible, or PDF
            ext = '.txt';
        } else {
            console.log(`[DriveConnector] Skipping unsupported Google App file: ${file.name} (${file.mimeType})`);
            return null;
        }

        const finalPath = destPath + ext;
        console.log(`[DriveConnector] Exporting ${file.name} to ${finalPath}...`);

        const res = await this.drive.files.export({
            fileId: file.id,
            mimeType: mimeType,
        }, { responseType: 'stream' });

        await pipeline(res.data, fs.createWriteStream(finalPath));
        return finalPath;
    }

    async downloadBinaryFile(file, destPath) {
        console.log(`[DriveConnector] Downloading ${file.name}...`);
        const res = await this.drive.files.get({
            fileId: file.id,
            alt: 'media',
        }, { responseType: 'stream' });

        await pipeline(res.data, fs.createWriteStream(destPath));
        return destPath;
    }

    sanitizeFileName(name) {
        return name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    }
}

module.exports = GoogleDriveConnector;
