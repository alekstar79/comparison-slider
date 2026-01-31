import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { type UIConfig, type ComparisonSlider, LoadImagePlugin } from '../src'

describe('LoadImagePlugin', () => {
  let sliderMock: Partial<ComparisonSlider>
  let container: HTMLElement
  let uploadButton: HTMLButtonElement

  beforeEach(() => {
    vi.useFakeTimers()

    document.body.innerHTML = `
      <div class="slider-container">
        <button id="uploadButton"></button>
      </div>
    `
    container = document.body.querySelector('.slider-container')!
    uploadButton = container.querySelector('#uploadButton')!

    sliderMock = {
      container,
      updateImage: vi.fn().mockResolvedValue(undefined)
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize and bind click event', () => {
    const plugin = new LoadImagePlugin(sliderMock as ComparisonSlider, {} as UIConfig, {} as any)
    const inputClickSpy = vi.spyOn(plugin['fileInput'], 'click')

    plugin.initialize()
    uploadButton.click()

    expect(inputClickSpy).toHaveBeenCalled()
  })

  it('should call updateImage when a file is selected', async () => {
    const mockReader = {
      onload: vi.fn(),
      readAsDataURL: vi.fn().mockImplementation(function(this: FileReader) {
        if (this.onload) {
          const event = { target: { result: 'data:image/png;base64,test' } } as ProgressEvent<FileReader>
          this.onload(event)
        }
      })
    }
    const fileReaderSpy = vi.spyOn(global, 'FileReader').mockImplementation(() => mockReader as any)

    const plugin = new LoadImagePlugin(sliderMock as ComparisonSlider, {} as UIConfig, {} as any)
    plugin.initialize()

    const fileInput = plugin['fileInput']
    const file = new File([''], 'test.png', { type: 'image/png' })

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: true
    })

    fileInput.dispatchEvent(new Event('change'))

    await vi.runAllTimersAsync()

    expect(sliderMock.updateImage).toHaveBeenCalledWith('data:image/png;base64,test')

    fileReaderSpy.mockRestore()
  })

  it('should not fail if upload button is not found', () => {
    uploadButton.remove()
    const plugin = new LoadImagePlugin(sliderMock as ComparisonSlider, {} as UIConfig, {} as any)
    expect(() => plugin.initialize()).not.toThrow()
  })
})
