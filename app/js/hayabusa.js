const Hayabusa = (_ => {
  const toArray = s => Array.prototype.slice.call(s)
  const groupBy = (arr, hashF) => {
    if (arr === null) return []
    const groups = {}
    arr.forEach((el) => {
      const key = hashF(el)
      if (!(key in groups)) groups[key] = []
      groups[key].push(el)
    })
    return Object
            .keys(groups)
            .map(key => { return { key: key, values: groups[key] } })
  }

  const propsGet = {
    literal (attr) {
      let [key, val] = attr.split(`=`)
      val = /(['|"]).*\1/g.test(val) ? val.slice(1).slice(0, val.length - 2)
          : val === 'true' ? true
          : val === 'false' ? false
          : !isNaN(parseInt(val)) ? Number(val)
          : val
      return {[key]: val}
    },
    obj (attr) {
      let [key, val] = attr.split(`=`)
      val = val.slice(1).slice(0, val.length - 2)
      val = /[\w\d\[\]\.'"]+/.test(val) ? eval(val) : null  // !주의 - eval이 사용되었음.
      return {[key]: val}
    },
    spread (spread) {
      let val = spread.slice(4).slice(0, spread.length - 5)
      val = /[\w\d\[\]\.'"]+/.test(val) ? eval(val) : null  // !주의 - eval이 사용되었음.
      val = Object.keys(val) !== 0 ? val : null
      return val
    }
  }

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

      makeEl () {
        const rootEl = document.createElement('div')

        let template = this.render()
        let props = null
        let inc = 0
        if (this.ds !== null && this.ds !== undefined) {
          props = {}
          // template에서 dependancy로 설정된 single tag를 찾는다.
          this.ds.forEach(compName => {
            const regx = new RegExp(`<\\s*${compName}(?:\\/>|\\s+(?:.|\\s)*?\\/>)`, `g`)
            // component tag를 일반 div로 바꿔놓는다.
            template = template.replace(regx, (compTag) => {
              inc += 1
              // 여기서 props를 취득한다.
              props[`${compName}$$${inc}`] = groupBy(
                compTag.match(/{\.\.\..+?}|(\w*=(["|']*).+?\2|{.+})(?=\s|(?=>)|(?=\/>))/g),
                attr => attr.slice(0, 4) === '{...' ? 'spread'
                     : /{.+}/g.test(attr.split(`=`)[1]) ? 'obj'
                     : 'literal'
              ).map(group => group.values
                              .map(attr => propsGet[group.key].bind(this)(attr))
                              .reduce((accu, curr) => Object.assign(accu, curr))
              ).reduce((accu, curr) => Object.assign(accu, curr), {})

              return `<div hb-dom='${compName}$$${inc}'></div>`
            })
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

        if (props !== null) {
          Object.keys(props).forEach(compName => {
            const [realCompName] = compName.split('$$')
            const dummyEl = this.el.querySelector(`div[hb-dom='${compName}']`)
            const hb = hbContainer[realCompName]
            const el = Object.assign(hb, props[compName]).makeEl()
            dummyEl.parentNode.replaceChild(el, dummyEl)
          })
        }

        return this.el
      },

      render (_ = vali(this.template, T.isStr)) {
        return this.template
      },

      find (selector, _ = vali(selector, T.isStr)) {
        const els = toArray(this.el.querySelectorAll(selector))
        return els.length === 1 ? els[0] : els
      },

      insertAt (selOrEl) {
        if (T.isStr(selOrEl)) {
          document.querySelectorAll(selOrEl)
                  .forEach(el => el.appendChild(this.makeEl()))
        } else if (T.isDom(selOrEl)) {
          selOrEl.appendChild(this.makeEl())
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
  name: 'kang',
  obj: { obj_name : 'spread1', obj_age : 38 },
  ds: ['HBComp2'],
  template: `
  <div>
    <button id='kk'>1111</button>
    <button id='kk2'>1111</button>
    <HBComp2 />
    <HBComp2 id='111' url="http://yanolja.com" num=3 name=강승철
    test1="true" test2=true test3='' name2={this.name} {...this.obj}/>
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

const hbDom2 = Hayabusa({compName: `HBComp2`}).with(extention2)
const hbDom = Hayabusa({compName: `base3123`}).with(extention1)

hbDom.insertAt('#test')



// const hbDom = instance(Hayabusa, { render: () => console.log(111) })
