import EventEmitter from 'eventemitter3'
import { lineString } from '@turf/helpers'
import lineOffset from '@turf/line-offset'
import bearing from '@turf/bearing'
import lineIntersect from '@turf/line-intersect'
import isParallel from '@turf/boolean-parallel'
import nearestPointOnLine from '@turf/nearest-point-on-line'
import along from '@turf/along'

import { m2d } from '../utils'

export default class IntersectionModel extends EventEmitter {
  constructor () {
    super()
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

  buildPolygon () {
    const intersection = this

    intersection.branches.forEach((branch) => {
      const dist = 10 * (branch.w[0] + branch.w[1])
      const dir = branch.dir
      const line = [
        [intersection.x - dist * dir[0], intersection.y - dist * dir[1]],
        [intersection.x + dist * dir[0], intersection.y + dist * dir[1]]
      ]
      branch.dist = dist
      branch.line = lineString(line)
      branch.borders = [
        lineOffset(branch.line, branch.w[0], { units: 'degrees' }),
        lineOffset(branch.line, -branch.w[1], { units: 'degrees' })
      ]
      branch.bearing = bearing(line[0], line[1])
      branch.alongs = [[], []]
    })
    intersection.branches.sort((a, b) => a.bearing - b.bearing)

    intersection.branches.forEach((branch, i) => {
      const line1 = branch.borders[0]
      let ii = i + 1
      ii = (ii >= intersection.branches.length) ? 0 : ii
      const nextBranch = intersection.branches[ii]
      const line2 = intersection.branches[ii].borders[1]
      const point = lineIntersect(line1, line2)
      if (point.features.length > 0) {
        const nearestPoint1 = nearestPointOnLine(line1, point.features[0], { units: 'degrees' })
        branch.alongs[0].push(nearestPoint1.properties.location)
        const nearestPoint2 = nearestPointOnLine(line2, point.features[0], { units: 'degrees' })
        nextBranch.alongs[1].push(nearestPoint2.properties.location)
      } else {
        branch.alongs[0].push(branch.dist)
        nextBranch.alongs[1].push(nextBranch.dist)
      }
    })

    intersection.points = []
    intersection.branches.forEach((branch) => {
      const w = branch.w[0] + branch.w[1]
      const maxAlong = Math.max(branch.alongs[0][0], branch.alongs[1][0]) + w
      branch.alongs[0].push(maxAlong)
      branch.alongs[1].push(maxAlong)
      const points = []
      //points.push(along(branch.borders[1], branch.alongs[1][0], { units: 'degrees' }))
      points.push(along(branch.borders[1], branch.alongs[1][1], { units: 'degrees' }))
      points.push(along(branch.borders[0], branch.alongs[0][1], { units: 'degrees' }))
      points.push(along(branch.borders[0], branch.alongs[0][0], { units: 'degrees' }))
      branch.circle = along(branch.line, maxAlong + w, { units: 'degrees' }).geometry.coordinates
      branch.points = points.map(p => p.geometry.coordinates)
      branch.points.forEach(p => intersection.points.push(p))
    })
  }

  changeBranchDir (i, dir) {
    this.branches[i].dir = dir
    this.buildPolygon()
    this.emit('changed', this)
  }

  scaledPolygon (scaleX, scaleY) {
    const intersection = this
    return intersection.points.map(p => [scaleX(p[0]), scaleY(p[1])])
  }

  scaledBranchCircles (scaleX, scaleY) {
    const intersection = this
    return intersection.branches.map((branch) => {
      let r = branch.w[0] + branch.w[1]
      r = (scaleX(r) - scaleX(0)) / 2
      return {
        cx: scaleX(branch.circle[0]),
        cy: scaleY(branch.circle[1]),
        r
      }
    })
  }
}
