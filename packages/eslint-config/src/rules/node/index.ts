import { merge } from 'merge-anything'
import { possibleErrors } from './possible-errors'
import { stylistic } from './stylistic'
import { bestPractices } from './best-practices'

const mergedNode = merge(possibleErrors, stylistic, bestPractices)

export = {
  extends: [mergedNode],
  plugins: ['n'],
}
