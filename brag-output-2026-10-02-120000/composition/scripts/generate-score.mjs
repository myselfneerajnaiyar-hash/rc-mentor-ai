// Original 20-second score for this video. It uses only locally synthesized oscillators.
// No recordings, third-party songs, paid services, or extra packages are used.
import fs from 'node:fs'
import path from 'node:path'

const sampleRate = 48000
const duration = 20
const frames = sampleRate * duration
const outPath = path.resolve('assets/audio/auctor-original-score.wav')
const pcm = Buffer.alloc(frames * 4)
const clamp = (x) => Math.max(-1, Math.min(1, x))
const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x) }
const progressions = [
  [110, 164.81, 220, 261.63],
  [98, 146.83, 196, 246.94],
  [130.81, 164.81, 196, 261.63],
  [87.31, 130.81, 174.61, 220],
]
const hits = [0.02, 3.0, 6.0, 8.0, 10.0, 12.0, 14.0, 15.03, 16.06, 18.0]
const hitEnvelope = (t, at, length) => {
  const local = t - at
  if (local < 0 || local > length) return 0
  return Math.exp(-local * (local < 0.06 ? 20 : 7)) * Math.min(1, local / 0.012)
}

for (let i = 0; i < frames; i++) {
  const t = i / sampleRate
  const chordIndex = Math.min(3, Math.floor(t / 5))
  const chordStart = chordIndex * 5
  const chordBlend = smooth((t - chordStart) / 0.8)
  const notes = progressions[chordIndex]
  const prev = progressions[Math.max(0, chordIndex - 1)]
  const fadeIn = smooth(t / 0.65)
  const fadeOut = smooth((duration - t) / 1.35)
  const pulse = 0.78 + 0.22 * Math.sin(2 * Math.PI * 1.82 * t)
  let left = 0, right = 0
  for (let n = 0; n < 4; n++) {
    const frequency = prev[n] * (1 - chordBlend) + notes[n] * chordBlend
    const phase = n * 0.37
    const swell = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.105 * t + phase)
    const amp = (0.018 + n * 0.006) * (0.78 + 0.22 * swell) * pulse
    left += amp * Math.sin(2 * Math.PI * frequency * t + phase)
    right += amp * Math.sin(2 * Math.PI * (frequency * 1.003) * t + phase + 0.13)
  }
  const bass = (0.035 + 0.009 * Math.sin(2 * Math.PI * 0.18 * t)) * Math.sin(2 * Math.PI * (notes[0] / 2) * t)
  left += bass; right += bass * 0.96
  const beat = Math.pow(Math.max(0, Math.sin(Math.PI * 1.82 * t)), 12)
  const tick = Math.sin(2 * Math.PI * 880 * t) * beat * 0.014
  left += tick; right += tick * 0.82
  for (let h = 0; h < hits.length; h++) {
    const env = hitEnvelope(t, hits[h], h === 0 || h === 9 ? 0.85 : 0.32)
    if (env) {
      const f = h === 0 ? 49 : (h === 9 ? 65.4 : 110)
      const impact = env * (0.15 * Math.sin(2 * Math.PI * f * t) + 0.018 * Math.sin(2 * Math.PI * f * 2.03 * t))
      left += impact; right += impact * 0.92
    }
  }
  const envelope = fadeIn * fadeOut
  pcm.writeInt16LE(Math.round(clamp(left * envelope) * 32767), i * 4)
  pcm.writeInt16LE(Math.round(clamp(right * envelope) * 32767), i * 4 + 2)
}

const header = Buffer.alloc(44)
header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVE', 8)
header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22)
header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate * 4, 28); header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34)
header.write('data', 36); header.writeUInt32LE(pcm.length, 40)
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, Buffer.concat([header, pcm]))
console.log(`Wrote ${outPath} (${duration}s, original oscillator score)`)
