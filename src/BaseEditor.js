import EventEmitter from 'eventemitter3'
import Rx from 'rxjs/Rx'

import IntersectionModel from './objects/IntersectionModel'

const buttonPanel = (container) => container.querySelector('#buttonPanel')

const addIntersectionButton = (state$) => {
  return (buttonPanel) => {
    const button = buttonPanel.querySelector('#addIntersectionButton')
    button.addEventListener('click', () => state$.next('addIntersection'))
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

const handleNewIntersection = ([newIntersection, worldModel]) => {
  newIntersection.buildPolygon()
  worldModel.addIntersection(newIntersection)
}

const handleUIState = ([state, buttonPanel]) => {
  const allButtons = buttonPanel.querySelectorAll('.btn')
  allButtons.forEach(button => button.classList.remove('active'))
  const stateButtons = buttonPanel.querySelectorAll(`.btn.${state}-state`)
  stateButtons.forEach(button => button.classList.add('active'))
}

export default class BaseEditor extends EventEmitter {
  constructor () {
    super()
    this.container$ = new Rx.ReplaySubject(1)
    this.worldModel$ = new Rx.ReplaySubject(1)
    this.worldClick$ = new Rx.Subject()
    this.state$ = new Rx.Subject()
    this.stateChanged$ = this.state$.distinctUntilChanged().share()
    this.buttonPanel$ = this.container$.map(buttonPanel)
    this.addIntersectionState$ = this.stateChanged$.filter(state => state === 'addIntersection')
    this.newIntersection$ = this.addIntersectionState$
      .switchMap(newIntersection(this.worldClick$, this.state$, this.stateChanged$))

    this.buttonPanel$.subscribe(addIntersectionButton(this.state$))
    this.buttonPanel$.subscribe(cancelButton(this.state$))
    this.newIntersection$.withLatestFrom(this.worldModel$).subscribe(handleNewIntersection)
    this.state$.withLatestFrom(this.buttonPanel$).subscribe(handleUIState)
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
