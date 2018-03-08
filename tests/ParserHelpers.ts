// @ts-nocheck
import {TokenType, Token} from '#src/Token'
import {Scanner} from '#src/Scanner'
import * as Ast from '#src/Ast'
import {Parser} from '#src/Parser'
import { TcType } from '#src/TypeChecker'

export const parse = (text: string) => Parser.parseTokens(Scanner.scanText(text))

export function ident(name: string, line: number) {
	return new Token(TokenType.Identifier, name, null, line)
}

export function litExpr(value: number | string | boolean | null, line: number) {
	let type: TokenType | undefined = undefined
	if (typeof value === 'number') {
		if (Number.isInteger(value)) {
			type = TokenType.IntegerLit
		} else {
			type = TokenType.DoubleLit
		}
	} else if (typeof value === 'string') {
		type = TokenType.StringLit
	} else if (typeof value === 'boolean' && value) {
		type = TokenType.True
	} else if (typeof value === 'boolean' && !value) {
		type = TokenType.False
	} else if (value === null) {
		type = TokenType.Nil
	}

	if (type === undefined) {
		throw new Error(`Couldnt match value=${value} (type=${typeof value})`)
	}

	const lexeme = type === TokenType.StringLit
		? `"${value}"`
		: value?.toString() || "nil"

	const literal = type === TokenType.True || type === TokenType.False
			? null
			: value

	const tcType: TcType | Error =
		type === TokenType.StringLit ? TcType.String
		: type === TokenType.IntegerLit ? TcType.Integer
		: type === TokenType.DoubleLit ? TcType.Double
		: type === TokenType.Nil ? TcType.Nil
		: type === TokenType.True ? TcType.Boolean
		: type === TokenType.False ? TcType.Boolean
		: new Error(`TcType not found for TokenType ${type}`)

	if (tcType instanceof Error) {
		throw tcType
	}

	return new Ast.Expr.Literal(value, new Token(type, lexeme, literal, line), tcType)
}
