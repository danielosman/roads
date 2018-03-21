import EventEmitter from 'eventemitter3'

export default class WorldModel extends EventEmitter {
  constructor () {
    super()
    this.intersections = []
    this.roads = []
  }

  addIntersection (intersection) {
    this.intersections.push(intersection)
    this.emit('addedIntersection', intersection)
  }

  addRoad (road) {
    this.roads.push(road)
    this.emit('addedRoad', road)
  }
}
