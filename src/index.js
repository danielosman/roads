import SvgView from './SvgView'
import BaseEditor from './BaseEditor'
import WorldModel from './WorldModel'

const worldModel = new WorldModel()

const svgView = new SvgView()
svgView.container = document.getElementById('canvas')
svgView.worldCoordinates = [0, 0]
svgView.zoom = 0.25
svgView.worldModel = worldModel

const baseEditor = new BaseEditor()
baseEditor.container = document.getElementById('editor')
baseEditor.worldClickStream = svgView.worldClickStream
baseEditor.worldModel = worldModel

/*
let state = 'ready'

const cancelButton = document.getElementById('cancelButton')
const addIntersectionButton = document.getElementById('addIntersectionButton')

const cancelClick$ = fromEvent(cancelButton, 'click')
const addIntersectionClick$ = fromEvent(addIntersectionButton, 'click')
  .map(() => state)
  .filter(s => s !== 'addIntersection')
const svgClick$ = fromEvent(svg, 'click')

addIntersectionClick$.addListener({
  next() {
    state = 'addIntersection'
    addIntersectionButton.setAttribute('class', 'active')
    svgClick$
      .take(1)
      .endWhen(cancelClick$)
      .addListener({
        next: (ev) => {
          console.log('svg clicked: ', ev)
        },
        complete: () => {
          addIntersectionButton.setAttribute('class', 'ready')
          state = 'ready'
        }
      })
  }
})



const line = lineString([[10, 10], [100, 10], [100, 12], [20, 30], [80, 80]])
const offsetPos = lineOffset(line, 5, { units: 'degrees' })
const offsetNeg = lineOffset(line, -5, { units: 'degrees' })
const lineSvg = d3Shape.line()

const linePathElem = document.createElementNS('http://www.w3.org/2000/svg', 'path')
const offsetPosPathElem = document.createElementNS('http://www.w3.org/2000/svg', 'path')
const offsetNegPathElem = document.createElementNS('http://www.w3.org/2000/svg', 'path')
const polyPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
canvas.appendChild(svg)
svg.appendChild(linePathElem)
svg.appendChild(offsetPosPathElem)
svg.appendChild(offsetNegPathElem)
svg.appendChild(polyPath)

linePathElem.setAttribute('d', lineSvg(line.geometry.coordinates))
linePathElem.setAttribute('class', 'base')
//offsetPosPathElem.setAttribute('d', lineSvg(offsetPos.geometry.coordinates))
//offsetPosPathElem.setAttribute('class', 'offset')
*/

// Simplyfiy
/*
const offsetNegSimple = simplepolygon(lineToPolygon(offsetNeg))
console.log('offsetNegSimple: ', offsetNegSimple)

offsetNegPathElem.setAttribute('d', lineSvg(offsetNeg.geometry.coordinates))
offsetNegPathElem.setAttribute('class', 'offset')
*/

// Polygon offset
/*
const polygonOffset = new PolygonOffset()
console.log(polygonOffset, line.geometry.coordinates)
const offsetNeg2Points = polygonOffset.data(line.geometry.coordinates).arcSegments(5).offsetLine(5)
console.log(offsetNeg2Points)
const offsetNeg2 = lineString(offsetNeg2Points[0])
offsetNegPathElem.setAttribute('d', lineSvg(offsetNeg2.geometry.coordinates))
offsetNegPathElem.setAttribute('class', 'offset')
*/

// Join line strings.
/*
const reversed = offset1.geometry.coordinates.slice(0).reverse()
const joined = offset.geometry.coordinates.concat(reversed)
const poly = lineToPolygon(lineString(joined))

polyPath.setAttribute('d', lineSvg(poly.geometry.coordinates[0]))
polyPath.setAttribute('class', 'polygon')

console.log(poly)
*/
