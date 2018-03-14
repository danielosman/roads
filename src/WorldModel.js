import EventEmitter from 'eventemitter3'

export default class WorldModel extends EventEmitter {
  updateState (state) {
    this.emit('update', state)
  }
}
