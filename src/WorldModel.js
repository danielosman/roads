import EventEmitter from 'eventemitter3'

export default class WorldModel extends EventEmitter {
  constructor () {
    super()
    this.intersections = []
  }

  addIntersection (intersection) {
    this.intersections.push(intersection)
    this.emit('addedIntersection', intersection)
  }
}
