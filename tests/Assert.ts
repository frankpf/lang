import {strict as stdAssert} from 'assert'

export function assertEq<T>(actual: T, expected: T) {
	stdAssert.deepEqual(actual, expected)
}

export const assert = assertEq
