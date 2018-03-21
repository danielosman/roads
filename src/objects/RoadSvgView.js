import EventEmitter from 'eventemitter3'
import Rx from 'rxjs/Rx'
import SVG from 'svg.js'
import draggable from 'svg.draggable.js'

const svg = (model) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  svg.setAttribute('id', model.cid)
  svg.classList.add('road')
  return svg
}

const model = (initialModel) => {
  return Rx.Observable.fromEvent(initialModel, 'changed').startWith(initialModel)
}

const branchCircleElems$ = (previousBranchCircleElems, [model, svg]) => {
  const g = SVG.adopt(svg)
  const newElems = []
  model.branches.forEach((branch, i) => {
    if (!previousBranchCircleElems[i]) {
      const circle = g.circle().draggable()
      circle.on('dragend', (ev) => {
        model.emit('branchCircleMoved', { branchIndex: i, p: ev.detail.p })
      })
      newElems.push(circle)
    } else {
      newElems.push(previousBranchCircleElems[i])
    }
  })
  return newElems
}

const point = (model, scaleX, scaleY) => [scaleX(model.x), scaleY(model.y)]

const polygon = svg => SVG.adopt(svg).polygon()

const branchCircleMoved$ = (initialModel) => {
  return Rx.Observable.fromEvent(initialModel, 'branchCircleMoved')
}

const handleChangedBranchDir = ([branchCircleMoved, point, model]) => {
  const dir = normalize([branchCircleMoved.p.x - point[0], branchCircleMoved.p.y - point[1]])
  model.changeBranchDir(branchCircleMoved.branchIndex, dir)
}

const renderRoad = (model, polygon, scaleX, scaleY) => {
  polygon.plot(model.scaledPolygon(scaleX, scaleY))
}

const renderBranchCircles = ([branchCircleElems, model, scaleX, scaleY]) => {
  const scaledBranchCircles = model.scaledBranchCircles(scaleX, scaleY)
  branchCircleElems.forEach((circle, i) => {
    const scaledCircle = scaledBranchCircles[i]
    circle.cx(scaledCircle.cx).cy(scaledCircle.cy).radius(scaledCircle.r)
  })
}

export default class RoadSvgView extends EventEmitter {
  constructor () {
    super()
    this.initialModel$ = new Rx.Subject()
    this.scaleX$ = new Rx.Subject()
    this.scaleY$ = new Rx.Subject()
    this.svg$ = this.initialModel$.map(svg).share()
    this.model$ = this.initialModel$.switchMap(model)
    //this.branchCircleElems$ = this.model$.withLatestFrom(this.svg$).scan(branchCircleElems$, [])
    this.point$ = this.model$.combineLatest(this.scaleX$, this.scaleY$, point)
    this.polygon$ = this.svg$.map(polygon)
    //this.branchCircleMoved$ = this.initialModel$.switchMap(branchCircleMoved$)

    this.svg$.subscribe(svg => this._svg = svg)
    //this.branchCircleMoved$
    //  .withLatestFrom(this.point$, this.model$)
    //  .subscribe(handleChangedBranchDir)
    this.model$.combineLatest(this.polygon$, this.scaleX$, this.scaleY$, renderRoad).subscribe()
    //this.branchCircleElems$
    //  .combineLatest(this.model$, this.scaleX$, this.scaleY$)
    //  .subscribe(renderBranchCircles)
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
