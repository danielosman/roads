import SvgView from './SvgView'
import BaseEditor from './BaseEditor'
import WorldModel from './WorldModel'

const worldModel = new WorldModel()

const svgView = new SvgView()
svgView.container = document.getElementById('canvas')
svgView.worldCoordinates = [0, 0]
svgView.zoom = 0.5
svgView.worldModel = worldModel

const baseEditor = new BaseEditor()
baseEditor.container = document.getElementById('editor')
baseEditor.worldClickStream = svgView.worldClickStream
baseEditor.worldModel = worldModel
