export function currentDateTimeReadableString(): string {
    const now = new Date()

    const year = now.getFullYear()
    const month = twoDigits(now.getMonth() + 1) // thank you JavaScript (no !)
    const day = twoDigits(now.getDate())
    const hours = twoDigits(now.getHours())
    const minutes = twoDigits(now.getMinutes())
    const seconds = twoDigits(now.getSeconds())
    const milliseconds = threeDigits(now.getMilliseconds())
    return `${year}-${month}-${day}--${hours}-${minutes}-${seconds}-${milliseconds}`
}

function twoDigits(input: number): string {
    return input.toString(10).padStart(2, '0')
}

function threeDigits(input: number): string {
    return input.toString(10).padStart(3, '0')
}