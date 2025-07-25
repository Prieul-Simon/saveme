import { auth, drive } from '@googleapis/drive'
import { createReadStream, readFile as fsrf } from 'fs'
import { readFile } from 'fs/promises'
import { assertDefined } from './env'
import { createInterface } from 'readline/promises'
import { writeFile } from 'fs/promises'
import { basename } from 'path'

type OAuth2Client = InstanceType<typeof auth.OAuth2>
type Credentials = Awaited<ReturnType<OAuth2Client['refreshToken']>>['tokens']

const DRIVE_SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
]
const MIME_TYPE = 'application/pgp-encrypted'

export async function uploadFile(filePath: string): Promise<[string, unknown]> {
    const oauth2Client = await authorize()
    const res = await uploadWithClient(filePath, oauth2Client)
    return [`${res.status}: ${res.statusText}`, res.data]
    
}

async function authorize(): Promise<OAuth2Client> {
    const oauth2Client = new auth.OAuth2({
        client_id: assertDefined(import.meta.env.DRIVE_CLIENT_ID),
        client_secret: assertDefined(import.meta.env.DRIVE_CLIENT_SECRET),
        redirectUri: assertDefined(import.meta.env.DRIVE_REDIRECT_URI),
    })

    // Check if we have previously stored a token.
    const tokenPath = assertDefined(import.meta.env.OAUTH_TOKEN_PATH)
    let token: string | Credentials
    try {
        token = await readFile(tokenPath, {
            encoding: 'utf-8'
        })
    } catch (err) {
        token = await fetchAccessToken(oauth2Client, tokenPath)
    }
    oauth2Client.setCredentials(typeof token === 'string' ? JSON.parse(token) : token)
    return oauth2Client
    
}

async function fetchAccessToken(oauth2Client: OAuth2Client, tokenPath: string): Promise<Credentials> {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: DRIVE_SCOPES,
    })
    const readlineInterface = createInterface({
        input: process.stdin,
        output: process.stdout,
    })
    const authorizationCode = await readlineInterface.question(`Go to ${authUrl} and enter the authorization code here: `)
    readlineInterface.close()
    const { tokens: credentials } = await oauth2Client.getToken(authorizationCode)

    // Store the token to disk for later program executions
    await writeFile(tokenPath, JSON.stringify(credentials, undefined, 4))

    return credentials
}

async function uploadWithClient(filePath: string, oauth2Client: OAuth2Client) {
    const client = drive({
        version: 'v3',
        auth: oauth2Client,
    })

    const name = basename(filePath)
    const folderId = assertDefined(import.meta.env.DRIVE_FOLDER_ID)
    return await client.files.create({
        requestBody: {
            name,
            mimeType: MIME_TYPE,
            parents: [folderId]
        },
        media: {
            mimeType: MIME_TYPE,
            body: createReadStream(filePath),
        },
    })
}