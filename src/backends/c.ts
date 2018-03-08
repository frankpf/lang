// import * as Ast from '../ast'
// import {_, TupleLength} from '../utils'
// import {matchAll} from '../match'
// import {Token, TokenType} from '../token'
// import {Resolver} from '../localresolver'
// 
// type StrMap<A> = { [_: string]: A }
// 
// const AnonFuncGenerator = (() => {
// 	let i = 0
// 	return { gen: () => `anon${i++}` }
// })()
// 
// class DeclarationMap {
// 
// 	private readonly instructionMap: StrMap<Instruction.T[]> = {}
// 	private readonly arityMap: StrMap<number> = {}
// 
// 	constructor() {}
// 
// 	addFunction(name: string, arity: number, instructions: Instruction.T[]) {
// 		if (this.instructionMap[name] !== undefined || this.arityMap[name] !== undefined) {
// 			// FIXME: I don't think this should be an error
// 			throw new Error(`Trying to overwrite existing function ${name}`)
// 		}
// 		this.instructionMap[name] = instructions
// 		this.arityMap[name] = arity
// 	}
// 
// 	getInstructions(name: string) {
// 		if (this.instructionMap[name] === undefined) {
// 			throw new Error(`Trying to access instructions of undefined function ${name}`)
// 		}
// 
// 		return this.instructionMap[name]
// 
// 	}
// 	getArity(name: string): number {
// 		if (this.arityMap[name] === undefined) {
// 			throw new Error(`Trying to access arity of undefined function ${name}`)
// 		}
// 
// 		return this.arityMap[name]
// 	}
// 	*entries(): Generator<[name: string, arity: number, instructions: Instruction.T[]]> {
// 		for (const [name, instructions] of Object.entries(this.instructionMap)) {
// 			yield [name, this.getArity(name), instructions]
// 		}
// 	}
// }
// 
// export namespace Instruction {
// 	export type T = Instr
// 
// 	interface Instr {
// 		readonly line: number
// 		sizeInBytes(): number
// 		encode(buf: InstructionBuffer): void
// 	}
// 
// 	// FIXME: oof we probably need to refactor the whole Instruction architecture, I don't think this makes sense
// 	// MakeConstant is not a real instruction, we just use it to create constants without a corresponding instruction
// 	export class MakeConstant implements Instr {
// 		readonly _tag = 'MakeConstant'
// 		line!: number
// 		private _index: number | undefined
// 		static globalConstants = {} as any
// 
// 		constructor(readonly constant: string, readonly currentFunctionName: string, readonly mode: 'string' | 'function' = 'string') {}
// 
// 		encode(buf: InstructionBuffer) {
// 			const constantBuf = MakeConstant.globalConstants[this.currentFunctionName]
// 			if (constantBuf === undefined) {
// 				MakeConstant.globalConstants[this.currentFunctionName] = {}
// 			}
// 
// 			const constant = MakeConstant.globalConstants[this.currentFunctionName][this.constant]
// 			if (constant !== undefined) {
// 				this._index = constant.index()
// 				return
// 			}
// 
// 			const marker = this.mode === 'string' ? 's' : 'f'
// 			const prefix = `${marker}${this.constant.length}`
// 			const index = buf.constants.push(`${prefix} ${this.constant}`) - 1
// 			this._index = index
// 			MakeConstant.globalConstants[this.currentFunctionName][this.constant] = this
// 		}
// 
// 		sizeInBytes() { return 0 }
// 
// 		index() {
// 			if (this._index === undefined) {
// 				throw new Error('Tried to access constant with no index')
// 			}
// 			return this._index
// 		}
// 	}
// 
// 	export class SetGlobal implements Instr {
// 		readonly _tag = 'SetGlobal'
// 		constructor(readonly line: number, readonly constant: MakeConstant) {}
// 
// 		encode(buf: InstructionBuffer) {
// 			buf.instructions.push(`SetGlobal ${this.constant.index()}`)
// 			buf.lineNumbers.push(this.line)
// 		}
// 
// 		sizeInBytes() { return 2 }
// 	}
// 
// 	export class GetGlobal implements Instr {
// 		readonly _tag = 'GetGlobal'
// 		constructor(readonly line: number, readonly constant: MakeConstant) {}
// 
// 		encode(buf: InstructionBuffer) {
// 			buf.instructions.push(`GetGlobal ${this.constant.index()}`)
// 			buf.lineNumbers.push(this.line)
// 		}
// 
// 		sizeInBytes() { return 2 }
// 	}
// 
// 	export class LoadFunction implements Instr {
// 		readonly _tag = 'LoadFunction'
// 		constructor(readonly line: number, readonly constant: MakeConstant) {}
// 
// 		encode(buf: InstructionBuffer) {
// 			buf.instructions.push(`LoadConstant ${this.constant.index()}`)
// 			buf.lineNumbers.push(this.line)
// 		}
// 
// 		sizeInBytes() { return 2 }
// 	}
// 
// 
// 	export class DefineGlobal implements Instr {
// 		readonly _tag = 'DefineGlobal'
// 		constructor(readonly line: number, readonly constant: MakeConstant) {}
// 
// 		encode(buf: InstructionBuffer): void {
// 			buf.instructions.push(`DefineGlobal ${this.constant.index()}`)
// 			buf.lineNumbers.push(this.line)
// 		}
// 
// 		sizeInBytes() { return 2 }
// 	}
// 
// 	export class LoadConstant implements Instr {
// 		readonly _tag = 'LoadConstant'
// 		constructor(readonly line: number, readonly value: string | number, private isDouble: boolean) {}
// 
// 		encode(buf: InstructionBuffer): void {
// 			let prefix: string
// 			if (typeof this.value === 'number') {
// 				prefix = this.isDouble ? 'd' : 'i'
// 			} else {
// 				prefix = `s${this.value.length}`
// 			}
// 			let len = buf.constants.push(`${prefix} ${this.value}`)
// 			buf.instructions.push(`LoadConstant ${len - 1}`)
// 			buf.lineNumbers.push(this.line)
// 		}
// 
// 		sizeInBytes() { return 2 }
// 	}
// 
// 	export enum JumpMode { IfFalse, Always }
// 	export class Jump implements Instr {
// 		readonly _tag = 'Jump'
// 
// 		constructor(readonly line: number, readonly mode: JumpMode, readonly jumpOver: number) {}
// 
// 		encode(buf: InstructionBuffer): void {
// 			const opcode = this.mode === JumpMode.Always ? 'Jump' : 'JumpIfFalse'
// 
// 			// We're going to use two bytes in the interpreter for the jump offset.
// 			// TODO: Should this be encoded in the bytecode generator?
// 			// I think maybe it should go in the interpreter bytecode parser?
// 			// that way an error is still thrown at compile time, but it's the responsibility
// 			// of the interpreter.
// 			if (this.jumpOver > 2**16 - 1) {
// 				throw new Error(`Too much code to jump over (more than ${2**16} instructions)`)
// 			}
// 
// 			buf.instructions.push(`${opcode} ${this.jumpOver}`)
// 			buf.lineNumbers.push(this.line)
// 		}
// 
// 		sizeInBytes() { return 3 }
// 	}
// 
// 	export const Call = SimpleInstr<[number]>('Call', 1)
// 	export const SetLocal = SimpleInstr<[number]>('SetLocal', 1)
// 	export const GetLocal = SimpleInstr<[number]>('GetLocal', 1)
// 
// 	export const Print = SimpleInstr('Print')
// 	export const Debugger = SimpleInstr('Debugger')
// 	export const Pop = SimpleInstr('Pop')
// 	export const Return = SimpleInstr('Return')
// 	export const LoadNil = SimpleInstr('LoadNil')
// 	export const LoadTrue = SimpleInstr('LoadTrue')
// 	export const LoadFalse = SimpleInstr('LoadFalse')
// 	export const Negate = SimpleInstr('Negate')
// 	export const Not = SimpleInstr('Not')
// 	export const Or = SimpleInstr('Or')
// 	export const And = SimpleInstr('And')
// 	export const Subtract = SimpleInstr('Sub')
// 	export const Add = SimpleInstr('Add')
// 	export const Multiply = SimpleInstr('Mul')
// 	export const Divide = SimpleInstr('Div')
// 	export const Equal = SimpleInstr('Eql')
// 	export const Greater = SimpleInstr('Ge')
// 	export const GreaterEqual = SimpleInstr('Geq')
// 	export const Less = SimpleInstr('Le')
// 	export const LessEqual = SimpleInstr('Leq')
// 
// 	function SimpleInstr<Args extends any[] = []>(instr: string, numArgs: TupleLength<Args> | 0 = 0) {
// 		const classRef: { new(line: number, ...argList: TupleLength<Args> extends 0 ? never : Args): Instr } = class implements Instr {
// 			readonly _tag = instr
// 			args: any[]
// 			constructor(readonly line: number, ...argList: TupleLength<Args> extends 0 ? never : Args) {
// 				this.args = argList || []
// 				if ((this.args.length) > numArgs) {
// 					throw new Error(
// 						`Trying to call instruction ${instr} with ${this.args.length} arguments, but it expects ${numArgs} arguments`
// 					)
// 				}
// 			}
// 			encode(buf: InstructionBuffer) {
// 				buf.instructions.push([instr, ...this.args].join(' '))
// 				buf.lineNumbers.push(this.line)
// 			}
// 			sizeInBytes() { return 1 + numArgs }
// 		}
// 
// 		return classRef
// 	}
// }
// 
// 
// type InstructionBuffer = {
// 	readonly functionName: string
// 	readonly arity: number
// 	instructions: string[]
// 	constants: string[] // f{number} or i{number}
// 	lineNumbers: number[]
// }
// 
// 
// type FromAstOptions = { source: string }
// export function fromAst(ast: Ast.Stmt[], { source }: FromAstOptions): string {
// }
// 
// type FunctionDef = { arity: number, name: string }
// function instructionsFromAst(ast: Ast.Stmt[], _declMap?: DeclarationMap, _resolver?: Resolver): { instructions: Instruction.T[], declarationMap: DeclarationMap } {
// 	function exprMatcher(expr: Ast.Expr): Instruction.T[] {
// 		const matcher = matchAll<Ast.Expr, string>({
// 			Literal({value, startToken}) {
// 				return `${value}`
// 			},
// 			Binary({left, operator, right, startToken}) {
// 				return `${left} ${operator} ${right}`
// 			},
// 			Grouping({expression}) {
// 				return `(${exprMatcher(expression)})`
// 			},
// 			Unary({operator, right, startToken}) {
// 				return `(${operator}${right})`
// 			},
// 			LetAccess({identifier, startToken}) {
// 				return `${identifier.lexeme}`
// 			},
// 			If({condition, thenBlock, elseTail, startToken}) {
// 				const thenInstrs = exprMatcher(thenBlock)
// 				let code = `
// 				if (${exprMatcher(condition)}) {
// 					${exprMatcher(thenBlock)}
// 				}
// 				`
// 
// 				if (elseTail !== undefined) {
// 					const elseTailInstrs = exprMatcher(elseTail)
// 					code += `else ${elseTailInstrs}`
// 				}
// 				return code
// 			},
// 			Block({statements}) {
// 				return `{ ${stmtMatcher(statements)} } `
// 			},
// 			Function({name, params, body, returnStmt, startToken}) {
// 			},
// 			Call({ callee, args, startToken }) {
// 			}
// 		})
// 		return matcher(expr)
// 	}
// 	const stmtMatcher = matchAll<Ast.Stmt, Instruction.T[]>({
// 		Expression({expression, semicolonToken}) {
// 		},
// 		Assignment({name, value}) {
// 		},
// 		While({condition, block}) {
// 		},
// 		Print({expression, printToken}) {
// 		},
// 		Debugger({debuggerToken}) {
// 		},
// 		LetDeclaration({identifier, initializer}) {
// 		},
// 		Return({expression}) {
// 		},
// 	})
// 
// 	const instructions = ast.flatMap(stmtMatcher)
// 	return { instructions, declarationMap: _declMap }
// }
// 
