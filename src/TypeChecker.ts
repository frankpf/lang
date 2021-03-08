import * as Ast from '#src/Ast'
import {binaryMatcher, unaryMatcher} from '#src/AstHelpers'
import {matchAll} from '#src/Match'
import {Token} from '#src/Token'
import {SourceErrorReporter} from '#src/SourceErrorReporter'
import {ProjectContext} from '#src/ProjectContext'

type Environment = Map<string, TcType>

function createEnvironment(): Environment {
	return new Map()
}

export enum TcType {
	Integer = 'Integer',
	Double = 'Double',
	Boolean = 'Boolean',
	String = 'String',
	Nil = 'Nil',
	Void = 'Void',

	// Special types
	Error = 'Error',
	NoType = 'NoType',
}

export namespace TcType {
	export function fromToken(token: Token): TcType {
		switch (token.lexeme) {
			case 'Integer':
				return TcType.Integer
			case 'Double':
				return TcType.Double
			case 'Boolean':
				return TcType.Boolean
			case 'String':
				return TcType.String
			case 'Nil':
				return TcType.Nil
			case 'Void':
				return TcType.Void
			default:
				throw new Error(`Unknown type ${token.lexeme}`)
		}
	}
}

interface TypecheckResult {
	tcType: TcType
	typechecks: boolean
}
const UNIMPLEMENTED_RESULT: TypecheckResult = {
	tcType: TcType.Error,
	typechecks: true,
}

type MkTypecheckResultOpts = {expectedType: TcType; msg?: string; token: Token}
const mkTypecheckResult = (
	ctx: ProjectContext,
	tcType: TcType,
	typechecks: boolean,
	{expectedType, msg, token}: MkTypecheckResultOpts,
) => {
	const result = {tcType, typechecks}
	const {logger, sourceErrorReporter: reporter} = ctx

	logger.debug(`Making typecheck result with tcType=${tcType} and typechecks=${typechecks}`)
	if (tcType !== TcType.Error && tcType !== TcType.NoType && !typechecks) {
		reporter.report(`mismatched types`, msg || `Expected type ${expectedType} but got ${tcType}`, token)
	}

	if (!typechecks) {
		return {...result, tcType: TcType.Error}
	}
	return result
}

function typecheckExpr(ctx: ProjectContext, env: Environment, node: Ast.Expr, expectedType: TcType): TypecheckResult {
	const {logger, sourceErrorReporter: reporter} = ctx
	logger.debug(node)
	logger.debug(`Typechecking expr ${node._tag} [expectedType=${expectedType}]`)
	const exprMatcher = matchAll<Ast.Expr, TypecheckResult>({
		Literal(node) {
			return mkTypecheckResult(ctx, node.tcType, node.tcType === expectedType, {
				expectedType,
				token: node.startToken,
			})
		},
		Unary(node) {
			const [expectedType, resultType] = unaryMatcher<[TcType, TcType]>(node, {
				bang: _ => [TcType.Boolean, TcType.Boolean],
				minus: _ => [TcType.Integer, TcType.Integer],
			})

			const {typechecks} = typecheckExpr(ctx, env, node.right, expectedType)
			return mkTypecheckResult(ctx, resultType, typechecks, {expectedType, token: node.startToken})
		},
		Binary(node) {
			let [leftType, rightType, resultType] = binaryMatcher<[TcType, TcType, TcType]>(node, {
				or: _ => [TcType.Boolean, TcType.Boolean, TcType.Boolean],
				and: _ => [TcType.Boolean, TcType.Boolean, TcType.Boolean],
				bangEqual: _ => [TcType.Boolean, TcType.Boolean, TcType.Boolean],
				equalEqual: _ => [TcType.Boolean, TcType.Boolean, TcType.Boolean],
				greater: _ => [TcType.Integer, TcType.Integer, TcType.Boolean],
				greaterEqual: _ => [TcType.Integer, TcType.Integer, TcType.Boolean],
				less: _ => [TcType.Integer, TcType.Integer, TcType.Boolean],
				lessEqual: _ => [TcType.Integer, TcType.Integer, TcType.Boolean],
				minus: _ => [TcType.Integer, TcType.Integer, TcType.Integer],
				plus: _ => [TcType.Integer, TcType.Integer, TcType.Integer],
				slash: _ => [TcType.Integer, TcType.Integer, TcType.Integer],
				star: _ => [TcType.Integer, TcType.Integer, TcType.Integer],
			})

			const leftResult = typecheckExpr(ctx, env, node.left, leftType)
			const rightResult = typecheckExpr(ctx, env, node.right, rightType)

			return mkTypecheckResult(ctx, resultType, resultType == expectedType, {
				expectedType,
				token: node.startToken,
			})
		},
		Grouping(node) {
			return typecheckExpr(ctx, env, node.expression, expectedType)
		},
		LetAccess(node) {
			const symbolType = env.get(node.identifier.lexeme)
			if (symbolType === undefined) {
				reportUnreachable(`LetAccess: could not find type in environment for "${node.identifier.lexeme}"`)
			}
			return mkTypecheckResult(ctx, symbolType, symbolType == expectedType, {
				expectedType,
				token: node.startToken,
			})
		},
		If(node) {
			logger.error(`UNIMPLEMENTED! if in line ${node.startToken.line}`)
			return UNIMPLEMENTED_RESULT
			//return typecheckExpr(env, node.condition, TcType.Boolean)
		},
		Function(node) {
			logger.error(`UNIMPLEMENTED! function in line ${node.startToken.line}`)
			return UNIMPLEMENTED_RESULT
		},
		Call(node) {
			logger.error(`UNIMPLEMENTED! call in line ${node.startToken.line}`)
			return UNIMPLEMENTED_RESULT
		},
		Block(node) {
			logger.error(`UNIMPLEMENTED! block in line ${node.startToken.line}`)
			return UNIMPLEMENTED_RESULT
		},
	})

	return exprMatcher(node)
}

