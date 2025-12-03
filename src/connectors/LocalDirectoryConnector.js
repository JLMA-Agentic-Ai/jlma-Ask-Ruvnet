const fs = require('fs');
const path = require('path');

class LocalDirectoryConnector {
    constructor(config) {
        this.directory = config.directory;
        if (!fs.existsSync(this.directory)) {
            console.log(`[LocalConnector] Directory not found, creating: ${this.directory}`);
            fs.mkdirSync(this.directory, { recursive: true });
        }
    }

    async process(sourceId) {
        // sourceId in this context is just the directory path again, or ignored
        console.log(`[LocalConnector] Scanning directory: ${this.directory}`);

        const files = this.listFolderRecursively(this.directory);
        console.log(`[LocalConnector] Found ${files.length} files.`);

        const documents = [];
        for (const file of files) {
            documents.push({
                id: file.name, // Use filename as ID for local files
                name: file.name,
                mimeType: this.getMimeType(file.name),
                path: file.path,
                source: 'local_directory',
                metadata: {
                    createdTime: fs.statSync(file.path).birthtime,
                    modifiedTime: fs.statSync(file.path).mtime,
                }
            });
        }
        return documents;
    }

    listFolderRecursively(dir, fileList = []) {
        const files = fs.readdirSync(dir);

        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                this.listFolderRecursively(filePath, fileList);
            } else {
                if (!file.startsWith('.')) { // Ignore hidden files like .DS_Store
                    fileList.push({
                        name: file,
                        path: filePath
                    });
                }
            }
        });

        return fileList;
    }

    getMimeType(filename) {
        const ext = path.extname(filename).toLowerCase();
        const map = {
            '.txt': 'text/plain',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.csv': 'text/csv',
            '.mp4': 'video/mp4',
            '.mp3': 'audio/mpeg'
        };
        return map[ext] || 'application/octet-stream';
    }
}

module.exports = LocalDirectoryConnector;
