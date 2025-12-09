const CLIENT_ID = '764906794528-4p5u1fblsq5rl9glopu25mojgmnjv3jm.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDgHxQ_your_api_key_here'; // You'll need to create this
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

let tokenClient;
let gapiInited = false;
let gisInited = false;
let accessToken = null;

function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
    });
    gapiInited = true;
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '',
    });
    gisInited = true;
}

function handleAuthClick(callback) {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        accessToken = gapi.client.getToken().access_token;
        callback();
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
}

async function backupToDrive() {
    if (!gapiInited || !gisInited) {
        alert('Google Drive is still loading. Please try again in a moment.');
        return;
    }

    handleAuthClick(async () => {
        try {
            const data = {
                expenses: expenses,
                timestamp: new Date().toISOString()
            };

            const fileContent = JSON.stringify(data, null, 2);
            const file = new Blob([fileContent], {type: 'application/json'});
            const metadata = {
                name: 'budget-backup.json',
                mimeType: 'application/json'
            };

            // Check if file exists
            const existingFiles = await gapi.client.drive.files.list({
                q: "name='budget-backup.json' and trashed=false",
                fields: 'files(id, name)'
            });

            let fileId = null;
            if (existingFiles.result.files.length > 0) {
                fileId = existingFiles.result.files[0].id;
            }

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
            form.append('file', file);

            const url = fileId 
                ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
                : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

            const response = await fetch(url, {
                method: fileId ? 'PATCH' : 'POST',
                headers: new Headers({'Authorization': 'Bearer ' + accessToken}),
                body: form
            });

            if (response.ok) {
                const lastBackup = new Date().toLocaleString();
                localStorage.setItem('lastDriveBackup', lastBackup);
                updateDriveStatus();
                alert('✅ Backup successful!');
            } else {
                throw new Error('Backup failed');
            }
        } catch (error) {
            console.error('Backup error:', error);
            alert('❌ Backup failed. Please try again.');
        }
    });
}

async function restoreFromDrive() {
    if (!gapiInited || !gisInited) {
        alert('Google Drive is still loading. Please try again in a moment.');
        return;
    }

    handleAuthClick(async () => {
        try {
            const response = await gapi.client.drive.files.list({
                q: "name='budget-backup.json' and trashed=false",
                fields: 'files(id, name)',
                orderBy: 'modifiedTime desc'
            });

            if (response.result.files.length === 0) {
                alert('No backup found on Google Drive.');
                return;
            }

            const fileId = response.result.files[0].id;
            const file = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });

            const data = JSON.parse(file.body);
            
            if (confirm(`Restore backup from ${new Date(data.timestamp).toLocaleString()}?\n\nThis will replace your current data.`)) {
                expenses = data.expenses;
                saveExpenses();
                populateYears();
                updateUI();
                alert('✅ Restore successful!');
            }
        } catch (error) {
            console.error('Restore error:', error);
            alert('❌ Restore failed. Please try again.');
        }
    });
}

function updateDriveStatus() {
    const lastBackup = localStorage.getItem('lastDriveBackup');
    const statusDiv = document.getElementById('driveStatus');
    if (lastBackup && statusDiv) {
        statusDiv.textContent = `Last backup: ${lastBackup}`;
    }
}

// Initialize when page loads
window.addEventListener('load', () => {
    if (typeof gapi !== 'undefined') {
        gapiLoaded();
    }
    if (typeof google !== 'undefined') {
        gisLoaded();
    }
    updateDriveStatus();
});
