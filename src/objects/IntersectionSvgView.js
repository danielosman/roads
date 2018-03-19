import ReactiveModel from 'reactive-model'
import SVG from 'svg.js'
import draggable from 'svg.draggable.js'

import { normalize } from '../utils'

const point = (model, scaleX, scaleY) => [scaleX(model.x), scaleY(model.y)]

const svg = (model) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  svg.setAttribute('id', model.cid)
  svg.classList.add('intersection')
  return svg
}

const polygon = svg => SVG.adopt(svg).polygon()

const branchCircles = (svg, model) => {
  const g = SVG.adopt(svg)
  const circles = []
  model.branches.forEach((branch) => {
    const circle = g.circle().draggable()
    circles.push(circle)
  })
  return circles
}

const branchCircleMoved = (branchCircles, done) => {
  branchCircles.forEach((circle, i) => {
    circle.on('dragend', (ev) => {
      done({ i, p: ev.detail.p })
    })
  })
}

const changedBranchDir = (branchCircleMoved, point) => {
  const dir = normalize([point[0] - branchCircleMoved.p.x, point[1] - branchCircleMoved.p.y])
  return { i: branchCircleMoved.i, dir }
}

const renderIntersection = (polygon, model, scaleX, scaleY) => {
  polygon.plot(model.scaledPolygon(scaleX, scaleY))
  polygon.draggable()
}

const renderBranchCircles = (branchCircles, model, scaleX, scaleY) => {
  const scaledBranchCircles = model.scaledBranchCircles(scaleX, scaleY)
  branchCircles.forEach((circle, i) => {
    const scaledCircle = scaledBranchCircles[i]
    circle.cx(scaledCircle.cx).cy(scaledCircle.cy).radius(3)
  })
}


export default class IntersectionSvgView {
  constructor () {
    this._graph = ReactiveModel()
      ('model')
      ('scaleX')
      ('scaleY')
      ('svg', svg, 'model')
      ('point', point, 'model, scaleX, scaleY')
      ('polygon', polygon, 'svg')
      ('branchCircles', branchCircles, 'svg, model')
      ('branchCircleMoved', branchCircleMoved, 'branchCircles')
      ('changedBranchDir', changedBranchDir, 'branchCircleMoved, point')
      (renderIntersection, 'polygon, model, scaleX, scaleY')
      (renderBranchCircles, 'branchCircles, model, scaleX, scaleY')
  }

  set model (value) {
    this._set('model', value)
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