function typecheckStmt(ctx: ProjectContext, env: Environment, node: Ast.Stmt, expectedType: TcType): TypecheckResult {
	const {logger, sourceErrorReporter: reporter} = ctx
	logger.debug(`Typechecking stmt ${node._tag} expectedType=${expectedType}`)
	const stmtMatcher = matchAll<Ast.Stmt, TypecheckResult>({
		LetDeclaration(node) {
			if (node.initializer === undefined) {
				env.set(node.identifier.lexeme, TcType.Error)
				return {
					tcType: TcType.NoType,
					typechecks: false,
				}
			}
			if (node.typeIdentifier === Ast.ToInfer) {
				reporter.report(`Undeclared type`, 'no type declared for identifier', node.identifier)
				env.set(node.identifier.lexeme, TcType.Error)
				return {
					tcType: TcType.NoType,
					typechecks: false,
				}
			}
			const tcTypeFromIdentifier = TcType.fromToken(node.typeIdentifier)
			logger.debug(`LetDeclaration: updating environment. Adding ${node.identifier}=${tcTypeFromIdentifier}`)
			env.set(node.identifier.lexeme, tcTypeFromIdentifier)

			logger.debug(`LetDeclaration: tcTypeFromIdentifier ${tcTypeFromIdentifier}`)
			const {typechecks, tcType} = typecheckExpr(ctx, env, node.initializer, tcTypeFromIdentifier)
			const result = mkTypecheckResult(ctx, TcType.NoType, typechecks && tcType == expectedType, {
				expectedType,
				token: node.identifier,
			})
			return result
		},
		While(node) {
			const conditionResult = typecheckExpr(ctx, env, node.condition, TcType.Boolean)
			const blockResult = typecheckExpr(ctx, env, node.block, TcType.Void)
			return {
				tcType: TcType.NoType,
				typechecks: conditionResult.typechecks && blockResult.typechecks,
			}
		},
		Print(node) {
			return {
				tcType: TcType.NoType,
				typechecks: typecheckExpr(ctx, env, node.expression, TcType.String).typechecks,
			}
		},
		Expression(node) {
			return typecheckExpr(ctx, env, node.expression, expectedType)
		},
		Return(node) {
			return typecheckExpr(ctx, env, node.expression, expectedType)
		},
		Debugger(node) {
			return {
				tcType: TcType.NoType,
				typechecks: true,
			}
		},
		Assignment(node) {
			const expectedTcType = env.get(node.name.lexeme)
			if (!expectedTcType) {
				reportUnreachable(`Trying to assign to unknown type ${expectedTcType}`)
			}
			return {
				tcType: TcType.NoType,
				typechecks: typecheckExpr(ctx, env, node.value, expectedTcType).typechecks,
			}
		},
	})
	return stmtMatcher(node)
}

export function typecheck(ctx: ProjectContext, ast: Ast.Stmt[]): boolean {
	const env = createEnvironment()
	for (const stmt of ast) {
		if (!typecheckStmt(ctx, env, stmt, TcType.Nil)) {
			return false
		}
	}
	return true
}

function reportUnreachable(msg: string): never {
	// TODO: Look for this message when fuzzing
	throw new Error(`[SHOULD BE UNREACHABLE] ${msg}`)
}
