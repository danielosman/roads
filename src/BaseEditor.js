import EventEmitter from 'eventemitter3'
import Rx from 'rxjs/Rx'

import IntersectionModel from './objects/IntersectionModel'
import RoadModel from './objects/RoadModel'

const buttonPanel = (container) => container.querySelector('#buttonPanel')

const addIntersectionButton = (state$) => {
  return (buttonPanel) => {
    const button = buttonPanel.querySelector('#addIntersectionButton')
    button.addEventListener('click', () => state$.next('addIntersection'))
    return button
  }
}

const addRoadButton = (state$) => {
  return (buttonPanel) => {
    const button = buttonPanel.querySelector('#addRoadButton')
    button.addEventListener('click', () => state$.next('addRoad'))
    return button
  }
}

const cancelButton = (state$) => {
  return (buttonPanel) => {
    const button = buttonPanel.querySelector('#cancelButton')
    button.addEventListener('click', () => state$.next('ready'))
    return button
  }
}

const newIntersection = (worldClick$, state$, stateChanged$) => {
  return () => {
    const stream = worldClick$.take(1).takeUntil(stateChanged$).map((ev) => {
      const intersection = new IntersectionModel()
      intersection.buildDefault()
      intersection.x = ev.worldX
      intersection.y = ev.worldY
      return intersection
    }).share()
    stream.subscribe({ complete: () => state$.next('ready') })
    return stream
  }
}

const newRoad = (worldClick$, state$, stateChanged$) => {
  return () => {
    const stream = worldClick$.take(1).takeUntil(stateChanged$).map((ev) => {
      const road = new RoadModel()
      road.buildDefault()
      road.points.push([ev.worldX, ev.worldY])
      return road
    }).share()
    stream.subscribe({ complete: () => state$.next('editRoad') })
    return stream
  }
}

const editRoad = (worldClick$, state$, stateChanged$) => {
  return () => {
    const stream = worldClick$.takeUntil(stateChanged$).map(ev => [ev.worldX, ev.worldY]).share()
    stream.subscribe({ complete: () => state$.next('ready') })
    return stream
  }
}

const handleNewIntersection = (newIntersection, worldModel) => {
  newIntersection.buildPolygon()
  worldModel.addIntersection(newIntersection)
}

const handleNewRoad = (newRoad, worldModel) => {
  newRoad.buildPolygon()
  worldModel.addRoad(newRoad)
}

const handleNewRoadPoint = (point, road) => road.addPoint(point)

const handleUIState = (state, buttonPanel) => {
  const allButtons = buttonPanel.querySelectorAll('.btn')
  allButtons.forEach(button => button.classList.remove('active'))
  const stateButtons = buttonPanel.querySelectorAll(`.btn.${state}-state`)
  stateButtons.forEach(button => button.classList.add('active'))
}

export default class BaseEditor extends EventEmitter {
  constructor () {
    super()
    this.container$ = new Rx.Subject()
    this.worldModel$ = new Rx.Subject()
    this.worldClick$ = new Rx.Subject()
    this.state$ = new Rx.Subject()
    this.stateChanged$ = this.state$.distinctUntilChanged().share()
    this.buttonPanel$ = this.container$.map(buttonPanel).share()
    this.addIntersectionState$ = this.stateChanged$.filter(state => state === 'addIntersection')
    this.addRoadState$ = this.stateChanged$.filter(state => state === 'addRoad')
    this.editRoadState$ = this.stateChanged$.filter(state => state === 'editRoad')
    this.newIntersection$ = this.addIntersectionState$.switchMap(newIntersection(this.worldClick$, this.state$, this.stateChanged$))
    this.newRoad$ = this.addRoadState$.switchMap(newRoad(this.worldClick$, this.state$, this.stateChanged$)).share()
    this.newRoadPoint$ = this.editRoadState$.switchMap(editRoad(this.worldClick$, this.state$, this.stateChanged$))

    this.buttonPanel$.subscribe(addIntersectionButton(this.state$))
    this.buttonPanel$.subscribe(addRoadButton(this.state$))
    this.buttonPanel$.subscribe(cancelButton(this.state$))
    this.newIntersection$.withLatestFrom(this.worldModel$, handleNewIntersection).subscribe()
    this.newRoad$.withLatestFrom(this.worldModel$, handleNewRoad).subscribe()
    this.newRoadPoint$.withLatestFrom(this.newRoad$, handleNewRoadPoint).subscribe()
    this.state$.withLatestFrom(this.buttonPanel$, handleUIState).subscribe()
  }

  set container (value) {
    this.container$.next(value)
  }

  set worldClickStream (value) {
    value.subscribe(this.worldClick$)
  }

  set worldModel (value) {
    this.worldModel$.next(value)
  }
}
