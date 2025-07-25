import { currentDateTimeReadableString } from "./datetime"
import { exists, mkdir } from 'fs/promises'
import { assertDefined } from "./env"

export async function createArchive(): Promise<{ name: string }> {
    const outPath = assertDefined(import.meta.env.ARCHIVE_DEST)
    await createDirIfItDoesNotExist(outPath)

    const dtStr = currentDateTimeReadableString()
    const outName = `${assertDefined(import.meta.env.ARCHIVE_NAME_PREFIX)}${dtStr}.tar.gz`
    const cmds = [
        'tar',
        'czf',
        `${outPath}${outName}`,
        '--verbose',
        `--directory=./`,
        assertDefined(import.meta.env.ARCHIVE_INPUT_DIR),
    ]
    console.info('Will spawn cmds: %o', cmds)
    const proc = Bun.spawn(cmds, {
        cwd: assertDefined(import.meta.env.ARCHIVE_INPUT_PARENT_DIR),
        stdout: 'inherit',
        onExit: (_, exitCode) => console.info('tar subprocess exited with code %d', exitCode)
    })
    await proc.exited

    return {
        name: outName,
    }
}

export async function encryptArchive(name: string): Promise<{ name: string }> {
    const cmds = [
        'gpg',
        '--verbose',
        '--batch',
        '--passphrase-file',
        assertDefined(import.meta.env.ENCRYPT_PASS_FILE),
        '--symmetric',
        name,
    ]
    console.info('Will spawn cmds: %o', cmds)
    const gpgProc = Bun.spawn(cmds, {
        cwd: assertDefined(import.meta.env.ARCHIVE_DEST),
        stderr: 'inherit',
        onExit: (_, exitCode) => console.info('gpg subprocess exited with code %d', exitCode)
    })
    await gpgProc.exited

    return {
        name: `${name}.gpg`,
    }
}

async function createDirIfItDoesNotExist(path: string): Promise<void> {
    if (!(await exists(path))) {
        await mkdir(path, { recursive: true })
    }
}
