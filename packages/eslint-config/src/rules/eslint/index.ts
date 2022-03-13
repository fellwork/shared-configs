import { merge } from 'merge-anything'
import { possibleErrors } from './possible-errors'
import { stylistic } from './stylistic'
import { formatting } from './formatting'

const mergedEslint = merge(possibleErrors, stylistic, formatting)

export default mergedEslint
