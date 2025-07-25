export function assertDefined(env: string | undefined): string {
    if (env === undefined) throw new Error('this env var is undefined')
    return env
}