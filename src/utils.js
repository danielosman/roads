
const m2d = m => m * 0.00000899774157

const setAttributes = (elem, attrs) => {
  Object.keys(attrs).forEach(attr => elem.setAttribute(attr, attrs[attr]))
  return elem
}

const isFunction = (functionToCheck) => {
  return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]'
}

const normalize = (dir) => {
  const len = Math.sqrt(dir.reduce((sum, d) => sum + d * d, 0))
  return dir.map(d => d / len)
}

export { m2d, setAttributes, isFunction, normalize }
