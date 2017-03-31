const Hayabusa = (() => {
  const instance = (cls, arg) => Object.assign({ __proto__: cls }, arg || { })
  const chainof = (cls, target) => {
    while (target = target.__proto__) if (target === cls) return true
    return false
  }
  const vali = (...arg) => {
    for (let i = 0, j = arg.length; i < j; i += 2) {
      if (typeof arg[i + 1] === 'function') {
        if (!arg[i + 1](arg[i])) {
          throw new Error('type에러')
        }
      }
    }
  }

  const T = {
    isFunc: v => typeof v === 'function',
    isNum: v => typeof v === 'number',
    isStr: v => typeof v === 'string',
    isBool: v => typeof v === 'boolean',
    isArr: v => Array.isArray(v),
    isDom: v => v.nodeType === 1 && v.tagName
  }

  const hbContainer = {}

  return (spec) => {
    // guard
    if (!T.isStr(spec.compName)) throw new Error('compName을 반드시 설정하셔야합니다.')

    let hb = { __proto__: Object.assign({

      with: (...specs) => specs.reduce((accu, exSpec) => Object.assign(accu, exSpec), hb),

      render (_ = vali(hb.template, T.isStr)) {
        const rootEl = document.createElement('div')

        let template = this.template
        if (this.ds !== null) {
          this.ds.forEach(compName => {
            new RegExp(`<\\s*${compName}(?:\\/>|\\s+(?:.|\\s)*?\\/>)`, `g`)
              .exec(template)
              .forEach(match => { console.log(match) })
          })
        }

        rootEl.innerHTML = template

        // guard
        if (rootEl.children.length !== 1) throw new Error('component는 단 하나의 root element로 작성하셔야 합니다.')

        this.el = rootEl.children[0]

        if (this.hasListener()) {
          Object
            .keys(this.listener)
            .forEach((key) => {
              const temp = key.split(' ')
              const selector = temp.slice(0, temp.length - 1).join('')
              const eType = temp.slice(temp.length - 1)
              const els = this.find(selector)
              const listenerBind = (el) => { el['on' + eType] = this.listener[key].bind(this) }

              T.isArr(els) ? els.forEach(listenerBind) : listenerBind(els)
            })
        }

        return this.el
      },

      find (selector, _ = vali(selector, T.isStr)) {
        const els = Array.prototype.slice.call(this.el.querySelectorAll(selector))
        return els.length === 1 ? els[0] : els
      },

      insertAt (selOrEl) {
        if (T.isStr(selOrEl)) {
          document.querySelectorAll(selOrEl).forEach(el => el.appendChild(this.render()))
        } else if (T.isDom(selOrEl)) {
          selOrEl.appendChild(this.render())
        }
      },

      hasListener () { return this.listener }

    }, spec) }

    // DI시 사용할 container에 적재한다.
    hbContainer[spec.compName] = hb

    return hb
  }
})()

const extention1 = {
  ds: ['HBComp2'],
  template: `
  <div>
    <button id='kk'>1111</button>
    <button id='kk2'>1111</button>
    <HBComp2 />
  </div>`,
  listener: {
    '#kk click' () { console.log(this.compName) },
    '#kk2 click' () { console.log(this.ds) }
  }
}

const extention2 = {
  template: `
  <div>extention2</div>
  `
}

const hbDom = Hayabusa({compName: `base3123`}).with(extention1)
const hbDom2 = Hayabusa({compName: `HBComp2`}).with(extention2)

hbDom.insertAt('#test')



// const hbDom = instance(Hayabusa, { render: () => console.log(111) })
