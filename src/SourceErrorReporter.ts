import {Logger} from '#src/Logger'
import {Token} from '#src/Token'
import chalk from 'chalk'

export class SourceErrorReporter {
	private readonly CONTEXT_LINES = 1
	private readonly lines: string[]
	private readonly SPACING = '  '
	private readonly MARKER = '> '

	constructor(readonly logger: Logger, readonly sourceCode: string) {
		// FIXME: Scanner.scanText should return sourceCode.lines
		this.lines = this.sourceCode.split('\n')
	}
	report(titleMsg: string, lineMsg: string, token: Token) {
		const decoratedSource = this.decorateSource(token, lineMsg)

		this.logger.error(`${titleMsg}\n${decoratedSource}`)
	}

	private decorateSource(token: Token, lineMsg: string) {
		const offendingLine = token.line - 1
		let msg = ''

		for (let i = offendingLine - this.CONTEXT_LINES; i < offendingLine; i++) {
			msg += this.decorateContextLine(i)
		}
		msg += this.decorateOffendingLine(offendingLine, token, lineMsg)
		for (let i = offendingLine + 1; i <= offendingLine + this.CONTEXT_LINES; i++) {
			msg += this.decorateContextLine(i)
		}

		return `\n${msg}`
	}

	private decorateOffendingLine(num: number, token: Token, lineMsg: string): string {
		const offendingLine = this.separator(num) + this.lines[num]
		// FIXME: when token.column is 0, we're doing ' '.repeat(-1)
		let errorDecoration =
			this.separator('nonumber') + ' '.repeat(token.column - 1) + chalk.bold.red('~').repeat(token.lexeme.length)

		return (
			this.MARKER + offendingLine + '\n' + this.SPACING + errorDecoration + ' ' + chalk.bold.red(lineMsg) + '\n'
		)
	}

	private decorateContextLine(num: number): string {
		if (this.lines[num] !== undefined) {
			return this.SPACING + this.separator(num) + this.lines[num] + '\n'
		} else {
			return ''
		}
	}

	private separator(num: number | 'nonumber') {
		const sep = num === 'nonumber' ? ' ' : num + 1
		return chalk.gray(sep) + '  │ '
	}
}
