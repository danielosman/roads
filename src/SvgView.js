import xs from 'xstream'
import fromEvent from 'xstream/extra/fromEvent'
import * as d3Scale from 'd3-scale'
import * as d3Selection from 'd3-selection'
import ReactiveModel from 'reactive-model'
import { lineString } from '@turf/helpers'
import lineOffset from '@turf/line-offset'

import { m2d, setAttributes, isFunction } from './utils'

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

const newIntersection = (worldModel, svg, scaleX, scaleY, done) => {
  worldModel.addListener('addedIntersection', intersection => {
    console.log('newIntersection: ', intersection)
    done(intersection)
    renderNewIntersection(intersection, svg, scaleX, scaleY)
  })
}

const updateWorldClick$ = (worldClick$, svgClick$, scaleX, scaleY) => {
  const stream = svgClick$.map(ev => ({
    worldX: scaleX.invert(ev.offsetX),
    worldY: scaleY.invert(ev.offsetY)
  }))
  worldClick$.imitate(stream)
}

const updateHandlers = {
  intersectionsUpdate (intersections, svg, scaleX, scaleY) {
    intersections.forEach((intersection) => {
      intersection.branches.forEach((branch) => {
        const dist = m2d(25)
        const dir = branch.dir
        branch.handle = [
          [intersection.x, intersection.y],
          [intersection.x + dist * dir[0], intersection.y + dist * dir[1]]
        ]
        const line = lineString(branch.handle)
        const borders = [
          lineOffset(line, branch.w[0], { units: 'degrees' }),
          lineOffset(line, -branch.w[1], { units: 'degrees' })
        ]
        branch.borders = borders.map(b => b.geometry.coordinates)
      })
    })

    const intersectionsSvg = d3Selection
      .select(svg)
      .select('.intersections')
      .selectAll('.intersection')
      .data(intersections, d => d.id)
    const gEnter = intersectionsSvg.enter()
      .append('g')
      .attr('class', 'intersection')
    gEnter
      .append('circle')
      .attr('cx', d => scaleX(d.x))
      .attr('cy', d => scaleY(d.y))
      .attr('r', 3)
    const branchesSvg = gEnter.selectAll('g.branch').data(d => d.branches)
    const branchEnter = branchesSvg.enter()
      .append('g')
      .attr('class', 'branch')
    branchEnter
      .append('line')
      .attr('class', 'handle')
      .attr('x1', d => scaleX(d.handle[0][0]))
      .attr('y1', d => scaleY(d.handle[0][1]))
      .attr('x2', d => scaleX(d.handle[1][0]))
      .attr('y2', d => scaleY(d.handle[1][1]))
    const borderSvg = branchEnter.selectAll('line.border').data(d => d.borders)
    const borderEnter = borderSvg.enter()
      .append('line')
      .attr('class', 'border')
      .attr('x1', d => scaleX(d[0][0]))
      .attr('y1', d => scaleY(d[0][1]))
      .attr('x2', d => scaleX(d[1][0]))
      .attr('y2', d => scaleY(d[1][1]))

  }
}

const renderNewIntersection = (newIntersection, svg, scaleX, scaleY) => {
  console.log('renderNewIntersection')
  const g = d3Selection.select(svg).select('g.intersections')
  const elem = g.select(`#${newIntersection.cid}`)
  if (!elem.empty()) return
  g.append('g').attr('class', 'intersection')
}


export default class SvgView {
  constructor () {
    this._graph = ReactiveModel()
      ('container')
      ('worldCoordinates')
      ('zoom')
      ('worldModel')
      ('worldClick$', xs.create())
      ('dim', dim, 'container')
      ('svg', svg, 'container')
      ('resizeSvg', resizeSvg, 'svg, dim')
      ('svgClick$', svgClick$, 'svg')
      ('scaleD', scaleD, 'dim, zoom')
      ('scaleX', scaleX, 'dim, worldCoordinates, scaleD')
      ('scaleY', scaleY, 'dim, worldCoordinates, scaleD')
      ('newIntersection', newIntersection, 'worldModel, svg, scaleX, scaleY')
      (updateWorldClick$, 'worldClick$, svgClick$, scaleX, scaleY')
      (renderNewIntersection, 'newIntersection, svg, scaleX, scaleY')
      
    ReactiveModel.digest()
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
