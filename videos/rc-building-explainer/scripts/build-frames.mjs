import fs from 'node:fs';
import path from 'node:path';

const out = path.resolve('compositions/frames');
fs.mkdirSync(out, { recursive: true });

const navy = '#0b121c';
const cyan = '#6ee0ed';
const muted = '#526171';
const paper = '#e9edf5';

function text(id, value, x, y, w, size, color = navy, extra = '') {
  return `<div id="f-${id}-clip" class="clip" data-start="0" data-duration="DURATION" data-track-index="2" style="left:${x}px;top:${y}px;width:${w}px"><div id="f-${id}" class="text" style="font-size:${size}px;color:${color};${extra}">${value}</div></div>`;
}

function panel(id, x, y, w, h, extra = '') {
  return `<div id="f-${id}-clip" class="clip" data-start="0" data-duration="DURATION" data-track-index="1" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><div id="f-${id}" class="panel" style="width:100%;height:100%;${extra}"></div></div>`;
}

function svg(id, x, y, w, h, inner) {
  return `<div id="f-${id}-clip" class="clip drawing" data-start="0" data-duration="DURATION" data-track-index="1" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><svg id="f-${id}" width="100%" height="100%" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">${inner}</svg></div>`;
}

function pathLine(id, d, width = 5, color = navy) {
  return `<path id="f-${id}" d="${d}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function line(id, x1, y1, x2, y2, width = 5, color = navy) {
  return `<path id="f-${id}" d="M${x1} ${y1} L${x2} ${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
}

function shell(id, duration, body, reveals, draws = []) {
  let nextTrack = 2;
  const content = body.replaceAll('DURATION', `${duration}`).replace(
    /(class="clip[^"]*" data-start="[^"]+" data-duration="[^"]+" data-track-index=")\d+"/g,
    (_match, prefix) => `${prefix}${nextTrack++}"`,
  );
  const safeSelector = (selector) => selector.replace(/#(\d+-)/g, '#f-$1');
  const revealCode = reveals.map(({ selector, at, from = 24, scale = 1 }) =>
    `tl.fromTo('${safeSelector(selector)}', { autoAlpha: 0, y: ${from}, scale: ${scale} }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.48, ease: 'power3.out' }, ${at});`,
  ).join('\n');
  const drawCode = draws.map(({ selector, at }) =>
    `document.querySelectorAll('${safeSelector(selector)}').forEach((p) => { const n = p.getTotalLength(); gsap.set(p, { strokeDasharray: n, strokeDashoffset: n }); tl.to(p, { strokeDashoffset: 0, duration: 0.72, ease: 'power2.inOut' }, ${at}); });`,
  ).join('\n');
  return `<template>
<div id="root" data-composition-id="${id}" data-width="1080" data-height="1920">
  <div id="f-${id}-ground" class="clip ground" data-start="0" data-duration="${duration}" data-track-index="0"></div>
  <div id="f-${id}-grid" class="clip grid" data-start="0" data-duration="${duration}" data-track-index="1"></div>
  ${content}
</div>
<style>
#root { position:relative; width:1080px; height:1920px; overflow:hidden; container-type:size; background:${paper}; color:${navy}; }
.clip { position:absolute; box-sizing:border-box; }
.ground { inset:0; background:linear-gradient(148deg, rgba(110,224,237,.11), transparent 49%), ${paper}; }
.grid { inset:0; opacity:.33; background-image:linear-gradient(rgba(11,18,28,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(11,18,28,.055) 1px,transparent 1px); background-size:48px 48px; mask-image:linear-gradient(to bottom,black,transparent 88%); }
.text { font-family:sans-serif; font-weight:600; letter-spacing:-.035em; line-height:1.12; }
.eyebrow { font-family:sans-serif; font-weight:700; letter-spacing:.15em; text-transform:uppercase; }
.panel { border:2px solid rgba(11,18,28,.16); border-radius:14px; background:rgba(110,224,237,.16); }
.drawing { position:absolute; overflow:visible; }
.cyan { color:${cyan}; }
.rule { height:5px; border-radius:3px; background:${cyan}; }
.logo-plate { border-radius:22px; background:${navy}; display:flex; align-items:center; justify-content:center; }
</style>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });
${revealCode}
${drawCode}
${id === '01-reading-as-architecture' ? "tl.to('#f-01-architecture', { autoAlpha: 0, duration: 0.3, ease: 'power2.inOut' }, 1.72);" : ''}
window.__timelines['${id}'] = tl;
</script>
</template>`;
}

