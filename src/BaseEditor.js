import fromEvent from 'xstream/extra/fromEvent'
import dropRepeats from 'xstream/extra/dropRepeats'
import { DataFlowGraph, ReactiveFunction as λ } from 'topologica'
import EventEmitter from 'eventemitter3'

const stateEmitter = ({ context }) => new EventEmitter()

const state$ = ({ stateEmitter }) => fromEvent(stateEmitter, 'state').compose(dropRepeats())

const buttonPanel = ({ container }) => container.querySelector('#buttonPanel')

const addIntersectionButton = ({ buttonPanel, context }) => {
  const button = buttonPanel.querySelector('#addIntersectionButton')
  button.addEventListener('click', () => context.setState('addIntersection'))
  return button
}

const cancelButton = ({ buttonPanel, context }) => {
  const button = buttonPanel.querySelector('#cancelButton')
  button.addEventListener('click', () => context.setState('ready'))
  return button
}

const addIntersection$ = ({ state$, worldClick$, worldModel, context }) => {
  return state$.filter(state => state === 'addIntersection').addListener({ next () {
    worldClick$
      .take(1)
      .endWhen(state$)
      .addListener({
        next (ev) {
          worldModel.updateState({
            intersections: [{
              id: context.nextIntersectionId(),
              x: ev.worldX,
              y: ev.worldY,
              branches: [{
                dir: [1, 0],
                w: [0.1, 0.1]
              }, {
                dir: [-1, 0],
                w: [0.1, 0.1]
              }, {
                dir: [0, -1],
                w: [0.1, 0.1]
              }]
            }]
          })
        },
        complete () {
          context.setState('ready')
        }
      })
  }})
}

const handleUIState$ = ({ state$, context }) => {
  return state$.addListener({
    next (state) {
      context.handleUIState(state)
    }
  })
}

export default class BaseEditor {
  constructor () {
    this._graph = DataFlowGraph({
      stateEmitter: λ(stateEmitter, 'context'),
      state$: λ(state$, 'stateEmitter'),
      buttonPanel: λ(buttonPanel, 'container'),
      addIntersectionButton: λ(addIntersectionButton, 'buttonPanel, context'),
      cancelButton: λ(cancelButton, 'buttonPanel, context'),
      addIntersection$: λ(addIntersection$, 'state$, worldClick$, worldModel, context'),
      handleUIState$: λ(handleUIState$, 'state$, context'),
    })
    this._graph.set({ context: this })
    this._intersectionId = 0
    return new Proxy(this, {
      set (target, name, value) {
        target._graph.set({ [name]: value })
        return true
      }
    })
  }

  set (obj) {
    this._graph.set(obj)
  }

  setState (state) {
    this._graph.get('stateEmitter').emit('state', state)
  }

  handleUIState (state) {
    const buttons = this._graph.get('buttonPanel').querySelectorAll('.btn')
    buttons.forEach(button => button.classList.remove('active'))
    const button = this._graph.get(`${state}Button`)
    if (button) {
      button.classList.add('active')
    }
  }

  nextIntersectionId () {
    this._intersectionId += 1
    return this._intersectionId
  }
}
