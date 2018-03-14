import fromEvent from 'xstream/extra/fromEvent'
import * as d3Scale from 'd3-scale'
import * as d3Selection from 'd3-selection'
import { DataFlowGraph, ReactiveFunction as λ } from 'topologica'

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

const scaleX = ({ dim, worldViewport }) => {
  const scale = d3Scale.scaleLinear()
    .domain([worldViewport[0][0], worldViewport[1][0]])
    .range([0, dim.width])
  return scale
}

const scaleY = ({ dim, worldViewport }) => {
  const scale = d3Scale.scaleLinear()
    .domain([worldViewport[0][1], worldViewport[1][1]])
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
      scaleX: λ(scaleX, 'dim, worldViewport'),
      scaleY: λ(scaleY, 'dim, worldViewport'),
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

    const intersectionsSvg = d3Selection
      .select(svg)
      .select('.intersections')
      .selectAll('.intersection')
      .data(intersections, d => d.id)
    intersectionsSvg.enter()
      .append('g')
      .attr('class', 'intersection')
      .append('circle')
      .attr('cx', d => scaleX(d.x))
      .attr('cy', d => scaleY(d.y))
      .attr('r', 5)
  }

  handleStateUpdate (state) {
    Object.keys(state).forEach(key => this[`${key}Update`](state[key]))
  }
}