const frames = [
  {
    file: '01-reading-as-architecture.html', id: '01-reading-as-architecture', duration: 3,
    body: [
      text('01-eyebrow', 'AUCTOR · CAT VARC', 80, 150, 800, 22, muted, 'letter-spacing:.16em;'),
      text('01-title-a', 'RC ≠ JUST A PASSAGE', 80, 260, 920, 64, navy, 'font-weight:800;'),
      svg('01-architecture', 145, 540, 790, 720, [
        pathLine('01-draw-building', 'M135 650 L135 310 L395 115 L655 310 L655 650 M205 650 L205 345 L395 210 L585 345 L585 650 M135 420 L655 420 M135 535 L655 535 M100 650 L690 650', 8, navy),
        line('01-ground-line', 48, 680, 742, 680, 5, cyan),
      ].join('')),
      ...[0,1,2,3,4].map((i) => panel(`01-passage-line-${i+1}`, 185, 700+i*62, 710-(i%2)*115, 18, 'border:0;border-radius:9px;background:rgba(11,18,28,.78);')),
      text('01-title-b', 'RC = A BUILDING', 80, 1375, 920, 86, navy, 'font-weight:800;'),
      text('01-caption', 'READ THE STRUCTURE', 82, 1490, 700, 25, muted, 'letter-spacing:.14em;'),
    ].join('\n'),
    reveals: [
      { selector: '#01-eyebrow', at: 0 }, { selector: '#01-title-a', at: 0.12, from: 30 },
      { selector: '#01-architecture', at: 0.72, from: 0, scale: .98 }, { selector: '#01-title-b', at: 1.76, from: 35 },
      ...[1,2,3,4,5].map((i) => ({ selector: `#01-passage-line-${i}`, at: 1.85+(i-1)*.08, from: 0 })),
      { selector: '#01-caption', at: 2.18, from: 16 },
    ],
    draws: [{ selector: '#01-draw-building,#01-ground-line', at: .76 }],
  },
  {
    file: '02-foundation-topic.html', id: '02-foundation-topic', duration: 6,
    body: [
      text('02-eyebrow', '01 / FOUNDATION', 78, 142, 850, 25, muted, 'letter-spacing:.14em;'),
      text('02-head', 'Find the topic first.', 78, 220, 920, 59, navy, 'font-weight:700;'),
      panel('02-quote-panel', 70, 400, 940, 300),
      text('02-quote', '“<span style="background:rgba(110,224,237,.55);border-radius:5px;padding:0 6px">the world of the novel<br>was often the nation</span>”', 110, 468, 860, 47, navy, 'font-weight:500;line-height:1.35;'),
      svg('02-foundation-drawing', 120, 820, 840, 500, [
        pathLine('02-base-building', 'M180 390 L180 160 L420 38 L660 160 L660 390 M240 390 L240 185 L420 92 L600 185 L600 390', 7, navy),
        line('02-base-floor', 110, 390, 730, 390, 5, navy),
        `<rect id="f-02-base-slab" x="110" y="398" width="620" height="72" rx="8" fill="${cyan}" stroke="${navy}" stroke-width="5"/>`,
      ].join('')),
      text('02-nation', 'NATION', 315, 1220, 450, 72, navy, 'font-weight:800;text-align:center;'),
      text('02-foundation-label', 'FOUNDATION  /  TOPIC', 200, 1345, 680, 27, muted, 'text-align:center;letter-spacing:.13em;'),
      text('02-topic-line', 'TOPIC  →  POSTCOLONIAL LITERATURE / NATION', 85, 1460, 910, 28, navy, 'font-weight:700;text-align:center;letter-spacing:-.02em;'),
    ].join('\n'),
    reveals: [
      { selector: '#02-eyebrow', at: 0 }, { selector: '#02-head', at: .2 }, { selector: '#02-quote-panel', at: 1.25, from: 18 },
      { selector: '#02-quote', at: 1.6, from: 12 }, { selector: '#02-foundation-drawing', at: 2.75, from: 0 },
      { selector: '#02-nation', at: 3.55, from: -140 }, { selector: '#02-foundation-label', at: 4.35, from: 18 },
      { selector: '#02-topic-line', at: 5.02, from: 18 },
    ],
    draws: [{ selector: '#02-base-building,#02-base-floor', at: 2.82 }],
  },
  {
    file: '03-columns-paragraph-roles.html', id: '03-columns-paragraph-roles', duration: 8,
    body: [
      text('03-eyebrow', '02 / PARAGRAPH ROLES', 78, 132, 900, 24, muted, 'letter-spacing:.14em;'),
      text('03-head', 'Five paragraphs.<br>Five jobs.', 78, 200, 920, 57, navy, 'font-weight:800;line-height:1.12;'),
      svg('03-columns', 42, 470, 996, 790, [
        line('03-ground', 45, 735, 950, 735, 7, navy),
        ...[0,1,2,3,4].map((i) => `<rect id="f-03-col-${i+1}" x="${70 + i*185}" y="${240 + (i===0?32:0)}" width="130" height="470" rx="10" fill="${i===1?'rgba(110,224,237,.42)':'rgba(110,224,237,.16)'}" stroke="${navy}" stroke-width="5"/>`).join(''),
        ...[0,1,2,3,4].map((i) => line(`03-cap-${i+1}`, 75 + i*185, 240 + (i===0?32:0), 195 + i*185, 240 + (i===0?32:0), 8, cyan)).join(''),
      ].join('')),
      ...[
        ['P1','OLD MODEL<br><span style="font-size:16px;line-height:1.2">NATION-CENTRED<br>POSTCOLONIAL NOVEL</span>','LIMITATION'],['P2',"AUTHOR'S NEW IDEA",'INDIAN OCEAN WORLD'],['P3','BACKGROUND','FOUNDATION'],['P4','CONTRAST','EVIDENCE'],['P5','IMPLICATION','AFRICA'],
      ].map(([p, role, key], i) => text(`03-label-${i+1}`, `${p}<br><span style="font-size:21px;letter-spacing:.02em">${role}</span><br><span style="font-size:19px;color:${muted};font-weight:500">${key}</span>`, 47+i*195, 1285, 175, 24, navy, 'text-align:center;line-height:1.55;font-weight:700;')),
      text('03-africa-quote', '“<span style="background:rgba(110,224,237,.55);padding:2px 7px;border-radius:5px">This remapping is particularly powerful for the representation of Africa.</span>”', 70, 356, 940, 23, navy, 'text-align:center;font-weight:700;line-height:1.3;'),
      text('03-source-cue', '“but could also be limiting”  →  “another kind of world of the novel”', 75, 405, 930, 22, muted, 'text-align:center;font-weight:500;letter-spacing:-.02em;'),
    ].join('\n'),
    reveals: [
      { selector: '#03-eyebrow', at: 0 }, { selector: '#03-head', at: .16 },
      ...[1,2,3,4,5].map((i) => ({ selector: `#03-col-${i}`, at: .75 + (i-1)*.82, from: 55 })),
      ...[1,2,3,4,5].map((i) => ({ selector: `#03-label-${i}`, at: 1.24 + (i-1)*.95, from: 20 })),
      { selector: '#03-africa-quote', at: 6.25, from: 12 }, { selector: '#03-source-cue', at: 6.85, from: 12 },
    ],
    draws: [{ selector: '#03-ground', at: .72 }],
  },
  {
    file: '04-beams-logical-connections.html', id: '04-beams-logical-connections', duration: 8,
    body: [
      text('04-eyebrow', '03 / LOGICAL CONNECTIONS', 78, 132, 920, 24, muted, 'letter-spacing:.14em;'),
      text('04-head', 'Follow the turns.', 78, 205, 920, 62, navy, 'font-weight:800;'),
      svg('04-structure', 55, 445, 970, 820, [
        line('04-base', 80, 690, 890, 690, 8, navy),
        ...[0,1,2,3,4].map((i) => `<rect x="${90 + i*174}" y="255" width="110" height="420" rx="9" fill="rgba(110,224,237,.16)" stroke="${navy}" stroke-width="5"/>`).join(''),
        ...[0,1,2,3,4].map((i) => line(`04-beam-${i+1}`, 145+i*174, 325, 319+i*174, 325, 10, cyan)).join(''),
        ...[0,1,2,3].map((i) => `<circle cx="${319+i*174}" cy="325" r="12" fill="${navy}"/>`).join(''),
      ].join('')),
      text('04-cue-1', 'BUT COULD ALSO BE LIMITING', 78, 1295, 920, 27, navy, 'font-weight:700;text-align:center;letter-spacing:.04em;'),
      text('04-cue-2', 'INSTEAD', 78, 1360, 920, 25, muted, 'font-weight:700;text-align:center;letter-spacing:.1em;'),
      text('04-cue-2b', 'EUROPE / US  →  INDIAN OCEAN WORLD', 78, 1394, 920, 27, navy, 'font-weight:800;text-align:center;letter-spacing:.02em;'),
      text('04-cue-3', 'THIS HAS THE EFFECT OF REMAPPING THE WORLD', 78, 1425, 920, 25, muted, 'font-weight:700;text-align:center;letter-spacing:.02em;'),
      text('04-cue-4', 'THIS DOES NOT MEAN THAT INDIAN OCEAN AFRICA IS ROMANTICISED.', 78, 1490, 920, 24, muted, 'font-weight:700;text-align:center;letter-spacing:-.015em;'),
    ].join('\n'),
    reveals: [
      { selector: '#04-eyebrow', at: 0 }, { selector: '#04-head', at: .18 }, { selector: '#04-structure', at: .8, from: 0 },
      ...[1,2,3,4].map((i) => ({ selector: `#04-cue-${i}`, at: 1.5 + (i-1)*1.48, from: 16 })),
      { selector: '#04-cue-2b', at: 2.9, from: 16 },
    ],
    draws: [{ selector: '#04-base', at: .82 }, { selector: '#04-beam-1', at: 1.35 }, { selector: '#04-beam-2', at: 2.8 }, { selector: '#04-beam-3', at: 4.25 }, { selector: '#04-beam-4', at: 5.7 }],
  },
  {
    file: '05-roof-main-point.html', id: '05-roof-main-point', duration: 7,
    body: [
      text('05-eyebrow', '04 / AUTHOR’S MAIN POINT', 78, 138, 920, 24, muted, 'letter-spacing:.14em;'),
      text('05-head', 'The roof is the<br>argument.', 78, 215, 920, 61, navy, 'font-weight:800;line-height:1.1;'),
      svg('05-roof-building', 95, 500, 890, 760, [
        pathLine('05-roof', 'M95 300 L445 80 L795 300 M155 300 L155 650 L735 650 L735 300 M235 360 L235 590 M365 360 L365 590 M495 360 L495 590 M625 360 L625 590 M100 650 L790 650', 8, navy),
        line('05-roof-accent', 112, 302, 780, 302, 8, cyan),
      ].join('')),
      panel('05-roof-label-plate', 100, 1230, 880, 140, 'background:rgba(110,224,237,.3);border-color:rgba(11,18,28,.18);'),
      text('05-roof-label', 'REMAP THE WORLD', 130, 1266, 820, 59, navy, 'text-align:center;font-weight:800;'),
      text('05-quote', '“This has the effect of remapping the world in the reader’s mind, as centred in the interconnected global south.”', 95, 1410, 890, 74, navy, 'font-size:27px;line-height:1.4;text-align:center;font-weight:500;'),
    ].join('\n'),
    reveals: [
      { selector: '#05-eyebrow', at: 0 }, { selector: '#05-head', at: .18 }, { selector: '#05-roof-building', at: 1.3, from: 0 },
      { selector: '#05-roof-label-plate', at: 3.15, from: -80 }, { selector: '#05-roof-label', at: 3.42, from: 16 }, { selector: '#05-quote', at: 4.65, from: 14 },
    ],
    draws: [{ selector: '#05-roof,#05-roof-accent', at: 1.34 }],
  },
  {
    file: '06-dissect-the-rc.html', id: '06-dissect-the-rc', duration: 6,
    body: [
      text('06-eyebrow', 'AUCTOR VARC', 78, 130, 920, 23, muted, 'letter-spacing:.16em;'),
      svg('06-building-mark', 125, 300, 830, 530, [
        pathLine('06-building-lines', 'M165 450 L165 220 L415 60 L665 220 L665 450 M230 450 L230 240 L415 120 L600 240 L600 450 M140 450 L690 450', 7, navy),
        line('06-building-base', 85, 460, 745, 460, 5, cyan),
      ].join('')),
      ...[
        ['TOPIC','01'],['ROLE','02'],['LOGIC','03'],['MAIN POINT','04'],
      ].map(([label, n], i) => `${panel(`06-step-${i+1}`, 105, 880+i*115, 870, 88, 'background:rgba(110,224,237,.12);border-color:rgba(11,18,28,.14);')}${text(`06-step-num-${i+1}`, n, 132, 905+i*115, 80, 24, muted, 'font-weight:700;letter-spacing:.1em;')}${text(`06-step-label-${i+1}`, label, 250, 900+i*115, 670, 34, navy, 'font-weight:800;letter-spacing:.04em;')}`),
      text('06-cta', 'DON’T JUST READ THE RC.<br>DISSECT IT.', 78, 1378, 770, 53, navy, 'font-weight:800;line-height:1.16;'),
      `<div id="f-06-logo-plate-clip" class="clip" data-start="0" data-duration="6" data-track-index="2" style="left:850px;top:1520px;width:145px;height:62px"><div id="f-06-logo-plate" class="logo-plate" style="width:100%;height:100%"><img src="assets/images/auctor-logo.png" alt="Auctor" style="width:82px;height:auto;object-fit:contain"></div></div>`,
    ].join('\n'),
    reveals: [
      { selector: '#06-eyebrow', at: 0 }, { selector: '#06-building-mark', at: .2, from: 0 },
      ...[1,2,3,4].map((i) => ({ selector: `#06-step-${i}`, at: .92+(i-1)*.52, from: 17 })),
      ...[1,2,3,4].map((i) => ({ selector: `#06-step-num-${i},#06-step-label-${i}`, at: .98+(i-1)*.52, from: 12 })),
      { selector: '#06-cta', at: 3.32, from: 25 }, { selector: '#06-logo-plate', at: 4.0, from: 0, scale: .9 },
    ],
    draws: [{ selector: '#06-building-lines,#06-building-base', at: .22 }],
  },
];

for (const frame of frames) {
  const html = shell(frame.id, frame.duration, frame.body, frame.reveals, frame.draws);
  fs.writeFileSync(path.join(out, frame.file), html);
  console.log(`wrote ${frame.file}`);
}
