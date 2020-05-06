import {
  getContext as getSvelteContext,
  setContext as setSvelteContext,
} from 'svelte'

const key = { context: 'Svench' }

export const getContext = () => getSvelteContext(key)

export const setContext = value => setSvelteContext(key, value)

export const updateContext = transform =>
  setContext(
    typeof transform === 'function'
      ? transform(getContext())
      : { ...getContext(), ...transform }
  )

export const noop = () => {}

export const identity = x => x

// export const pipe = (...fns) => x => fns.reduce((f, g) => g(f), x)

export const pipe = (...fns) => {
  if (typeof fns[0] === 'string') {
    const prop = fns.shift()
    const o = {
      [prop]: x => fns.reduce((f, g) => g(f), x),
    }
    return o[prop]
  }
  return x => fns.reduce((f, g) => g(f), x)
}
{
  let nesting = 0
  let padding = 0

  pipe.peep = (...fns) => {
    const _log = (prefix, char) => x => {
      // eslint-disable-next-line no-console
      console.log(
        '  '.repeat(nesting) + prefix.padStart(padding - nesting * 2, char),
        x
      )
      return x
    }

    return pipe(
      typeof fns[0] === 'string' ? fns[0] : identity,
      // nesting === 0 ? _log('->', '-') : identity,
      _log(`->`, '-'),
      x => {
        // if (nesting === 0) _log('->', '-')(x)
        nesting++
        return x
      },
      ...fns
        .filter(x => typeof x !== 'string')
        .flatMap(f => {
          const prefix = f.name + ' =>'
          padding = Math.max(padding, prefix.length)
          return [f, _log(prefix)]
        }),
      x => {
        nesting--
        // if (nesting === 0) _log('=>', '=')(x)
        return x
      },
      _log('=>', '=')
    )
  }
}

export const split = (...args) =>
  function split(x) {
    return x.split(...args)
  }

export const reduce = (...args) =>
  function reduce(x) {
    return x.reduce(...args)
  }

export const _log = (...args) => x => {
  // eslint-disable-next-line no-console
  console.log(...args, x)
  return x
}
{
  _log.out = _log('=>')

  Object.defineProperties(_log, {
    in: {
      get() {
        _log.ix = 0
        return _log('\n->')
      },
    },
    x: {
      get() {
        return _log(++_log.ix + ':')
      },
    },
  })
}

export const get = steps => route =>
  steps.split('.').reduce((cur, step) => cur && cur[step], route)

export const false$ = {
  subscribe: listener => {
    listener(false)
    return noop
  },
}

export const constStore = value => ({
  subscribe: listener => {
    listener(value)
    return noop
  },
})

export const makeNamer = getOptions => {
  const taken = {}
  let index = 0

  const getRenderName = (_name, onDestroy) => {
    const { defaultViewName } = getOptions()

    index++

    const wantedName = _name == null ? defaultViewName(index) : _name

    let name = wantedName
    if (taken[name]) {
      name = `${name} (${taken[wantedName]})`
    }

    taken[wantedName] = (taken[wantedName] || 0) + 1

    // we need to handle leaving View components for HMR (otherwise components
    // rerendered by HMR messes the actual index and new views end up not being
    // rendered because they are given unsync indexes)
    onDestroy(() => {
      index--
      taken[wantedName]--
    })
    return name
  }

  return getRenderName
}
