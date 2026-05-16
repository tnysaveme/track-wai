import { render, screen, fireEvent } from '@testing-library/react'
import AudioPlayer from '@/components/AudioPlayer'

window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined)
window.HTMLMediaElement.prototype.pause = jest.fn()

describe('AudioPlayer', () => {
  it('renders a Play button initially', () => {
    render(<AudioPlayer previewUrl="https://example.com/preview.mp3" />)
    expect(screen.getByLabelText('Play')).toBeInTheDocument()
  })

  it('switches to Pause after clicking Play', () => {
    render(<AudioPlayer previewUrl="https://example.com/preview.mp3" />)
    fireEvent.click(screen.getByLabelText('Play'))
    expect(screen.getByLabelText('Pause')).toBeInTheDocument()
  })

  it('switches back to Play after clicking Pause', () => {
    render(<AudioPlayer previewUrl="https://example.com/preview.mp3" />)
    fireEvent.click(screen.getByLabelText('Play'))
    fireEvent.click(screen.getByLabelText('Pause'))
    expect(screen.getByLabelText('Play')).toBeInTheDocument()
  })
})
