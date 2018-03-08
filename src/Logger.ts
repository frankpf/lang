import chalk from 'chalk'
import path from 'path'

type LoggerMethod = (...items: any[]) => void

export class Logger {
    constructor(readonly level: Logger.Level, readonly includeStacktrace: boolean) {}

    error = this.loggerMethod(Logger.Level.Error, 'stdout')
    info = this.loggerMethod(Logger.Level.Info, 'stdout')
    debug = this.loggerMethod(Logger.Level.Debug, 'stderr')

    private loggerMethod(level: Logger.Level, outputStream: 'stdout' | 'stderr'): LoggerMethod {
        return (...items) => {
            if (this.level >= level) {
                if (outputStream === 'stdout') {
                    console.log(`[${this.formatLevel(level)}]`, ...items)
                } else {
                    console.error(`[${this.formatLevel(level)}]`, ...items)
                }
            }
            if (this.includeStacktrace) {
                const stacktrace = new Error().stack
                if (stacktrace !== undefined) {
                    console.log(prettifyStacktrace(stacktrace))
                }
            }
        }
    }

    private formatLevel(level: Logger.Level) {
        if (level === Logger.Level.Error) { return chalk.red('error') }
        if (level === Logger.Level.Info) { return chalk.green('info') }
        if (level === Logger.Level.Debug) { return chalk.blue('debug') }
        const _exhaustiveCheck: never = level
        throw new Error(`Can't convert unknown level ${level} to string`)
    }
}

export namespace Logger {
    export enum Level {
        // Be careful when changing order
        Error,
        Info,
        Debug,
    }

    export namespace Level {
        export function fromEnvVar(envVar?: string) {
            if (envVar === undefined) {
                return undefined
            }

            switch(envVar) {
                case 'debug':
                    return Logger.Level.Debug
                case 'info':
                    return Logger.Level.Info
                case 'error':
                    return Logger.Level.Error
                default:
                    throw new Error(`Invalid log level ${envVar}`)
            }
        }
    }
}


function prettifyStacktrace(stacktrace: string): string {
    const lines = stacktrace.split('\n').slice(1)
    let lastLine = lines.length
    for (let i = 0; i < lines.length; i++) {
        const {item, file, line, column} = parseStacktraceLine(lines[i])
        lines[i] = chalk.blue(file) + ':' + chalk.green(line) + ':' + chalk.green(column)
        if (item !== undefined) {
            lines[i] = chalk.yellow(item) + ` in ` + lines[i]
        }
        lines[i] = '\t\t' + lines[i]
        if (lines[i].includes('.js') || lines[i].includes('Generator.next')) {
            lastLine = i-1
            break
        }
    }
    return lines.slice(0, lastLine + 1).join('\n')
}

type ParsedStacktraceLine = {
    item?: string
    file: string
    line: number
    column: number
}
function parseStacktraceLine(stacktraceLine: string): ParsedStacktraceLine {
    let trimmedLine = stacktraceLine.trim().slice(3)
    trimmedLine = trimmedLine.slice(0, trimmedLine.length - 1)
    let result: Pick<ParsedStacktraceLine, 'item' | 'file'>
    if (trimmedLine.includes('(')) {
        let [item, file] = trimmedLine.split(' (')
        file = file.slice(0, file.indexOf(':'))
        result = { item, file }
    } else {
        result = { file: trimmedLine.slice(0, trimmedLine.indexOf(':')) }
    }


    result.file = path.relative(process.cwd(), result.file)

    const lineInfoStart = trimmedLine.indexOf(':') + 1
    const [line, column] = trimmedLine.slice(lineInfoStart).split(':')

    return { ...result, line: Number(line), column: Number(column) }
}