const { routify: Routify } = require('@sveltech/routify')

const pipe = (...fns) => x0 => fns.reduce((x, f) => f(x), x0)

const updateChildrenPath = (file, oldPath) => {
  if (file.filepath === oldPath) return
  if (!file.dir) return
  for (const child of file.dir) {
    const { filepath } = child
    child.filepath = file.filepath + filepath.slice(oldPath.length)
    updateChildrenPath(child, filepath)
  }
}

const isMagic = route =>
  route.isIndex || route.isLayout || route.isReset || route.isFallback

const relocateVirtualFiles = (file, parent) => {
  const { segments: segs } = file

  if (segs) {
    delete file.segments
    file.name = segs.pop()
    file.file = file.name + (file.ext ? `.${file.ext}` : '')
    file.svench.extraNesting = segs.length
    file.svench.isVirtualIndex = true

    if (!parent.dir) {
      throw new Error('unexpected hierarchy')
    }

    parent.dir = parent.dir.filter(x => x !== file)
    if (parent.dir.length < 1) {
      delete parent.dir
    }

    let cur = parent

    while (segs.length > 0) {
      const seg = segs.shift()
      // const nextParent = cur.dir.find(x => x.dir && !x.ext && x.name === seg)
      const nextParent = cur.dir && cur.dir.find(x => x.name === seg)
      if (nextParent) {
        cur = nextParent
        if (!cur.dir) cur.dir = []
      } else {
        if (!cur.dir) cur.dir = []
        const dir = cur.dir
        cur = {
          file: seg,
          filepath: (cur.filepath || '') + '/' + seg,
          name: seg,
          ext: '',
          badExt: false,
          dir: [],
          // absolutePath: '/home/eric/projects/routify/svench/svench/example/src/000',
          // dir: [
          //   {
          //     file: 'index.svench',
          //     filepath: '/000/index.svench',
          //     name: 'index',
          //     ext: 'svench',
          //     badExt: false,
          //     absolutePath: '/home/eric/projects/routify/svench/svench/example/src/000/index.svench',
          //     svench: {}
          //   }
          // ],
          svench: {},
        }
        dir.push(cur)
      }
    }

    cur.dir.push(file)
    file.filepath = cur.filepath + '/' + file.file
  }

  if (file.dir) {
    for (const child of file.dir) {
      relocateVirtualFiles(child, file)
    }
  }

  return file
}

