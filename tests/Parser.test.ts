// @ts-nocheck
import 'source-map-support/register'

import {Token, TokenType} from '#src/Token'
import * as Ast from '#src/Ast'

import {assert, assertEq} from '#tests/Assert'
import {parse, ident, litExpr} from '#tests/ParserHelpers'


function testParser() {

	// TODO: add test for `return`
	// intent is to check that nil token column and line number is correct,
	// since return is desugared to `return nil`
	// test this for both final expr in function
	// and return anywhere (hits different codepaths)

	// TODO: add code coverage report

	assertEq(
		parse(
		      `let a = 1
		      let b: Bool = true`
		),
		[
			new Ast.Stmt.LetDeclaration(
				ident('a', 1),
				Ast.ToInfer,
				litExpr(1, 1),
			),

			new Ast.Stmt.LetDeclaration(
				ident('b', 2),
				new Token(TokenType.Identifier, 'Bool', null, 2),
				litExpr(true, 2)
			)
		]
	)
		      
	assert(
		parse(`while true {
			print 1 + 2 + 3
		}`),
		[
			new Ast.Stmt.While(
				litExpr(true, 1),
				new Ast.Expr.Block(
					[
						new Ast.Stmt.Print(
							new Ast.Expr.Binary(
								new Ast.Expr.Binary(
									litExpr(1, 2),
									new Token(TokenType.Plus, '+', null, 2),
									litExpr(2, 2),
								),
								new Token(TokenType.Plus, '+', null, 2),
								litExpr(3, 2),
							),
							new Token(TokenType.Print, 'print', null, 2),
						)
					],
					new Token(TokenType.OpenBrace, '{', null, 1)
				)
			)
		]
	)

	assert(
		parse(
			`let a: Integer = 500 / 2
			a = a + 100`
		),
		[
			new Ast.Stmt.LetDeclaration(
				ident('a', 1),
				ident('Integer', 1),
				new Ast.Expr.Binary(
					litExpr(500, 1),
					new Token(TokenType.Slash, '/', null, 1),
					litExpr(2, 1)
				),
			),
			new Ast.Stmt.Assignment(
				new Token(TokenType.Identifier, 'a', null, 2),
				new Ast.Expr.Binary(
					new Ast.Expr.LetAccess(new Token(TokenType.Identifier, 'a', null, 2)),
					new Token(TokenType.Plus, '+', null, 2),
					litExpr(100, 2)
				)
			)
		]
	)

	assert(
		parse(
			`let a: Boolean = 2 > 1
			let b: Boolean = (1 > 2)
			if a {
				print "if"
			} else if b {
				print "elseif"
			} else {
				print "else"
			}`
		),
		[
			new Ast.Stmt.LetDeclaration(
				ident('a', 1),
				ident('Boolean', 1),
				new Ast.Expr.Binary(
					litExpr(2, 1),
					new Token(TokenType.Greater, '>', null, 1),
					litExpr(1, 1),
				),
			),
			new Ast.Stmt.LetDeclaration(
				ident('b', 2),
				ident('Boolean', 2),
				new Ast.Expr.Grouping(
					new Ast.Expr.Binary(
						litExpr(1, 2),
						new Token(TokenType.Greater, '>', null, 2),
						litExpr(2, 2),
					),
					new Token(TokenType.OpenParen, '(', null, 2),
				),
			),
			new Ast.Stmt.Expression(
				new Ast.Expr.If(
					new Ast.Expr.LetAccess(ident('a', 3)),
					new Ast.Expr.Block(
						[
							new Ast.Stmt.Print(
								litExpr('if', 4),
								new Token(TokenType.Print, 'print', null, 4),
							)
						],
						new Token(TokenType.OpenBrace, '{', null, 3)
					),
					new Ast.Expr.If(
						new Ast.Expr.LetAccess(ident('b', 5)),
						new Ast.Expr.Block(
							[
								new Ast.Stmt.Print(
									litExpr('elseif', 6),
									new Token(TokenType.Print, 'print', null, 6),
								)
							],
							new Token(TokenType.OpenBrace, '{', null, 5)
						),
						new Ast.Expr.Block(
							[
								new Ast.Stmt.Print(
									litExpr('else', 8),
									new Token(TokenType.Print, 'print', null, 8),
								)
							],
							new Token(TokenType.OpenBrace, '{', null, 7)
						),
					),
				),
				new Token(TokenType.Semicolon, ';', null, 9),
			)
		]
	)

	assert(
		parse(
			`let a: fn = fun (x, y) {
				print "hi"
				2
			}

			a(1, 2)
			`
		),
		[
			new Ast.Stmt.LetDeclaration(
				ident("a", 1),
				ident("fn", 1),
				new Ast.Expr.Function(
					null,
					[ident("x", 1), ident("y", 1)],
					[
						new Ast.Stmt.Print(
							litExpr("hi", 2),
							new Token(TokenType.Print, 'print', null, 2)
						)
					],
					new Token(TokenType.Fun, 'fun', null, 1),
					new Ast.Stmt.Return(
						litExpr(2, 3),
					)
				)
			),
			new Ast.Stmt.Expression(
				new Ast.Expr.Call(
					new Ast.Expr.LetAccess(
						ident("a", 6),
					),
					[
						litExpr(1, 6),
						litExpr(2, 6),
					],
					new Token(TokenType.CloseParen, ')', null, 6),
				),
				new Token(TokenType.Semicolon, ';', null, 6),
			)
		]
	)

	assert(
		parse(
			`fun a(x, y) {
				print "hi"
				2
			}

			a(1, 2)
			`
		),
		[
			new Ast.Stmt.LetDeclaration(
				ident("a", 1),
				Ast.ToInfer,
				new Ast.Expr.Function(
					null,
					[ident("x", 1), ident("y", 1)],
					[
						new Ast.Stmt.Print(
							litExpr("hi", 2),
							new Token(TokenType.Print, 'print', null, 2)
						)
					],
					new Token(TokenType.Fun, 'fun', null, 1),
					new Ast.Stmt.Return(
						litExpr(2, 3),
					)
				)
			),
			new Ast.Stmt.Expression(
				new Ast.Expr.Call(
					new Ast.Expr.LetAccess(
						ident("a", 6),
					),
					[
						litExpr(1, 6),
						litExpr(2, 6),
					],
					new Token(TokenType.CloseParen, ')', null, 6),
				),
				new Token(TokenType.Semicolon, ';', null, 6),
			)
		]
	)
}

testParser()
console.log('Tests passed!')

