/**
 * Re export curated parts of lib, for better portability of import paths.
 */

export { default as Log } from '../lib/log.js'

export { maybeDump, dumpAt } from '../lib/dump.js'

export { loadSvenchConfig } from '../lib/plugin-shared.js'

export { inspect } from '../lib/inspect.js'

export {
  importSync,
  importDefaultRelative,
  resolve,
  resolveSync,
} from '../lib/import-relative.cjs'