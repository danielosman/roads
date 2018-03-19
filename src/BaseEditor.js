import fromEvent from 'xstream/extra/fromEvent'
import dropRepeats from 'xstream/extra/dropRepeats'
import ReactiveModel from 'reactive-model'
import EventEmitter from 'eventemitter3'

import IntersectionModel from './objects/IntersectionModel'

const state$ = (stateEmitter) => fromEvent(stateEmitter, 'state').compose(dropRepeats())

const buttonPanel = (container) => container.querySelector('#buttonPanel')

const addIntersectionButton = (buttonPanel, stateEmitter) => {
  const button = buttonPanel.querySelector('#addIntersectionButton')
  button.addEventListener('click', () => stateEmitter.emit('state', 'addIntersection'))
  return button
}

const cancelButton = (buttonPanel, stateEmitter) => {
  const button = buttonPanel.querySelector('#cancelButton')
  button.addEventListener('click', () => stateEmitter.emit('state', 'ready'))
  return button
}

const newIntersection = (state$, worldClick$, stateEmitter, done) => {
  state$.filter(state => state === 'addIntersection').addListener({ next () {
    worldClick$.take(1).endWhen(state$).addListener({
      next (ev) {
        const intersection = new IntersectionModel()
        intersection.buildDefault()
        intersection.x = ev.worldX
        intersection.y = ev.worldY
        done(intersection)
      },
      complete () {
        stateEmitter.emit('state', 'ready')
      }
    })
  }})
}

const handleNewIntersection = (newIntersection, worldModel) => {
  newIntersection.buildPolygon()
  worldModel.addIntersection(newIntersection)
}

const handleUIState = (state$, buttonPanel) => {
    state$.addListener({
      next (state) {
        const allButtons = buttonPanel.querySelectorAll('.btn')
        allButtons.forEach(button => button.classList.remove('active'))
        const stateButtons = buttonPanel.querySelectorAll(`.btn.${state}-state`)
        stateButtons.forEach(button => button.classList.add('active'))
      }
    })
  }

export default class BaseEditor extends EventEmitter {
  constructor () {
    super()
    this._graph = ReactiveModel()
      ('container')
      ('worldClick$')
      ('worldModel')
      ('stateEmitter', this)
      ('state$', state$, 'stateEmitter')
      ('buttonPanel', buttonPanel, 'container')
      ('addIntersectionButton', addIntersectionButton, 'buttonPanel, stateEmitter')
      ('cancelButton', cancelButton, 'buttonPanel, stateEmitter')
      ('newIntersection', newIntersection, 'state$, worldClick$, stateEmitter')
      (handleNewIntersection, 'newIntersection, worldModel')
      (handleUIState, 'state$, buttonPanel')

    //ReactiveModel.digest()
  }

  set container (value) {
    this._set('container', value)
  }

  set worldClick$ (value) {
    this._set('worldClick$', value)
  }

  set worldModel (value) {
    this._set('worldModel', value)
  }

  _set (name, value) {
    this._graph[name](value)
    ReactiveModel.digest()
  }
}
