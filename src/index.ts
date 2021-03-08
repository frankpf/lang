require('require-rewrite')(__dirname)
import 'source-map-support/register'

import * as fs from 'fs'

import {HAS_ERROR} from '#src/Error'
import {Scanner} from '#src/Scanner'
import {Parser} from '#src/Parser'
import * as Ast from '#src/Ast'
import {typecheck} from '#src/TypeChecker'
import {Logger} from '#src/Logger'
import {mkProjectContext} from '#src/ProjectContext'

const VALID_MODES = ['--stdin', '--file' /*, '--replCompiler'*/]

const LOG_LEVEL = Logger.Level.fromEnvVar(process.env.LOG_LEVEL) ?? Logger.Level.Debug
const INCLUDE_STACKTRACE = process.env.INCLUDE_STACKTRACE === '1'

export async function main(args: string[]) {
	const mode = args[0]

	if (!VALID_MODES.includes(mode)) {
		console.log(`Invalid mode. Please specify one of ${VALID_MODES}`)
		process.exit(1)
	}

	//if (mode === '--replCompiler') {
	//	await startReplCompiler()
	//	return
	//}

	let fileContent: string
	if (mode === '--stdin') {
		fileContent = await readStdin()
	} else {
		const filename = args[1]
		if (!filename) {
			console.log('Please specify <filename>')
			process.exit(1)
		}
		fileContent = fs.readFileSync(filename, 'utf8')
	}

	const projectContext = mkProjectContext(LOG_LEVEL, INCLUDE_STACKTRACE, fileContent)
	const tokens = Scanner.scanText(fileContent)
	const ast = Parser.parseTokens(projectContext, tokens)
	if (HAS_ERROR || ast === null) {
		process.exit(1)
	}
	const nonNullStatements = ast.filter((s): s is Ast.Stmt => s !== null)

	typecheck(projectContext, nonNullStatements)

	//const cCode = fromAst(nonNullStatements, { source: fileContent })
	//process.stdout.write(cCode)
}

function readStdin(): Promise<string> {
	return new Promise(resolve => {
		let finalString = ''
		process.stdin.on('data', (data: Buffer) => {
			const text = data.toString('utf8')
			finalString += text
		})

		process.stdin.on('close', () => {
			resolve(finalString)
		})
	})
}

main(process.argv.slice(2))
