class EventManager {

    constructor() {
        this.listeners = new Map()
    }

    // execute the callback everytime the label is trigger
    on(label, callback) {
        this.listeners.has(label) || this.listeners.set(label, [])
        this.listeners.get(label).push(callback)
    }

    // remove the callback for a label
    off(label, removeAll = true) {
        if (removeAll === true) {
            // remove listeners for all callbackfunctions
            this.listeners.delete(label)
        } else {
            // remove listeners only with match callbackfunctions
            let _off = (inListener) => {
                let listeners = inListener.get(label)
                if (listeners) {
                    inListener.set(label, listeners.filter((value) => !(value === removeAll)))
                }
            }
            _off(this.listeners)
        }
    }

    // trigger the event with the label and dispatch it to all listeners
    dispatch(label, ...args) {
        let resolution = false
        const trigger = (inListener, label, ...args) => {
            const listeners = inListener.get(label)
            if (listeners && listeners.length) 
            {
                listeners.forEach((listener) => {
                    listener(...args)
                })
                resolution = true
            }
        }
        trigger(this.listeners, label, ...args)
        return resolution
    }
}

export default EventManager