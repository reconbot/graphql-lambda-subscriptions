import { assert } from 'chai'
import { collapseKeys } from './getFilteredSubs'

describe('collapseKeys', () => {
  it('makes the deep objects into dots', () => {
    assert.deepEqual(collapseKeys({}), {})
    assert.deepEqual(collapseKeys({ a: 4, b: { c: 5, d: 'hi', e: { f: false } } }), {
      a: 4,
      'b.c': 5,
      'b.d': 'hi',
      'b.e.f': false,
    })
    assert.deepEqual(collapseKeys({ a: [1,2,3, { b: 4, c: [], d: null, e: undefined }] }), {
      'a.0': 1,
      'a.1': 2,
      'a.2': 3,
      'a.3.b': 4,
    })
  })
})

describe('getFilteredSubs', () => {
  it('can match on payload')
  it('can match on connectionId')
})
