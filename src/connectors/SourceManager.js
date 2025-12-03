const GoogleDriveConnector = require('./GoogleDriveConnector');
const LocalDirectoryConnector = require('./LocalDirectoryConnector');

class SourceManager {
    static getConnector(type, config) {
        switch (type) {
            case 'google_drive':
                return new GoogleDriveConnector(config);
            case 'local_directory':
                return new LocalDirectoryConnector(config);
            case 'read_ai':
                // For now, Read.ai ingestion is handled via Google Drive sync.
                // So we return the Drive connector but maybe with specific config if needed.
                console.log('[SourceManager] Initializing Read.ai Connector (via Google Drive Sync strategy)...');
                return new GoogleDriveConnector(config);
            default:
                throw new Error(`Unknown source type: ${type}`);
        }
    }
}

module.exports = SourceManager;
