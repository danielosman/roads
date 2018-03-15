
import { m2d } from '../utils'

export default class IntersectionModel {
  constructor () {
    this.cid = IntersectionModel.getNextId()
  }

  static getNextId () {
    if (!IntersectionModel.counter) {
      IntersectionModel.counter = 0
    }
    IntersectionModel.counter += 1
    return 'Intersection' + IntersectionModel.counter
  }

  buildDefault () {
    const w = m2d(2.75)
    this.x = 0
    this.y = 0
    this.branches = [{
      dir: [1, 0],
      w: [w, w]
    }, {
      dir: [-1, 0],
      w: [w, w]
    }, {
      dir: [0, -1],
      w: [w, w]
    }]
  }
}
