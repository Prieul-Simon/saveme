import { createArchive, encryptArchive } from './src/archive'
import { uploadFile } from './src/googledrive'

console.info('Creating archive...')
const {name: archiveName} = await createArchive()
console.info('Archive created\n')

console.info('Encryption of archive...')
const result = await encryptArchive(archiveName)
const filePath = `${import.meta .env.ARCHIVE_DEST}${result.name}`
console.info('Archive encrypted: %s\n', filePath)

console.info('Uploading archive...')
const res = await uploadFile(filePath)
console.info("Archive uploaded with response: %s\n%o", res[0], res[1]);
