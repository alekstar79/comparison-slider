export type Listener = (...args: any[]) => void

export class EventEmitter {
  private events: Record<string, Listener[]> = {}

  on(eventName: string, listener: Listener): () => void {
    if (!this.events[eventName]) {
      this.events[eventName] = []
    }

    this.events[eventName].push(listener)

    return () => {
      this.off(eventName, listener)
    }
  }

  off(eventName: string, listener: Listener): void {
    if (!this.events[eventName]) return

    this.events[eventName] = this.events[eventName]
      .filter(l => l !== listener)
  }

  emit(eventName: string, ...args: any[]): void {
    if (!this.events[eventName]) return

    this.events[eventName]
      .forEach(listener => {
        listener(...args)
      })
  }
}
