import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import https from 'https'
import http from 'http'

const MODEL_CONFIG = {
  url: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
  filename: 'Phi-3-mini-4k-instruct-q4.gguf',
  systemPrompt: [
    'You are Closeclaw, a powerful AI assistant running entirely on this computer.',
    'You are optimized for Apple Silicon (M1/M2/M3) with Metal GPU acceleration.',
    'All processing happens locally on-device — zero cloud dependencies, complete privacy.',
    '',
    'You are fine-tuned to help with computer tasks:',
    '- Answering questions and providing information',
    '- Writing, explaining, and debugging code',
    '- System administration and troubleshooting',
    '- File management and organization',
    '- General productivity and creative tasks',
    '',
    'Be concise, accurate, and helpful. Format responses clearly with markdown when appropriate.',
  ].join('\n'),
}

export type ModelStatus =
  | 'not-downloaded'
  | 'downloading'
  | 'downloaded'
  | 'loading'
  | 'ready'
  | 'error'

export class LLMEngine {
  private status: ModelStatus = 'not-downloaded'
  private modelPath: string
  private modelsDir: string
  private session: any = null
  private model: any = null
  private context: any = null
  private error: string | null = null

  constructor() {
    this.modelsDir = path.join(app.getPath('userData'), 'models')
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true })
    }
    this.modelPath = path.join(this.modelsDir, MODEL_CONFIG.filename)

    if (fs.existsSync(this.modelPath)) {
      const stats = fs.statSync(this.modelPath)
      // Only consider downloaded if file is > 100MB (sanity check)
      if (stats.size > 100 * 1024 * 1024) {
        this.status = 'downloaded'
      }
    }
  }

  getStatus(): { status: ModelStatus; error: string | null } {
    return { status: this.status, error: this.error }
  }

  async downloadModel(onProgress: (progress: number) => void): Promise<void> {
    if (this.status === 'downloading') return
    this.status = 'downloading'
    this.error = null

    return new Promise((resolve, reject) => {
      const download = (url: string, redirectCount = 0) => {
        if (redirectCount > 10) {
          this.status = 'error'
          this.error = 'Too many redirects'
          reject(new Error('Too many redirects'))
          return
        }

        const protocol = url.startsWith('https') ? https : http
        const request = protocol.get(
          url,
          { headers: { 'User-Agent': 'Closeclaw/0.1.0' } },
          (response) => {
            if (
              response.statusCode === 301 ||
              response.statusCode === 302 ||
              response.statusCode === 307
            ) {
              const location = response.headers.location
              if (location) {
                download(location, redirectCount + 1)
              } else {
                this.status = 'error'
                this.error = 'Redirect without location header'
                reject(new Error('Redirect without location header'))
              }
              return
            }

            if (response.statusCode !== 200) {
              this.status = 'error'
              this.error = `HTTP error: ${response.statusCode}`
              reject(new Error(`HTTP error: ${response.statusCode}`))
              return
            }

            const totalSize = parseInt(response.headers['content-length'] || '0', 10)
            let downloadedSize = 0
            const fileStream = fs.createWriteStream(this.modelPath)

            response.on('data', (chunk: Buffer) => {
              downloadedSize += chunk.length
              fileStream.write(chunk)
              if (totalSize > 0) {
                onProgress(Math.round((downloadedSize / totalSize) * 100))
              }
            })

            response.on('end', () => {
              fileStream.end(() => {
                this.status = 'downloaded'
                resolve()
              })
            })

            response.on('error', (err) => {
              fileStream.end()
              this.status = 'error'
              this.error = err.message
              // Clean up partial download
              if (fs.existsSync(this.modelPath)) {
                fs.unlinkSync(this.modelPath)
              }
              reject(err)
            })
          },
        )

        request.on('error', (err) => {
          this.status = 'error'
          this.error = err.message
          reject(err)
        })
      }

      download(MODEL_CONFIG.url)
    })
  }

  async loadModel(): Promise<void> {
    if (this.status === 'loading' || this.status === 'ready') return
    if (!fs.existsSync(this.modelPath)) {
      this.status = 'error'
      this.error = 'Model file not found. Please download first.'
      throw new Error(this.error)
    }

    this.status = 'loading'
    this.error = null

    try {
      const { getLlama, LlamaChatSession } = await import('node-llama-cpp')
      const llama = await getLlama()
      this.model = await llama.loadModel({
        modelPath: this.modelPath,
      })
      this.context = await this.model.createContext({ contextSize: 4096 })
      this.session = new LlamaChatSession({
        contextSequence: this.context.getSequence(),
        systemPrompt: MODEL_CONFIG.systemPrompt,
      })
      this.status = 'ready'
    } catch (err: any) {
      this.status = 'error'
      this.error = err.message || 'Failed to load model'
      throw err
    }
  }

  async prompt(
    message: string,
    onToken: (token: string) => void,
  ): Promise<string> {
    if (!this.session) {
      throw new Error('Model not loaded')
    }

    const response = await this.session.prompt(message, {
      onTextChunk(text: string) {
        onToken(text)
      },
    })

    return response
  }

  async resetChat(): Promise<void> {
    if (this.context) {
      try {
        const { LlamaChatSession } = await import('node-llama-cpp')
        this.session = new LlamaChatSession({
          contextSequence: this.context.getSequence(),
          systemPrompt: MODEL_CONFIG.systemPrompt,
        })
      } catch (err: any) {
        this.error = err.message
        throw err
      }
    }
  }
}
