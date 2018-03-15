
const m2d = m => m * 0.00000899774157

const setAttributes = (elem, attrs) => {
  Object.keys(attrs).forEach(attr => elem.setAttribute(attr, attrs[attr]))
  return elem
}

const isFunction = (functionToCheck) => {
 return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]'
}

export { m2d, setAttributes, isFunction }
