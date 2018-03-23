import * as d3Scale from 'd3-scale'
import Rx from 'rxjs/Rx'

import { m2d, setAttributes } from './utils'
import IntersectionSvgView from './objects/IntersectionSvgView'
import RoadSvgView from './objects/RoadSvgView'

const dim = container => container.getBoundingClientRect()

const svg = (container) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const groups = ['intersections', 'roads']
  groups.forEach((group) => {
    const groupElem = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    groupElem.classList.add(group)
    svg.appendChild(groupElem)
  })
  container.appendChild(svg)
  return svg
}

const svgClick = svg => Rx.Observable.fromEvent(svg, 'click')

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

const worldClick = (ev, scaleX, scaleY) => ({
  worldX: scaleX.invert(ev.offsetX),
  worldY: scaleY.invert(ev.offsetY)
})

const intersection = (worldModel) => Rx.Observable.fromEvent(worldModel, 'addedIntersection')

const intersectionView = (intersection, intersections, svg) => {
  const view = new IntersectionSvgView()
  view.model = intersection
  intersections.push(view)
  const intersectionsGroup = svg.querySelector('g.intersections')
  intersectionsGroup.appendChild(view.svg)
  return view
}

const road = (worldModel) => Rx.Observable.fromEvent(worldModel, 'addedRoad')

const roadView = (road, roads, svg) => {
  const view = new RoadSvgView()
  view.model = road
  roads.push(view)
  const roadsGroup = svg.querySelector('g.roads')
  roadsGroup.appendChild(view.svg)
  return view
}

const resizeSvg = (svg, dim) => setAttributes(svg, { width: dim.width, height: dim.height })

const rescaleView = (view, scaleX, scaleY) => {
  view.scaleX = scaleX
  view.scaleY = scaleY
}

export default class SvgView {
  constructor () {
    this.container$ = new Rx.Subject()
    this.worldCoordinates$ = new Rx.Subject()
    this.zoom$ = new Rx.Subject()
    this.worldModel$ = new Rx.Subject()
    this.intersections$ = new Rx.BehaviorSubject([])
    this.roads$ = new Rx.BehaviorSubject([])
    this.dim$ = this.container$.map(dim)
    this.svg$ = this.container$.map(svg).share()
    this.svgClick$ = this.svg$.switchMap(svgClick)
    this.scaleD$ = this.dim$.combineLatest(this.zoom$, scaleD)
    this.scaleX$ = this.dim$.combineLatest(this.worldCoordinates$, this.scaleD$, scaleX)
    this.scaleY$ = this.dim$.combineLatest(this.worldCoordinates$, this.scaleD$, scaleY)
    this.worldClick$ = this.svgClick$.withLatestFrom(this.scaleX$, this.scaleY$, worldClick).share()
    this.intersection$ = this.worldModel$.switchMap(intersection)
    this.intersectionView$ = this.intersection$.withLatestFrom(this.intersections$, this.svg$, intersectionView)
    this.road$ = this.worldModel$.switchMap(road)
    this.roadView$ = this.road$.withLatestFrom(this.roads$, this.svg$, roadView)

    this.svg$.combineLatest(this.dim$, resizeSvg).subscribe()
    this.worldClick$.subscribe()
    this.intersectionView$.combineLatest(this.scaleX$, this.scaleY$, rescaleView).subscribe()
    this.roadView$.combineLatest(this.scaleX$, this.scaleY$, rescaleView).subscribe()
  }

  set container (value) {
    this.container$.next(value)
  }

  set worldCoordinates (value) {
    this.worldCoordinates$.next(value)
  }

  set zoom (value) {
    this.zoom$.next(value)
  }

  set worldModel (value) {
    this.worldModel$.next(value)
  }

  get worldClickStream () {
    return this.worldClick$
  }
}
