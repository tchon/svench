import { writable } from 'svelte/store'
import navaid from './navaid.js'
import { sectionPrefix } from './constants'

const normalize = path => path.replace(/\/{2,}/g, '/')

const join = (...parts) => normalize(parts.join('/'))

export default ({
  base = '/',
  getRoutes,
  normalizePath,
  DefaultIndex,
  Fallback,
}) => {
  let currentRoute = null
  let currentView = null
  let current

  const on404 = (path, hash, popState) => {
    if (path === '/' || path === '/index') {
      const route = {
        path,
        options: {},
      }
      setCurrent({ route, cmp: DefaultIndex, hash, popState })
    } else {
      setCurrent(null)
    }
  }

  const router = navaid(base, on404)

  base = '/' + base.replace(/^\/|\/$/g, '') + '/'

  router.resolve = uri => {
    if (!uri) return uri
    uri = base + uri.replace(/^\/|\/$/g, '')
    uri = uri.replace(/\/+/g, '/')
    return uri
  }

  router.error = writable()
  router.current = writable()

  const getView = () => new URLSearchParams(window.location.search).get('view')

  const setCurrent = (next, force = false) => {
    if (
      (current !== next || force) &&
      (!current ||
        !next ||
        current.cmp !== next.cmp ||
        current.route !== next.route ||
        current.view !== next.view)
      // || current.hash !== next.hash
    ) {
      current = next
      router.current.set(next)
    }
  }

  const setError = x => {
    router.error.set(x)
  }

  const loadDir = (route, hash, popState) => {
    setCurrent({ route, fallback: true, cmp: Fallback, hash, popState })
  }

  const loadComponent = async (_route, _view, hash, popState) => {
    try {
      currentRoute = _route
      currentView = _view

      const { default: cmp } = await _route.import()

      // we've been superseeded while loading
      if (currentRoute !== _route || currentView !== _view) return

      setCurrent({ cmp, route: currentRoute, view: getView(), hash, popState })
      setError(null)
    } catch (err) {
      if (currentRoute !== _route) return
      setError(err)
    }
  }

  const find = (_path, indexFirst, routes) => {
    let actual = null
    const path = normalizePath(_path)
    for (const route of routes) {
      const p = route.normalPath
      if (indexFirst && join(path, 'index') === p) return route
      if (path === p) {
        if (!indexFirst) return route
        actual = route
      }
    }
    // fallback to fully qualified /_/section_name
    if (!actual && !path.startsWith(sectionPrefix + '/')) {
      return find(sectionPrefix + path, indexFirst, routes)
    }
    return actual
  }

  router.findRoute = href => {
    const view = getView()
    const routes = getRoutes()
    const url = new URL(href)
    const path = router.format(url.pathname)
    const route = find(path.replace(/^\/$/, ''), view == null, routes)
    return route
  }

  router.reroute = () => {
    if (current) {
      const next = { ...current }
      current = next
      router.current.set(next)
    }
  }

  router.on('*', (params, popState) => {
    const view = getView()
    const routes = getRoutes()
    const path = router.format(location.pathname)
    const hash = location.hash
    const route = find(path, view == null, routes)

    if (route) {
      if (route.import) loadComponent(route, view, hash, popState)
      else loadDir(route, hash, popState)
    } else {
      on404(path, hash, popState)
    }

    // onMatch: for fallback
    if (router.onMatch) router.onMatch()
  })

  const listen = router.listen

  router.listen = el => {
    listen(el)
    return () => router.unlisten()
  }

  return router
}
