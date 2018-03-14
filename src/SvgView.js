import fromEvent from 'xstream/extra/fromEvent'
import * as d3Scale from 'd3-scale'
import * as d3Selection from 'd3-selection'
import { DataFlowGraph, ReactiveFunction as λ } from 'topologica'
import { lineString } from '@turf/helpers'
import lineOffset from '@turf/line-offset'

const dim = ({ container }) => container.getBoundingClientRect()

const svg = ({ container }) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const intersections = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  intersections.classList.add('intersections')
  svg.appendChild(intersections)
  container.appendChild(svg)
  return svg
}

const setAttributes = (elem, attrs) => {
  Object.keys(attrs).forEach(attr => elem.setAttribute(attr, attrs[attr]))
  return elem
}

const resizeSvg = ({ svg, dim }) => setAttributes(svg, { width: dim.width, height: dim.height } )

const svgClick$ = ({ svg }) => fromEvent(svg, 'click')

const scaleD = ({ dim, worldViewport }) => {
  const scale = d3Scale.scaleLinear()
    .domain([0, worldViewport[1][0] - worldViewport[0][0]])
    .range([0, dim.width])
  return scale
}

const scaleX = ({ dim, worldViewport }) => {
  const scale = d3Scale.scaleLinear()
    .domain([worldViewport[0][0], worldViewport[1][0]])
    .range([0, dim.width])
  return scale
}

const scaleY = ({ dim, worldViewport, scaleD }) => {
  const h2 = dim.height / 2.0
  const yMid = (worldViewport[1][1] - worldViewport[0][1]) / 2.0
  const scale = d3Scale.scaleLinear()
    .domain([yMid - scaleD.invert(h2), yMid + scaleD.invert(h2)])
    .range([0, dim.height])
  return scale
}

const worldClick$ = ({ svgClick$, scaleX, scaleY, context }) => {
  let stream = context.getWorldClick$()
  if (!stream) {
    stream = svgClick$.map(ev => {
      console.log(ev)
      return {
        worldX: scaleX.invert(ev.offsetX),
        worldY: scaleY.invert(ev.offsetY)
      }
    })
    context.setWorldClick$(stream)
  }
  return stream
}

const worldModelUpdate$ = ({ worldModel, context }) => {
  const stream = fromEvent(worldModel, 'update')
  stream.addListener({
    next (state) {
      context.handleStateUpdate(state)
    }
  })
  return stream
}


export default class SvgView {
  constructor () {
    this._graph = DataFlowGraph({
      dim: λ(dim, 'container'),
      svg: λ(svg, 'container'),
      resizeSvg: λ(resizeSvg, 'svg, dim'),
      svgClick$: λ(svgClick$, 'svg'),
      scaleD: λ(scaleX, 'dim, worldViewport'),
      scaleX: λ(scaleX, 'dim, worldViewport'),
      scaleY: λ(scaleY, 'dim, worldViewport, scaleD'),
      worldClick$: λ(worldClick$, 'svgClick$, scaleX, scaleY, context'),
      worldModelUpdate$: λ(worldModelUpdate$, 'worldModel, context'),
    })
    this._graph.set({ context: this })
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

  setWorldClick$ (stream) {
    this._worldClick$ = stream
  }

  getWorldClick$ () {
    return this._worldClick$
  }

  intersectionsUpdate (intersections) {
    const svg = this._graph.get('svg')
    const scaleX = this._graph.get('scaleX')
    const scaleY = this._graph.get('scaleY')

    intersections.forEach((intersection) => {
      intersection.branches.forEach((branch) => {
        branch.handle = [
          [intersection.x, intersection.y],
          [intersection.x + branch.dir[0], intersection.y + branch.dir[1]]
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

  handleStateUpdate (state) {
    Object.keys(state).forEach(key => this[`${key}Update`](state[key]))
  }
}
