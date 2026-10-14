import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

// Original procedural underscore: soft sine-pad chords, a sparse tick and
// transition tones. No external sample or licensed third-party music.
const output = resolve('assets/audio/original-score.wav')
const sampleRate = 48_000
const duration = 40
const frames = sampleRate * duration
const bytes = Buffer.alloc(44 + frames * 4)
const chords = [
  [146.832, 174.614, 220.0], // Dm
  [116.541, 146.832, 174.614], // Bb
  [87.307, 110.0, 130.813], // F
  [130.813, 164.814, 196.0], // C
]

bytes.write('RIFF', 0); bytes.writeUInt32LE(bytes.length - 8, 4)
bytes.write('WAVE', 8); bytes.write('fmt ', 12); bytes.writeUInt32LE(16, 16)
bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(2, 22)
bytes.writeUInt32LE(sampleRate, 24); bytes.writeUInt32LE(sampleRate * 4, 28)
bytes.writeUInt16LE(4, 32); bytes.writeUInt16LE(16, 34)
bytes.write('data', 36); bytes.writeUInt32LE(frames * 4, 40)

const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x) }
const beatTimes = []
for (let t = 0.7; t < 9.8; t += 0.545) beatTimes.push(t)
for (let t = 15.6; t < 27; t += 0.545) beatTimes.push(t)
const hits = [4.1, 10.9, 15.0, 21.35, 27.05, 32.05, 35.6]

for (let n = 0; n < frames; n++) {
  const t = n / sampleRate
  const section = Math.min(3, Math.floor(t / 10))
  const sectionTime = t - section * 10
  const fadeIn = smooth(sectionTime / 1.6)
  const fadeOut = 1 - smooth((sectionTime - 8.8) / 1.2)
  const padEnvelope = Math.min(fadeIn, fadeOut) * (0.8 + 0.2 * Math.sin(Math.PI * sectionTime / 10))
  let left = 0, right = 0
  for (let i = 0; i < 3; i++) {
    const base = chords[section][i]
    const amp = [0.114, 0.075, 0.051][i] * padEnvelope
    const phaseL = 2 * Math.PI * base * t
    const phaseR = 2 * Math.PI * (base + 0.18) * t
    left += amp * (Math.sin(phaseL) + 0.19 * Math.sin(2 * phaseL) + 0.055 * Math.sin(3 * phaseL))
    right += amp * (Math.sin(phaseR) + 0.19 * Math.sin(2 * phaseR) + 0.055 * Math.sin(3 * phaseR))
  }

  for (const beat of beatTimes) {
    const d = t - beat
    if (d >= 0 && d < 0.075) {
      const env = Math.exp(-d * 63)
      left += 0.105 * env * Math.sin(2 * Math.PI * 1450 * d)
      right += 0.096 * env * Math.sin(2 * Math.PI * 1472 * d)
    }
  }
  for (const hit of hits) {
    const d = t - hit
    if (d >= 0 && d < 0.5) {
      const env = Math.exp(-d * 7)
      left += 0.375 * env * Math.sin(2 * Math.PI * 52 * d)
      right += 0.3625 * env * Math.sin(2 * Math.PI * 54 * d)
    }
  }
  const master = Math.min(1, t / 0.8, (duration - t) / 1.6)
  const clamp = x => Math.max(-1, Math.min(1, x * master * 0.9))
  const offset = 44 + n * 4
  bytes.writeInt16LE(Math.round(clamp(left) * 32767), offset)
  bytes.writeInt16LE(Math.round(clamp(right) * 32767), offset + 2)
}

await mkdir(dirname(output), { recursive: true })
await writeFile(output, bytes)
console.log(`Wrote ${duration}s original stereo score: ${output}`)
