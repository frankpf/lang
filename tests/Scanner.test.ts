// TODO
require('require-rewrite')(__dirname)
import 'source-map-support/register'

import {Token, TokenType} from '#src/Token'
import {Scanner} from '#src/Scanner'

import {assert} from '#tests/Assert'

function testScanner() {
	assert(
		Scanner.scanText(
			`
a   : = true
`.trim(),
		),
		[
			new Token(TokenType.Identifier, 'a', null, 1, 0),
			new Token(TokenType.Colon, ':', null, 1, 5),
			new Token(TokenType.Equal, '=', null, 1, 7),
			new Token(TokenType.True, 'true', null, 1, 9),
			semicolon(1, 13),
			eof(1, 13),
		],
	)

	assert(
		Scanner.scanText(
			`
call(9_9.99) // my comment
lol(2_333)
`.trim(),
		),
		[
			new Token(TokenType.Identifier, 'call', null, 1, 0),
			new Token(TokenType.OpenParen, '(', null, 1, 5),
			new Token(TokenType.DoubleLit, '9_9.99', 99.99, 1, 6),
			new Token(TokenType.CloseParen, ')', null, 1, 12),
			semicolon(1, 14),

			new Token(TokenType.Identifier, 'lol', null, 2, 0),
			new Token(TokenType.OpenParen, '(', null, 2, 4),
			new Token(TokenType.IntegerLit, '2_333', 2333, 2, 5),
			new Token(TokenType.CloseParen, ')', null, 2, 10),
			semicolon(2, 11),
			eof(2, 11),
		],
	)
}
/*
function testScannerz() {
    assert(
        Scanner.scanText(
`call(1)
	.call(2)
	.call(3)
`),
        [
            new Token(TokenType.Identifier, 'call', null, 1),
            new Token(TokenType.OpenParen, '(', null, 1),
            new Token(TokenType.IntegerLit, '1', 1, 1),
            new Token(TokenType.CloseParen, ')', null, 1),

            new Token(TokenType.Dot, '.', null, 2),
            new Token(TokenType.Identifier, 'call', null, 2),
            new Token(TokenType.OpenParen, '(', null, 2),
            new Token(TokenType.IntegerLit, '2', 2, 2),
            new Token(TokenType.CloseParen, ')', null, 2),

            new Token(TokenType.Dot, '.', null, 3),
            new Token(TokenType.Identifier, 'call', null, 3),
            new Token(TokenType.OpenParen, '(', null, 3),
            new Token(TokenType.IntegerLit, '3', 3, 3),
            new Token(TokenType.CloseParen, ')', null, 3),
	    semicolon(3),
	    eof(4),
        ]
    )

    assert(
        Scanner.scanText(
`1 +
2 +
3`),
        [
            new Token(TokenType.IntegerLit, '1', 1, 1),
            new Token(TokenType.Plus, '+', null, 1),
            new Token(TokenType.IntegerLit, '2', 2, 2),
            new Token(TokenType.Plus, '+', null, 2),
            new Token(TokenType.IntegerLit, '3', 3, 3),
	    semicolon(3),
	    eof(3),
        ]
    )

    assert(
        Scanner.scanText(
            `fun foo(a, b) {
                print("Hello !").method()
            }`
        ),
        [
            new Token(TokenType.Fun, 'fun', null, 1),
            new Token(TokenType.Identifier, 'foo', null, 1),
            new Token(TokenType.OpenParen, '(', null, 1),
            new Token(TokenType.Identifier, 'a', null, 1),
            new Token(TokenType.Comma, ',', null, 1),
            new Token(TokenType.Identifier, 'b', null, 1),
            new Token(TokenType.CloseParen, ')', null, 1),
            new Token(TokenType.OpenBrace, '{', null, 1),

            new Token(TokenType.Print, 'print', null, 2),
            new Token(TokenType.OpenParen, '(', null, 2),
            new Token(TokenType.StringLit, '"Hello !"', 'Hello !', 2),
            new Token(TokenType.CloseParen, ')', null, 2),
            new Token(TokenType.Dot, '.', null, 2),
            new Token(TokenType.Identifier, 'method', null, 2),
            new Token(TokenType.OpenParen, '(', null, 2),
            new Token(TokenType.CloseParen, ')', null, 2),
            semicolon(2),

            new Token(TokenType.CloseBrace, '}', null, 3),
	    semicolon(3),
            eof(3),
        ]
    )

    assert(
        Scanner.scanText(
            `let arr: Array = []
            arr.push(a)
            arr.push(b)`
        ),
        [
            new Token(TokenType.Let, 'let', null, 1),
            new Token(TokenType.Identifier, 'arr', null, 1),
	    new Token(TokenType.Colon, ':', null, 1),
	    new Token(TokenType.Identifier, 'Array', null, 1),
            new Token(TokenType.Equal, '=', null, 1),
            new Token(TokenType.OpenBracket, '[', null, 1),
            new Token(TokenType.CloseBracket, ']', null, 1),
            semicolon(1),

            new Token(TokenType.Identifier, 'arr', null, 2),
            new Token(TokenType.Dot, '.', null, 2),
            new Token(TokenType.Identifier, 'push', null, 2),
            new Token(TokenType.OpenParen, '(', null, 2),
            new Token(TokenType.Identifier, 'a', null, 2),
            new Token(TokenType.CloseParen, ')', null, 2),
            semicolon(2),

            new Token(TokenType.Identifier, 'arr', null, 3),
            new Token(TokenType.Dot, '.', null, 3),
            new Token(TokenType.Identifier, 'push', null, 3),
            new Token(TokenType.OpenParen, '(', null, 3),
            new Token(TokenType.Identifier, 'b', null, 3),
            new Token(TokenType.CloseParen, ')', null, 3),
            semicolon(3),
            eof(3),
        ]
    )
}
*/

const semicolon = (line: number, column: number) => new Token(TokenType.Semicolon, ';', null, line, column)
const eof = (line: number, column: number) => new Token(TokenType.Eof, '', null, line, column)

testScanner()
console.log('Tests passed!')