const hooks = {
  file(file) {
    file.svench = {
      extraNesting: 0,
    }

    const { filepath: oldFilepath } = file

    // remove .svench from dir
    if (file.dir && file.name.endsWith('.svench')) {
      const dropSvench = x => x.replace(/\.svench$/g, '')
      file.name = dropSvench(file.name)
      file.filepath = dropSvench(file.filepath)
      file.svench.section = true
      if (file.ext) {
        file.ext = file.ext.replace(/^svench$/g, '')
      }
      updateChildrenPath(file, oldFilepath)
    }

    // . => /
    const segs = file.name.split('.')
    if (segs.length > 1) {
      delete file.name
      file.segments = segs
    }
  },

  tree: relocateVirtualFiles,

  // tree: tree => {
  //   tree = relocateVirtualFiles(tree)
  //
  //   const walk = (item, parent, walker) => {
  //     if (item.dir) {
  //       for (const child of item.dir) {
  //         walk(child, item, walker)
  //       }
  //     }
  //     walker(item, parent)
  //   }
  //
  //   tree.svench = { sections: {} }
  //
  //   walk(tree, null, file => {
  //     if (!file.svench) {
  //       return
  //     }
  //     const section = file.meta && file.meta['svench:section'] || ''
  //     file.svench.section = section
  //     file.svench.sections = {[section]: true}
  //   })
  //
  //   walk(tree, null, (file, parent) => {
  //     if (!parent) return
  //     // if (parent && parent.svench && parent.svench.sections) {
  //       Object.assign(
  //         parent.svench.sections,
  //         file.svench.sections,
  //       )
  //     // }
  //   })
  //
  //   return tree
  // },
  //
  // tree: tree => {
  //   const walk = (item, parent, walker) => {
  //     walker(item, parent)
  //     if (item.dir) {
  //       for (const child of item.dir) {
  //         walk(child, item, walker)
  //       }
  //     }
  //   }
  //
  //   const _tree = { ...tree }
  //   _tree.dir = []
  //
  //   const byFilepath = filepath => x => x.filepath === filepath
  //
  //   const relocate = source => {
  //     const file = { ...source }
  //     if (file.dir) file.dir = []
  //     const steps = file.segments || filepath.split('/')
  //     const filepath = file.filepath
  //     steps.shift()
  //     file.name = steps.pop()
  //     file.svench.section = steps[0]
  //     let cur = _tree
  //     let current = ''
  //     while (steps.length > 0) {
  //       const seg = steps.shift()
  //       if (!cur.dir) cur.dir = []
  //       const dir = cur.dir
  //       current += '/' + seg
  //       cur = dir.find(byFilepath(current))
  //       if (!cur) {
  //         cur = {
  //           file: seg,
  //           // filepath: (cur.filepath || '') + '/' + seg,
  //           filepath: current,
  //           name: seg,
  //           ext: '',
  //           badExt: false,
  //           dir: [],
  //           svench: { section: seg },
  //         }
  //         dir.push(cur)
  //       }
  //     }
  //     const target = cur.dir.find(byFilepath(filepath))
  //     if (target) {
  //       const node = { ...target }
  //       delete node.dir
  //       Object.assign(target, node)
  //     } else {
  //       cur.dir.push(file)
  //     }
  //   }
  //
  //   walk(tree, null, file => {
  //     if (!file.filepath) return
  //     file.svench.section = (file.meta && file.meta['svench:section']) || '@'
  //   })
  //
  //   // console.log(JSON.stringify(_tree, false, 2)) ; process.exit()
  //
  //   // walk(_tree, null, file => {
  //   //   return file.isFile || (file.dir && file.dir.length > 0)
  //   // })
  //
  //   walk(tree, null, relocateVirtualFiles)
  //
  //   // for (const section of [...sections]) {
  //   //   const path = '/' + section
  //   //   for (const item of tree.dir) {
  //   //     if (item.filepath.replace(/^\/[\d-]*/, '/') !== path) continue
  //   //     item.svench.section = section
  //   //   }
  //   // }
  //
  //   return tree
  // },

  decorate: (file, parent) => {
    const svench = file.svench

    let basename = file.path.split('/').pop()
    svench.sortKey = basename

    if (!isMagic(file) && !/^[\d-]*$/.test(basename)) {
      const match = /^[\d-]+_*(.*)$/.exec(basename)
      if (match) {
        basename = match[1]
        svench.sortKey = match[0]
        svench.name = basename
      }
    }

    file.path = (parent.path || '') + '/' + basename
  },

  finalize(file) {
    const { svench } = file
    svench.id = file.id || file.path
    if (!file.meta.name) {
      file.meta.name = (svench.name || file.name).replace(/_/g, ' ').trim()
    }
  },
}

const parseExtensions = ({ extensions = ['.svench'] }) => {
  if (!extensions) return
  return {
    extensions: extensions.map(ext =>
      ext.startsWith('.') ? ext.slice(1) : ext
    ),
  }
}

const processOptions = (options = {}) => ({
  ...options,
  ...parseExtensions(options),
})

const createRoutify = ({ extensions, routify = {} }) => ({
  ...Routify({
    pages: './src',

    extensions,

    // watch delay is needed to prevent race:
    //
    // - user rename/delete page file
    // - rollup picks file change
    // - rollup triggers build
    // - rollup-plugin-hot/autocreate sees deleted file in routes.js
    // - autocreate recreates just deleted file <--- HERE BE BUG
    // - routify picks file change
    // - routify recreates routes.js
    // - ... but too late, user has extraneous deleted file recreated
    // - rollup picks the change in routes.js...
    //
    // this delay is intented to give some time to routify to pick the
    // change first (and so rollup plugin will block start of rollup build
    // until routes.js has been generated)
    //
    // we can't be too greedy, because this delay will be paid for _any_
    // file change when user is working, even when unneeded (and in this
    // case the delay will be consumed in full -- nominal case is worst
    // case) :-/
    //
    watchDelay: 20,

    hooks,

    ...routify,
  }),

  name: 'svench',
})

module.exports = pipe(processOptions, createRoutify)