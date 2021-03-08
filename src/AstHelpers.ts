import * as Ast from '#src/Ast'
import {TokenType} from '#src/Token'

type UnaryMatcherCallback<T> = {
	bang(node: Ast.Expr.Unary): T
	minus(node: Ast.Expr.Unary): T
}

export function unaryMatcher<T>(node: Ast.Expr.Unary, callback: UnaryMatcherCallback<T>) {
	switch (node.operator.type) {
		case TokenType.Bang:
			return callback.bang(node)
		case TokenType.Minus:
			return callback.minus(node)
		default:
			throw new Error(`[ast-helpers/unaryMatcher] Can't match on type ${node.operator.type}`)
	}
}

type BinaryMatcherCallback<T> = {
	or(node: Ast.Expr.Binary): T
	and(node: Ast.Expr.Binary): T
	bangEqual(node: Ast.Expr.Binary): T
	equalEqual(node: Ast.Expr.Binary): T
	greater(node: Ast.Expr.Binary): T
	greaterEqual(node: Ast.Expr.Binary): T
	less(node: Ast.Expr.Binary): T
	lessEqual(node: Ast.Expr.Binary): T
	minus(node: Ast.Expr.Binary): T
	plus(node: Ast.Expr.Binary): T
	slash(node: Ast.Expr.Binary): T
	star(node: Ast.Expr.Binary): T
}

export function binaryMatcher<T>(node: Ast.Expr.Binary, callback: BinaryMatcherCallback<T>) {
	switch (node.operator.type) {
		case TokenType.Or:
			return callback.or(node)
		case TokenType.And:
			return callback.and(node)
		case TokenType.BangEqual:
			return callback.bangEqual(node)
		case TokenType.EqualEqual:
			return callback.equalEqual(node)
		case TokenType.Greater:
			return callback.greater(node)
		case TokenType.GreaterEqual:
			return callback.greaterEqual(node)
		case TokenType.Less:
			return callback.less(node)
		case TokenType.LessEqual:
			return callback.lessEqual(node)
		case TokenType.Minus:
			return callback.minus(node)
		case TokenType.Plus:
			return callback.plus(node)
		case TokenType.Slash:
			return callback.slash(node)
		case TokenType.Star:
			return callback.star(node)
		default:
			throw new Error(`[ast-helpers/binaryMatcher] Can't match on type ${node.operator.type}`)
	}
}
