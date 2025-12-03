const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const KEY_FILE_PATH = path.join(__dirname, 'service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
});

async function findFolder() {
    try {
        const drive = google.drive({ version: 'v3', auth });
        const folderName = 'Ruv Coaching'; // The name user specified

        console.log(`Searching for folder named: "${folderName}"...`);

        const res = await drive.files.list({
            q: `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`,
            fields: 'files(id, name, parents)',
        });

        const folders = res.data.files;

        if (folders.length === 0) {
            console.log('No folder found with that name.');
            console.log('IMPORTANT: Please ensure you have created the folder "Ruv Coaching" in Google Drive AND shared it with the service account:');
            console.log('answerbot@ruvectorchatbot.iam.gserviceaccount.com');
        } else {
            console.log('Found folder(s):');
            folders.forEach(f => {
                console.log(`- Name: ${f.name} | ID: ${f.id}`);
            });

            // If exactly one is found, we could suggest updating the .env automatically, 
            // but for now let's just show it.
        }

    } catch (error) {
        console.error('Error searching Drive:', error.message);
    }
}

findFolder();
