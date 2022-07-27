import { use, assert } from 'chai'
import chaiSubset from 'chai-subset'

process.env.PORT = '6001'

global.assert = assert

use(chaiSubset)
