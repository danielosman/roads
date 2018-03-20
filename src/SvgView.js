import xs from 'xstream'
import fromEvent from 'xstream/extra/fromEvent'
import * as d3Scale from 'd3-scale'
import * as d3Selection from 'd3-selection'
import ReactiveModel from 'reactive-model'

import { m2d, setAttributes } from './utils'
import IntersectionSvgView from './objects/IntersectionSvgView'

const dim = container => container.getBoundingClientRect()

const svg = (container) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const intersections = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  intersections.classList.add('intersections')
  svg.appendChild(intersections)
  container.appendChild(svg)
  return svg
}

const resizeSvg = (svg, dim) => setAttributes(svg, { width: dim.width, height: dim.height } )

const svgClick$ = svg => fromEvent(svg, 'click')

const scaleD = (dim, zoom) => d3Scale.scaleLinear()
  .domain([0, zoom * m2d(dim.width)])
  .range([0, dim.width])

const scaleX = (dim, worldCoordinates, scaleD) => {
  const w2 = dim.width / 2.0
  const xMid = worldCoordinates[0]
  const scale = d3Scale.scaleLinear()
    .domain([xMid - scaleD.invert(w2), xMid + scaleD.invert(w2)])
    .range([0, dim.width])
  return scale
}

const scaleY = (dim, worldCoordinates, scaleD) => {
  const h2 = dim.height / 2.0
  const yMid = worldCoordinates[1]
  const scale = d3Scale.scaleLinear()
    .domain([yMid - scaleD.invert(h2), yMid + scaleD.invert(h2)])
    .range([0, dim.height])
  return scale
}

const newIntersection = (worldModel, done) => {
  worldModel.addListener('addedIntersection', intersection => {
    setTimeout(() => { done(intersection) }, 0)
  })
}

const newIntersectionView = (newIntersection, intersections, svg) => {
  const view = new IntersectionSvgView()
  view.model = newIntersection
  intersections.push(view)
  const intersectionsGroup = svg.querySelector('g.intersections')
  /*
  view.subscribeSvg((g) => {
    console.log('Got G')
    intersectionsGroup.appendChild(g)
  })
  */
  intersectionsGroup.appendChild(view.svg)
  return view
}

const updateWorldClick$ = (worldClick$, svgClick$, scaleX, scaleY) => {
  const stream = svgClick$.map(ev => ({
    worldX: scaleX.invert(ev.offsetX),
    worldY: scaleY.invert(ev.offsetY)
  }))
  worldClick$.imitate(stream)
}

const renderNewIntersection = (newIntersectionView, scaleX, scaleY) => {
  // newIntersectionView.setScales(scaleX, scaleY)
  newIntersectionView.scaleX = scaleX
  newIntersectionView.scaleY = scaleY
}


export default class SvgView {
  constructor () {
    this._graph = ReactiveModel()
      ('container')
      ('worldCoordinates')
      ('zoom')
      ('worldModel')
      ('worldClick$', xs.create())
      ('intersections', [])
      ('dim', dim, 'container')
      ('svg', svg, 'container')
      ('resizeSvg', resizeSvg, 'svg, dim')
      ('svgClick$', svgClick$, 'svg')
      ('scaleD', scaleD, 'dim, zoom')
      ('scaleX', scaleX, 'dim, worldCoordinates, scaleD')
      ('scaleY', scaleY, 'dim, worldCoordinates, scaleD')
      ('newIntersection', newIntersection, 'worldModel')
      ('newIntersectionView', newIntersectionView, 'newIntersection, intersections, svg')
      (renderNewIntersection, 'newIntersectionView, scaleX, scaleY')
      (updateWorldClick$, 'worldClick$, svgClick$, scaleX, scaleY')
  }

  set container (value) {
    this._set('container', value)
  }

  set worldCoordinates (value) {
    this._set('worldCoordinates', value)
  }

  set zoom (value) {
    this._set('zoom', value)
  }

  set worldModel (value) {
    this._set('worldModel', value)
  }

  get worldClick$ () {
    return this._graph.worldClick$()
  }

  _set (name, value) {
    this._graph[name](value)
    ReactiveModel.digest()
  }
}
