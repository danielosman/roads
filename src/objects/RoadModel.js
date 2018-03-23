import EventEmitter from 'eventemitter3'
import * as THREE from 'three'
import circle from '@turf/circle'
import { lineString } from '@turf/helpers'
import lineOffset from '@turf/line-offset'

import { m2d } from '../utils'

export default class RoadModel extends EventEmitter {
  constructor () {
    super()
    this.cid = RoadModel.getNextId()
  }

  static getNextId () {
    if (!RoadModel.counter) {
      RoadModel.counter = 0
    }
    RoadModel.counter += 1
    return 'Road' + RoadModel.counter
  }

  buildDefault () {
    this.w = m2d(2.75)
    this.points = []
  }

  buildPolygon () {
    const road = this
    if (road.points.length === 1) {
      // Circle.
      const polygonCircle = circle(road.points[0], road.w, { units: 'degrees', steps: 8 })
      road.polygon = polygonCircle.geometry.coordinates[0]
      return
    }
    let line
    if (road.points.length === 2) {
      // Line.
      line = lineString(road.points)
    } else {
      // Catmull Rom spline.
      const curve = new THREE.CatmullRomCurve3(road.points.map(p => new THREE.Vector3(p[0], 0, p[1])))
      const len = curve.getLength()
      const divisions = Math.ceil(len / (road.w * 3))
      line = lineString(curve.getPoints(divisions).map(v => [v.x, v.z]))
    }
    const linePos = lineOffset(line, road.w, { units: 'degrees' })
    const lineNeg = lineOffset(line, -road.w, { units: 'degrees' })
    lineNeg.geometry.coordinates.reverse()
    lineNeg.geometry.coordinates.forEach(p => linePos.geometry.coordinates.push(p))
    road.polygon = linePos.geometry.coordinates
  }

  scaledPolygon (scaleX, scaleY) {
    const road = this
    return road.polygon.map(p => [scaleX(p[0]), scaleY(p[1])])
  }

  scaledLineNodes (scaleX, scaleY) {
    const road = this
    return road.points.map(point => ({
      cx: scaleX(point[0]),
      cy: scaleY(point[1]),
      r: scaleX(road.w) - scaleX(0)
    }))
  }

  addPoint (point) {
    this.points.push(point)
    this.buildPolygon()
    this.emit('changed', this)
  }

  moveLineNode (nodeIndex, x, y) {
    this.points[nodeIndex][0] = x
    this.points[nodeIndex][1] = y
    this.buildPolygon()
    this.emit('changed', this)
  }
}
