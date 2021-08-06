import { assert } from 'chai'
import { serial } from './serial'

describe('serial', () => {
  it('loads', () => {
    assert.equal(serial, 'foo')
  })
})
