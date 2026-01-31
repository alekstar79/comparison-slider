import { describe, it, expect, vi } from 'vitest'
import { EventEmitter } from '../src'

describe('EventEmitter', () => {
  it('should add a listener and emit an event', () => {
    const emitter = new EventEmitter()
    const listener = vi.fn()

    emitter.on('test-event', listener)
    emitter.emit('test-event', 1, 'hello')

    expect(listener).toHaveBeenCalledOnce()
    expect(listener).toHaveBeenCalledWith(1, 'hello')
  })

  it('should remove a specific listener with "off"', () => {
    const emitter = new EventEmitter()
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    emitter.on('test-event', listener1)
    emitter.on('test-event', listener2)
    emitter.off('test-event', listener1)
    emitter.emit('test-event')

    expect(listener1).not.toHaveBeenCalled()
    expect(listener2).toHaveBeenCalledOnce()
  })

  it('should remove a listener using the returned unsubscribe function', () => {
    const emitter = new EventEmitter()
    const listener = vi.fn()

    const unsubscribe = emitter.on('test-event', listener)
    unsubscribe()
    emitter.emit('test-event')

    expect(listener).not.toHaveBeenCalled()
  })

  it('should handle emitting an event with no listeners', () => {
    const emitter = new EventEmitter()
    expect(() => emitter.emit('non-existent-event')).not.toThrow()
  })

  it('should handle removing a listener that does not exist', () => {
    const emitter = new EventEmitter()
    const listener = vi.fn()
    expect(() => emitter.off('non-existent-event', listener)).not.toThrow()
  })

  it('should call multiple listeners for the same event', () => {
    const emitter = new EventEmitter()
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    emitter.on('test-event', listener1)
    emitter.on('test-event', listener2)
    emitter.emit('test-event')

    expect(listener1).toHaveBeenCalledOnce()
    expect(listener2).toHaveBeenCalledOnce()
  })
})
