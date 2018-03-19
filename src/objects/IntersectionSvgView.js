import ReactiveModel from 'reactive-model'
import EventEmitter from 'eventemitter3'
import fromEvent from 'xstream/extra/fromEvent'
import sampleCombine from 'xstream/extra/sampleCombine'
import SVG from 'svg.js'
import draggable from 'svg.draggable.js'

import { normalize } from '../utils'

const svg = (model) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  svg.setAttribute('id', model.cid)
  svg.classList.add('intersection')
  return svg
}

const model$ = (initialModel) => {
  return fromEvent(initialModel, 'changed').startWith(initialModel)
}

const branchCircleElems$ = (emitter) => {
  return fromEvent(emitter, 'branchCircleElems').startWith([])
}

const model = (model$, done) => {
  model$.addListener({ next: (model) => {
    console.log('Model changed: ', model)
    setTimeout(() => {
      done(model)
    }, 0)
  }})
}

const point = (model, scaleX, scaleY) => [scaleX(model.x), scaleY(model.y)]

const polygon = svg => SVG.adopt(svg).polygon()

const branchCircleElems = (model$, branchCircleElems$, svg, emitter, done) => {
  model$.compose(sampleCombine(branchCircleElems$)).addListener({
    next([model, branchCircleElems]) {
      const g = SVG.adopt(svg)
      const newElems = []
      model.branches.forEach((branch, i) => {
        if (!branchCircleElems[i]) {
          const circle = g.circle().draggable()
          circle.on('dragend', (ev) => {
            emitter.emit('branchCircleMoved', { branchIndex: i, p: ev.detail.p })
          })
          newElems.push(circle)
        } else {
          newElems.push(branchCircleElems[i])
        }
      })
      emitter.emit('branchCircleElems', newElems)
      done(newElems)
    }
  })
}

const branchCircleMoved = (emitter, done) => {
  emitter.addListener('branchCircleMoved', (move) => {
    console.log('branchCircleMoved: ', move)
    done(move)
  })
}

const handleChangedBranchDir = (branchCircleMoved, point, model) => {
  const dir = normalize([branchCircleMoved.p.x - point[0], branchCircleMoved.p.y - point[1]])
  console.log('handleChangedBranchDir')
  model.changeBranchDir(branchCircleMoved.branchIndex, dir)
}

const renderIntersection = (polygon, model, scaleX, scaleY) => {
  console.log('renderIntersection: ', model)
  polygon.plot(model.scaledPolygon(scaleX, scaleY))
}

const renderBranchCircles = (branchCircleElems, model, scaleX, scaleY) => {
  const scaledBranchCircles = model.scaledBranchCircles(scaleX, scaleY)
  branchCircleElems.forEach((circle, i) => {
    const scaledCircle = scaledBranchCircles[i]
    circle.cx(scaledCircle.cx).cy(scaledCircle.cy).radius(3)
  })
}


export default class IntersectionSvgView extends EventEmitter {
  constructor () {
    super()
    this._graph = ReactiveModel()
      ('initialModel')
      ('scaleX')
      ('scaleY')
      ('emitter', this)
      ('svg', svg, 'initialModel')
      ('model$', model$, 'initialModel')
      ('branchCircleElems$', branchCircleElems$, 'emitter')
      ('model', model, 'model$')
      ('point', point, 'initialModel, scaleX, scaleY')
      ('polygon', polygon, 'svg')
      ('branchCircleElems', branchCircleElems, 'model$, branchCircleElems$, svg, emitter')
      ('branchCircleMoved', branchCircleMoved, 'emitter')
      (handleChangedBranchDir, 'branchCircleMoved, point, initialModel')
      (renderIntersection, 'polygon, model, scaleX, scaleY')
      (renderBranchCircles, 'branchCircleElems, model, scaleX, scaleY')
  }

  set model (value) {
    this._set('initialModel', value)
  }

  set scaleX (value) {
    this._set('scaleX', value)
  }

  set scaleY (value) {
    this._set('scaleY', value)
  }

  setScales (scaleX, scaleY) {
    this._graph.scaleX(scaleX).scaleY(scaleY)
    ReactiveModel.digest()
  }

  get svg () {
    return this._graph.svg()
  }

  _set (name, value) {
    this._graph[name](value)
    ReactiveModel.digest()
  }
}
