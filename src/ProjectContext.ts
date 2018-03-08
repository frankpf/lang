import {Logger} from '#src/Logger'
import {SourceErrorReporter} from '#src/SourceErrorReporter'

export interface ProjectContext {
    sourceCode: string
    logLevel: Logger.Level,
    includeStacktrace: boolean,
    logger: Logger,
    sourceErrorReporter: SourceErrorReporter,
}
export const mkProjectContext = (
    logLevel: Logger.Level,
    includeStacktrace: boolean,
    sourceCode: string
): ProjectContext => {
    const logger = new Logger(logLevel, includeStacktrace)
    const sourceErrorReporter = new SourceErrorReporter(logger, sourceCode)

    return {
        logLevel,
        includeStacktrace,
        logger,
        sourceCode,
        sourceErrorReporter,
    }
}