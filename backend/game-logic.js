'use strict';

function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function getLimits(grade) {
    const g = Number(grade);
    if (g === 1) return { base: { min:1, max:8,  multiplier:5, dividendMax:5 } };
    if (g === 2) return { base: { min:1, max:15, multiplier:5, dividendMax:8 } };
    if (g === 3) return { base: { min:2, max:20, multiplier:6, dividendMax:10 } };
    if (g === 4) return { base: { min:3, max:28, multiplier:9, dividendMax:12 } };
    if (g === 5) return { base: { min:4, max:40, multiplier:10, dividendMax:14 } };
    return       { base: { min:5, max:60, multiplier:12, dividendMax:16 } };
}

function createOptions(answer) {
    const vals = new Set([answer]);
    let attempts = 0;
    while (vals.size < 4 && attempts < 120) {
        attempts++;
        const spread = Math.max(3, Math.floor(Math.abs(answer) / 3) + 3);
        const delta  = randomBetween(1, spread);
        const candidates = [answer + delta, answer - delta, answer + delta * 2, answer + 1, answer + 2, answer + 3];
        const pick = randomChoice(candidates);
        if (pick >= 0) vals.add(pick);
    }
    let fill = answer + 1;
    while (vals.size < 4) { vals.add(fill++); }
    return shuffle(Array.from(vals)).slice(0, 4);
}

