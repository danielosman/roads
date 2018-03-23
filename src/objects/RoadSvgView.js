import EventEmitter from 'eventemitter3'
import Rx from 'rxjs/Rx'
import SVG from 'svg.js'
import 'svg.draggable.js'

const svg = (model) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  svg.setAttribute('id', model.cid)
  svg.classList.add('road')
  return svg
}

const model = (initialModel) => {
  return Rx.Observable.fromEvent(initialModel, 'changed').startWith(initialModel)
}

const lineNodeElems = (previousLineNodeElems, [model, svg]) => {
  const g = SVG.adopt(svg)
  const newElems = []
  model.points.forEach((point, i) => {
    if (!previousLineNodeElems[i]) {
      const circle = g.circle().draggable()
      circle.on('dragend', (ev) => {
        model.emit('lineNodeMoved', { nodeIndex: i, p: ev.detail.p })
      })
      newElems.push(circle)
    } else {
      newElems.push(previousLineNodeElems[i])
    }
  })
  return newElems
}

const polygon = svg => SVG.adopt(svg).polygon()

const lineNodeMoved = ([model, scaleX, scaleY]) => {
  return Rx.Observable
    .fromEvent(model, 'lineNodeMoved')
    .map(move => model.moveLineNode(move.nodeIndex, scaleX.invert(move.p.x), scaleY.invert(move.p.y)))
}

const renderRoad = (model, polygon, scaleX, scaleY) => {
  polygon.plot(model.scaledPolygon(scaleX, scaleY))
}

const renderLineNodes = (lineNodeElems, model, scaleX, scaleY) => {
  const scaledLineNodes = model.scaledLineNodes(scaleX, scaleY)
  lineNodeElems.forEach((elem, i) => {
    const scaledCircle = scaledLineNodes[i]
    elem.cx(scaledCircle.cx).cy(scaledCircle.cy).radius(scaledCircle.r)
  })
}

export default class RoadSvgView extends EventEmitter {
  constructor () {
    super()
    this.initialModel$ = new Rx.Subject()
    this.scaleX$ = new Rx.Subject()
    this.scaleY$ = new Rx.Subject()
    this.svg$ = this.initialModel$.map(svg).share()
    this.model$ = this.initialModel$.switchMap(model).share()
    this.lineNodeElems$ = this.model$.withLatestFrom(this.svg$).scan(lineNodeElems, [])
    this.polygon$ = this.svg$.map(polygon)

    this.svg$.subscribe(svg => this._svg = svg) // eslint-disable-line no-return-assign
    this.model$.withLatestFrom(this.scaleX$, this.scaleY$).switchMap(lineNodeMoved).subscribe()
    this.model$.combineLatest(this.polygon$, this.scaleX$, this.scaleY$, renderRoad).subscribe()
    this.lineNodeElems$.combineLatest(this.model$, this.scaleX$, this.scaleY$, renderLineNodes).subscribe()
  }

  set model (value) {
    this.initialModel$.next(value)
  }

  set scaleX (value) {
    this.scaleX$.next(value)
  }

  set scaleY (value) {
    this.scaleY$.next(value)
  }

  get svg () {
    return this._svg
  }

  subscribeSvg (done) {
    this.svg$.subscribe(done)
  }
}
