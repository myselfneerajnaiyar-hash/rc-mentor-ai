import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

// Original procedural score; no external sample or licensed track.
const output = resolve('assets/audio/original-score.wav')
const sampleRate = 48_000
const duration = 38
const frames = sampleRate * duration
const bytes = Buffer.alloc(44 + frames * 4)
const chords = [
  [146.832, 174.614, 220.0],
  [116.541, 146.832, 174.614],
  [87.307, 110.0, 130.813],
  [130.813, 164.814, 196.0],
]
bytes.write('RIFF', 0); bytes.writeUInt32LE(bytes.length - 8, 4)
bytes.write('WAVE', 8); bytes.write('fmt ', 12); bytes.writeUInt32LE(16, 16)
bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(2, 22)
bytes.writeUInt32LE(sampleRate, 24); bytes.writeUInt32LE(sampleRate * 4, 28)
bytes.writeUInt16LE(4, 32); bytes.writeUInt16LE(16, 34)
bytes.write('data', 36); bytes.writeUInt32LE(frames * 4, 40)
const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x) }
const beats = []
for (let t = 0.4; t < 35.4; t += 0.56) beats.push(t)
const hits = [0.18, 3.55, 8.48, 13.5, 18.48, 23.48, 29.45, 32.45, 35.4]
for (let n = 0; n < frames; n++) {
  const t = n / sampleRate
  const section = Math.min(3, Math.floor(t / 9))
  const sectionTime = t - section * 9
  const fadeIn = smooth(sectionTime / 0.9)
  const fadeOut = 1 - smooth((sectionTime - 7.9) / 1.1)
  const envelope = Math.min(fadeIn, fadeOut) * (0.84 + 0.16 * Math.sin(Math.PI * sectionTime / 9))
  let left = 0, right = 0
  for (let i = 0; i < 3; i++) {
    const base = chords[section][i]
    const amp = [0.105, 0.071, 0.048][i] * envelope
    const phaseL = 2 * Math.PI * base * t
    const phaseR = 2 * Math.PI * (base + 0.18) * t
    left += amp * (Math.sin(phaseL) + 0.16 * Math.sin(2 * phaseL) + 0.04 * Math.sin(3 * phaseL))
    right += amp * (Math.sin(phaseR) + 0.16 * Math.sin(2 * phaseR) + 0.04 * Math.sin(3 * phaseR))
  }
  for (const beat of beats) {
    const d = t - beat
    if (d >= 0 && d < 0.07) {
      const env = Math.exp(-d * 66)
      left += 0.095 * env * Math.sin(2 * Math.PI * 1420 * d)
      right += 0.088 * env * Math.sin(2 * Math.PI * 1445 * d)
    }
  }
  for (const hit of hits) {
    const d = t - hit
    if (d >= 0 && d < 0.48) {
      const env = Math.exp(-d * 7.1)
      left += 0.32 * env * Math.sin(2 * Math.PI * 52 * d)
      right += 0.31 * env * Math.sin(2 * Math.PI * 54 * d)
    }
  }
  const master = Math.min(1, t / 0.28, (duration - t) / 1.8)
  const clamp = x => Math.max(-1, Math.min(1, x * master * 0.82))
  const offset = 44 + n * 4
  bytes.writeInt16LE(Math.round(clamp(left) * 32767), offset)
  bytes.writeInt16LE(Math.round(clamp(right) * 32767), offset + 2)
}
await mkdir(dirname(output), { recursive: true })
await writeFile(output, bytes)
console.log(`Wrote ${duration}s original stereo score: ${output}`)