function createQuestion(grade, topic) {
    const lim = getLimits(grade);
    const b = lim.base;
    let prompt = '', answer = 0;

    switch (topic) {
        case 'addition': {
            const x = randomBetween(b.min, b.max), y = randomBetween(b.min, b.max);
            prompt = `${x} + ${y} = ?`; answer = x + y; break;
        }
        case 'subtraction': {
            const x = randomBetween(b.min + 2, b.max), y = randomBetween(b.min, Math.min(x - 1, b.max));
            prompt = `${x} − ${y} = ?`; answer = x - y; break;
        }
        case 'multiplication': {
            const x = randomBetween(1, b.multiplier), y = randomBetween(1, b.multiplier);
            prompt = `${x} × ${y} = ?`; answer = x * y; break;
        }
        case 'division': {
            const y = randomBetween(2, b.multiplier);
            const ans = randomBetween(2, b.dividendMax);
            prompt = `${y * ans} ÷ ${y} = ?`; answer = ans; break;
        }
        case 'number-bonds': {
            const total = randomBetween(4, 10);
            const x = randomBetween(1, total - 1);
            prompt = `${x} + ? = ${total}`; answer = total - x; break;
        }
        case 'compare-numbers': {
            let a = randomBetween(1, 9), c = randomBetween(1, 9);
            while (c === a) c = randomBetween(1, 9);
            prompt = `Manakah yang lebih besar: ${a} atau ${c}?`;
            answer = Math.max(a, c);
            const cmpOpts = [a, c];
            while (cmpOpts.length < 4) {
                const extra = randomBetween(1, 12);
                if (!cmpOpts.includes(extra)) cmpOpts.push(extra);
            }
            return { prompt, answer, options: shuffle(cmpOpts) };
        }
        case 'negative-numbers': {
            const negA = randomBetween(-9, 8);
            let negB = randomBetween(-9, 9);
            while (negB === negA) negB = randomBetween(-9, 9);
            prompt = `Manakah yang lebih kecil: ${negA} atau ${negB}?`;
            answer = Math.min(negA, negB);
            const negOpts = new Set([negA, negB]);
            while (negOpts.size < 4) negOpts.add(randomBetween(-9, 9));
            return { prompt, answer, options: shuffle([...negOpts]) };
        }
        case 'shapes': {
            const shapeQs = [
                { q: `Berapa sudut yang dimiliki lingkaran?`, a: 0 },
                { q: `Berapa sisi yang dimiliki lingkaran?`, a: 1 },
                { q: `Berapa sisi yang dimiliki segi tiga?`, a: 3 },
                { q: `Berapa sisi yang dimiliki persegi?`, a: 4 },
                { q: `Berapa sisi yang dimiliki segi lima?`, a: 5 },
                { q: `Berapa sisi yang dimiliki segi enam?`, a: 6 },
                { q: `Berapa sisi yang dimiliki segi tujuh?`, a: 7 },
                { q: `Berapa sisi yang dimiliki segi delapan?`, a: 8 },
                { q: `Berapa sisi yang dimiliki segi sembilan?`, a: 9 },
                { q: `Berapa sisi yang dimiliki segi sepuluh?`, a: 10 },
                { q: `Berapa sisi yang dimiliki segi sebelas?`, a: 11 },
                { q: `Berapa sisi yang dimiliki segi dua belas?`, a: 12 },
                { q: `Berapa sisi yang dimiliki segi tiga belas?`, a: 13 },
                { q: `Berapa sisi yang dimiliki segi empat belas?`, a: 14 },
                { q: `Berapa sisi yang dimiliki segi lima belas?`, a: 15 },
            ];
            const sq = randomChoice(shapeQs);
            prompt = sq.q; answer = sq.a; break;
        }
        case 'time': {
            const h = randomBetween(1, 12);
            prompt = `Berapa menit dalam ${h} jam?`; answer = h * 60; break;
        }
        case 'place-value': {
            const h = randomBetween(1, 5), pv_t = randomBetween(0, 9), o = randomBetween(0, 9);
            prompt = `${h} ratusan + ${pv_t} puluhan + ${o} satuan = ?`;
            answer = h*100 + pv_t*10 + o; break;
        }
        case 'money': {
            const coins = randomBetween(1, 10);
            prompt = `${coins} coins worth 1 each. Total = ?`; answer = coins; break;
        }
        case 'pecahan': {
            const pfNum = randomBetween(1, 19), pfDen = randomBetween(2, 15);
            const pfType = randomBetween(0, 3);
            if (pfType === 0) {
                prompt = `Pembilang dari ${pfNum}/${pfDen} adalah ?`; answer = pfNum;
            } else if (pfType === 1) {
                prompt = `Penyebut dari ${pfNum}/${pfDen} adalah ?`; answer = pfDen;
            } else if (pfType === 2) {
                const pfDen2 = randomBetween(2, 10);
                const pfA = randomBetween(1, pfDen2), pfB = randomBetween(1, pfDen2);
                if (pfA === pfB) { prompt = `Pembilang dari ${pfNum}/${pfDen}?`; answer = pfNum; }
                else { prompt = `${pfA}/${pfDen2} dan ${pfB}/${pfDen2} — mana pembilang yang lebih besar?`; answer = Math.max(pfA, pfB); }
            } else {
                const pfN2 = randomBetween(1, 8), pfD2 = randomBetween(2, 8);
                prompt = `${pfN2}/${pfD2} × ${pfD2} = ?`; answer = pfN2;
            }
            break;
        }
        case 'luas-keliling': {
            const lkType = randomBetween(0, 3);
            if (lkType === 0) { const s = randomBetween(2, 10); prompt = `Luas persegi sisi ${s} cm = ? cm²`; answer = s * s; }
            else if (lkType === 1) { const s = randomBetween(2, 12); prompt = `Keliling persegi sisi ${s} cm = ? cm`; answer = 4 * s; }
            else if (lkType === 2) { const p = randomBetween(3, 10), l = randomBetween(2, 7); prompt = `Luas persegi panjang ${p} cm × ${l} cm = ? cm²`; answer = p * l; }
            else { const p = randomBetween(3, 12), l = randomBetween(2, 8); prompt = `Keliling persegi panjang p=${p} cm, l=${l} cm = ? cm`; answer = 2 * (p + l); }
            break;
        }
        case 'sudut': {
            const sudutType = randomBetween(0, 5);
            if (sudutType === 0) { prompt = `Sudut siku-siku besarnya = ?°`; answer = 90; }
            else if (sudutType === 1) { prompt = `Sudut lurus besarnya = ?°`; answer = 180; }
            else if (sudutType === 2) { const deg = randomBetween(10, 80); prompt = `Sudut siku-siku (90°) dikurangi sudut lancip ${deg}° = ?°`; answer = 90 - deg; }
            else if (sudutType === 3) { const deg = randomBetween(91, 170); prompt = `Sudut lurus (180°) dikurangi sudut tumpul ${deg}° = ?°`; answer = 180 - deg; }
            else if (sudutType === 4) { prompt = `Total besar sudut dalam segi empat = ?°`; answer = 360; }
            else { const lancip = randomBetween(10, 80); prompt = `Sudut lancip ${lancip}° + sudut siku-siku = ?°`; answer = lancip + 90; }
            break;
        }
        case 'desimal-persen': {
            const dpQs = [
                { q: `50% = 50 / ?`, a: 100 }, { q: `25% = ? / 100`, a: 25 },
                { q: `1/2 = ?%`, a: 50 }, { q: `3/4 = ?%`, a: 75 },
                { q: `1/5 = ?%`, a: 20 }, { q: `1/4 = ?%`, a: 25 },
                { q: `1/10 = ?%`, a: 10 }, { q: `2/5 = ?%`, a: 40 },
                { q: `20% dari 100 = ?`, a: 20 }, { q: `50% dari 200 = ?`, a: 100 },
                { q: `25% dari 400 = ?`, a: 100 }, { q: `10% dari 300 = ?`, a: 30 },
                { q: `75% dari 100 = ?`, a: 75 }, { q: `40% dari 100 = ?`, a: 40 },
                { q: `0,5 × 10 = ?`, a: 5 }, { q: `0,7 × 10 = ?`, a: 7 },
                { q: `0,3 × 10 = ?`, a: 3 }, { q: `0,25 × 100 = ?`, a: 25 },
                { q: `2,5 × 10 = ?`, a: 25 }, { q: `1,25 × 100 = ?`, a: 125 },
                { q: `Pembilang dari 20% (= 20/100) adalah ?`, a: 20 },
                { q: `Penyebut persen selalu ?`, a: 100 },
            ];
            const dpQ = randomChoice(dpQs);
            prompt = dpQ.q; answer = dpQ.a; break;
        }
        case 'multi-add': {
            const x = randomBetween(100, 500), y = randomBetween(100, 500);
            prompt = `${x} + ${y} = ?`; answer = x + y; break;
        }
        case 'multi-sub': {
            const x = randomBetween(300, 900), y = randomBetween(50, x - 50);
            prompt = `${x} − ${y} = ?`; answer = x - y; break;
        }
        case 'fractions': {
            const frType = randomBetween(0, 4);
            if (frType === 0) {
                const den = randomBetween(2, 6), num = randomBetween(1, den - 1), mult = randomBetween(2, 5);
                prompt = `${num}/${den} dari ${den * mult} = ?`; answer = num * mult;
            } else if (frType === 1) {
                const num = randomBetween(1, 9), den = randomBetween(2, 8);
                prompt = `${num}/${den} × ${den} = ?`; answer = num;
            } else if (frType === 2) {
                const den = randomBetween(2, 9), a = randomBetween(1, 5), b = randomBetween(1, 5);
                prompt = `${a}/${den} + ${b}/${den} = ?/${den}`; answer = a + b;
            } else if (frType === 3) {
                const den = randomBetween(4, 12), a = randomBetween(4, 9), b = randomBetween(1, a - 1);
                prompt = `${a}/${den} − ${b}/${den} = ?/${den}`; answer = a - b;
            } else {
                const a = randomBetween(1, 6), b = randomBetween(2, 6), c = randomBetween(1, 6), d = randomBetween(2, 6);
                prompt = `Pembilang dari ${a}/${b} × ${c}/${d} = ?`; answer = a * c;
            }
            break;
        }
        case 'decimals': {
            const choices = [1,2,3,4,5,6,7,8,9];
            const tenths = randomChoice(choices), mult = randomBetween(2, 12) * 10;
            prompt = `0.${tenths} × ${mult} = ?`; answer = Math.round((tenths / 10) * mult); break;
        }
        case 'area': {
            const w = randomBetween(2, 9), h = randomBetween(2, 9);
            prompt = `Luas persegi panjang ${w} × ${h} = ?`; answer = w * h; break;
        }
        case 'mixed': {
            const x = randomBetween(1, 10), y = randomBetween(1, 8), z = randomBetween(2, 4);
            prompt = `${x} + ${y} × ${z} = ?`; answer = x + y * z; break;
        }
        case 'percent': {
            const pct = randomChoice([10,20,25,50,75]), base = randomBetween(2, 10) * 10;
            prompt = `${pct}% of ${base} = ?`; answer = Math.round((pct / 100) * base); break;
        }
        case 'algebra': {
            const algType = randomBetween(0, 5);
            if (algType === 0) { const x = randomBetween(1, 20), add = randomBetween(1, 15); prompt = `x + ${add} = ${x + add}. Nilai x = ?`; answer = x; }
            else if (algType === 1) { const x = randomBetween(5, 25), sub = randomBetween(1, x - 1); prompt = `x − ${sub} = ${x - sub}. Nilai x = ?`; answer = x; }
            else if (algType === 2) { const x = randomBetween(2, 12), coef = randomBetween(2, 6); prompt = `${coef}x = ${coef * x}. Nilai x = ?`; answer = x; }
            else if (algType === 3) {
                const koefs = [{v:'a',k:3},{v:'b',k:2},{v:'a',k:5},{v:'b',k:4},{v:'x',k:3},{v:'y',k:6}];
                const kv = randomChoice(koefs);
                prompt = `Koefisien ${kv.v} pada bentuk ${kv.k}${kv.v} + ... = ?`; answer = kv.k;
            } else if (algType === 4) { const a = randomBetween(2, 8), b = randomBetween(2, 8); prompt = `${a}a + ${b}a = ?a`; answer = a + b; }
            else { const a = randomBetween(3, 10), b = randomBetween(1, a - 1); prompt = `${a}b − ${b}b = ?b`; answer = a - b; }
            break;
        }
        case 'data': {
            const start = randomBetween(1, 8), step = randomBetween(2, 5);
            prompt = `${start}, ${start+step}, ${start+step*2}, ${start+step*3}, ?`;
            answer = start + step * 4; break;
        }
        case '3d-shapes': {
            const shapes3d = [
                ['kubus','sisi',6],['kubus','rusuk',12],['kubus','titik sudut',8],
                ['balok','sisi',6],['balok','rusuk',12],['balok','titik sudut',8],
                ['limas segi empat','sisi',5],['limas segi empat','rusuk',8],['limas segi empat','titik sudut',5],
                ['prisma segitiga','sisi',5],['prisma segitiga','rusuk',9],['prisma segitiga','titik sudut',6],
                ['tabung','sisi',3],['tabung','rusuk',2],['tabung','titik sudut',0],
                ['kerucut','sisi',2],['kerucut','rusuk',1],['kerucut','titik sudut',1],
            ];
            const [sName, sProp, sAns] = randomChoice(shapes3d);
            prompt = `Berapa ${sProp} yang dimiliki ${sName}?`;
            answer = sAns;
            const s3Opts = new Set([sAns]);
            [0,1,2,3,4,5,6,8,9,12].forEach(v => { if (v !== sAns) s3Opts.add(v); });
            return { prompt, answer, options: shuffle([...s3Opts]).slice(0, 4) };
        }
        case 'negative-calc': {
            const ncA = randomBetween(5, 20), ncB = randomBetween(1, 10);
            if (randomBetween(0, 1) === 0) { prompt = `${ncA} + (−${ncB}) = ?`; answer = ncA - ncB; }
            else { prompt = `${ncA} − (−${ncB}) = ?`; answer = ncA + ncB; }
            break;
        }
        case 'measurement': {
            const convs = [
                { q:`1 km = ? m`,a:1000 },{ q:`1 m = ? cm`,a:100 },{ q:`1 cm = ? mm`,a:10 },
                { q:`4 m = ? cm`,a:400 },{ q:`7 cm = ? mm`,a:70 },{ q:`5 m = ? cm`,a:500 },
                { q:`2 m = ? cm`,a:200 },{ q:`3 km = ? m`,a:3000 },{ q:`5 cm = ? mm`,a:50 },
                { q:`2 cm = ? mm`,a:20 },{ q:`4 km = ? m`,a:4000 },{ q:`3 m = ? cm`,a:300 },
                { q:`6 km = ? m`,a:6000 },{ q:`2 km = ? m`,a:2000 },{ q:`5 km = ? m`,a:5000 },
            ];
            const cv = randomChoice(convs); prompt = cv.q; answer = cv.a; break;
        }
        case 'time-units': {
            const timeQs = [
                { q:`1 menit = ? detik`,a:60 },{ q:`4 jam = ? menit`,a:240 },
                { q:`1 hari = ? jam`,a:24 },{ q:`1 minggu = ? hari`,a:7 },
                { q:`1 bulan = ? hari`,a:30 },{ q:`1 tahun = ? bulan`,a:12 },
                { q:`1 windu = ? tahun`,a:8 },{ q:`1 dasawarsa = ? tahun`,a:10 },
                { q:`1 abad = ? tahun`,a:100 },{ q:`1 jam = ? detik`,a:3600 },
                { q:`2 jam = ? menit`,a:120 },{ q:`2 hari = ? jam`,a:48 },
                { q:`2 minggu = ? hari`,a:14 },{ q:`3 jam = ? menit`,a:180 },
                { q:`1 tahun = ? hari`,a:365 },
            ];
            const tq = randomChoice(timeQs); prompt = tq.q; answer = tq.a; break;
        }
        case 'squares': {
            const sqType = randomBetween(0, 3);
            if (sqType === 0) { const n = randomBetween(1, 20); prompt = `${n}² = ?`; answer = n * n; }
            else if (sqType === 1) { const n = randomBetween(1, 20); prompt = `√${n * n} = ?`; answer = n; }
            else if (sqType === 2) { const a = randomBetween(2, 10), b = randomBetween(2, 10); prompt = `${a}² + ${b}² = ?`; answer = a*a + b*b; }
            else { const a = randomBetween(3, 15), b = randomBetween(1, a - 1); prompt = `${a}² − ${b}² = ?`; answer = a*a - b*b; }
            break;
        }
        case 'statistics': {
            const statType = randomBetween(0, 2);
            if (statType === 0) {
                const meanSets = [
                    {d:[6,2,5,7],a:5},{d:[4,8,6,10,2],a:6},{d:[3,9,6],a:6},
                    {d:[2,4,6,8,10],a:6},{d:[10,20,30],a:20},{d:[5,7,9,3],a:6},
                    {d:[1,5,9],a:5},{d:[4,4,4,4],a:4},{d:[7,3,5],a:5},
                    {d:[4,8,6,10,12],a:8},{d:[4,12,8],a:8},{d:[5,10,15,10],a:10},
                    {d:[8,4,6,2],a:5},{d:[6,8,10,12,4],a:8},{d:[7,5,9],a:7},
                ];
                const ms = randomChoice(meanSets);
                prompt = `Mean dari ${ms.d.join(', ')} = ?`; answer = ms.a;
            } else if (statType === 1) {
                const medSets = [
                    {d:[9,2,6,1,7],a:6},{d:[3,1,4,1,5],a:3},{d:[8,4,6,2,10],a:6},
                    {d:[7,3,5],a:5},{d:[9,3,7],a:7},{d:[5,1,3],a:3},
                    {d:[10,6,8,4,2],a:6},{d:[9,1,5],a:5},{d:[4,8,6,2,10],a:6},
                ];
                const mds = randomChoice(medSets);
                prompt = `Median dari ${mds.d.join(', ')} = ?`; answer = mds.a;
            } else {
                const modSets = [
                    {d:[1,7,5,7,3,1,5,7,8,3],a:7},{d:[2,3,2,4,2],a:2},
                    {d:[5,3,5,7,5],a:5},{d:[4,6,4,8,4],a:4},
                    {d:[3,3,5,7,3],a:3},{d:[6,8,6,9,6],a:6},
                ];
                const mods = randomChoice(modSets);
                prompt = `Modus dari ${mods.d.join(', ')} = ?`; answer = mods.a;
            }
            break;
        }
        case 'circle': {
            const circType = randomBetween(0, 4);
            if (circType === 0) { const cD = randomChoice([7,14,21,28,35,42]); prompt = `Keliling lingkaran dengan diameter ${cD} cm = ? cm`; answer = Math.round((22/7)*cD); }
            else if (circType === 1) { const cR = randomChoice([7,14,21]); prompt = `Keliling lingkaran dengan jari-jari ${cR} cm = ? cm`; answer = Math.round(2*(22/7)*cR); }
            else if (circType === 2) { const cR = randomChoice([7,14,21]); prompt = `Luas lingkaran dengan jari-jari ${cR} cm = ? cm²`; answer = Math.round((22/7)*cR*cR); }
            else if (circType === 3) { const cD = randomChoice([14,28,42]); const cR = cD/2; prompt = `Luas lingkaran dengan diameter ${cD} cm = ? cm²`; answer = Math.round((22/7)*cR*cR); }
            else { const cD = randomChoice([14,28,42]); prompt = `Jika d = ${cD} cm, maka jari-jari = ? cm`; answer = cD/2; }
            break;
        }
        case 'volume': {
            const volType = randomBetween(0, 5);
            if (volType === 0) { const s = randomBetween(2, 8); prompt = `Volume kubus sisi ${s} cm = ? cm³`; answer = s*s*s; }
            else if (volType === 1) { const p = randomBetween(2,8), l = randomBetween(2,6), t = randomBetween(2,5); prompt = `Volume balok ${p}×${l}×${t} cm = ? cm³`; answer = p*l*t; }
            else if (volType === 2) { const s = randomBetween(2,6); prompt = `Luas permukaan kubus sisi ${s} cm = ? cm²`; answer = 6*s*s; }
            else if (volType === 3) { const p = randomBetween(3,7), l = randomBetween(2,5), t = randomBetween(2,4); prompt = `Luas permukaan balok ${p}×${l}×${t} cm = ? cm²`; answer = 2*(p*l+p*t+l*t); }
            else if (volType === 4) { const r = randomChoice([7,14]), t = randomBetween(5,15); prompt = `Volume tabung r=${r} cm, t=${t} cm = ? cm³`; answer = Math.round((22/7)*r*r*t); }
            else {
                const combos = [{s:3,V:27,L:54},{s:4,V:64,L:96},{s:5,V:125,L:150},{s:2,V:8,L:24}];
                const c = randomChoice(combos);
                if (randomBetween(0,1)===0) { prompt = `Kubus sisi ${c.s}: Volume = ? cm³`; answer = c.V; }
                else { prompt = `Kubus sisi ${c.s}: Luas Permukaan = ? cm²`; answer = c.L; }
            }
            break;
        }
        default: {
            const x = randomBetween(b.min, b.max), y = randomBetween(b.min, b.max);
            prompt = `${x} + ${y} = ?`; answer = x + y;
        }
    }
    return { prompt, answer, options: createOptions(answer) };
}

function generateQuestions(grade, topic, count = 15) {
    const questions = [];
    const seenPrompts = new Set();
    let attempts = 0;
    const maxAttempts = count * 30;
    while (questions.length < count && attempts < maxAttempts) {
        attempts++;
        const q = createQuestion(Number(grade), topic);
        if (!seenPrompts.has(q.prompt)) {
            seenPrompts.add(q.prompt);
            questions.push({ order: questions.length + 1, ...q });
        }
    }
    return questions;
}

function validateAnswer(userAnswer, correctAnswer) {
    return Number(userAnswer) === Number(correctAnswer);
}

function calculateScore(correct, total) {
    return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function calculateStars(scorePct) {
    if (scorePct >= 80) return 3;
    if (scorePct >= 50) return 2;
    if (scorePct >= 30) return 1;
    return 0;
}

module.exports = { generateQuestions, validateAnswer, calculateScore, calculateStars };
