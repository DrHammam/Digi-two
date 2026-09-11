/* constants.js — static reference data: grades, topics, game types, material content
   Pure data only. Nothing here runs, changes state, or touches the DOM.           */

const _fr = (n, d) => `<span class="frac"><span class="fn">${n}</span><span class="fd">${d}</span></span>`;

/* ── Grade & Topic data ── */
const GRADES = {
    1: { name:'Grade 1', nameId:'Kelas 1', topics:[
        { id:'place-value',    title:'Ones, Tens & Hundreds', titleId:'Satuan, Puluhan & Ratusan',  description:'Place value of numbers.',          descriptionId:'Nilai tempat bilangan.' },
        { id:'compare-numbers',title:'Value Comparison',      titleId:'Perbandingan Nilai',          description:'Compare using >, <, =.',           descriptionId:'Bandingkan dengan >, <, =.' },
        { id:'addition',       title:'Addition',              titleId:'Penjumlahan',                 description:'Add small numbers together.',      descriptionId:'Menjumlahkan bilangan.' },
        { id:'subtraction',    title:'Subtraction',           titleId:'Pengurangan',                 description:'Take away and find what remains.', descriptionId:'Mengurangkan dan temukan sisa.' }
    ]},
    2: { name:'Grade 2', nameId:'Kelas 2', topics:[
        { id:'negative-numbers',title:'Negative Numbers', titleId:'Bilangan Negatif', description:'Numbers less than zero.',          descriptionId:'Bilangan yang nilainya di bawah nol.' },
        { id:'shapes',          title:'Flat Shapes',      titleId:'Bangun Datar',     description:'Recognize 2D shapes.',             descriptionId:'Mengenal bangun datar dan sifatnya.' },
        { id:'multiplication',  title:'Multiplication',   titleId:'Perkalian',         description:'Repeated addition.',              descriptionId:'Penjumlahan berulang.' },
        { id:'division',        title:'Division',         titleId:'Pembagian',          description:'Split into equal parts.',         descriptionId:'Memotong menjadi bagian yang sama besar.' }
    ]},
    3: { name:'Grade 3', nameId:'Kelas 3', topics:[
        { id:'pecahan',       title:'Fractions',         titleId:'Pecahan',          description:'Parts of a whole.',                  descriptionId:'Bagian dari keseluruhan, pembilang & penyebut.' },
        { id:'luas-keliling', title:'Area & Perimeter',  titleId:'Luas & Keliling',  description:'Formulas for squares and rectangles.', descriptionId:'Rumus luas dan keliling.' },
        { id:'sudut',         title:'Angles',            titleId:'Sudut',            description:'Acute, right, obtuse, straight.',    descriptionId:'Sudut lancip, siku-siku, tumpul, dan lurus.' },
        { id:'desimal-persen',title:'Decimals & Percent',titleId:'Desimal & Persen', description:'Decimal place values and percent.',   descriptionId:'Nilai desimal, pembulatan, dan persen.' }
    ]},
    4: { name:'Grade 4', nameId:'Kelas 4', topics:[
        { id:'3d-shapes',    title:'3D Shapes',                    titleId:'Bangun Ruang',                description:'Cubes, cuboids, cylinders.',          descriptionId:'Kubus, balok, tabung, dan lainnya.' },
        { id:'negative-calc',title:'Negative Number Calculations', titleId:'Perhitungan Bilangan Negatif', description:'Sign rules for negatives.',           descriptionId:'Aturan tanda bilangan negatif.' },
        { id:'measurement',  title:'Length & Weight Units',        titleId:'Satuan Panjang & Berat',       description:'Convert between metric units.',       descriptionId:'Konversi antar satuan metrik.' },
        { id:'time-units',   title:'Time Units',                   titleId:'Satuan Waktu',                 description:'Minutes, hours, days, years.',        descriptionId:'Menit, jam, hari, bulan, tahun.' }
    ]},
    5: { name:'Grade 5', nameId:'Kelas 5', topics:[
        { id:'fractions', title:'Fraction Calculations',titleId:'Perhitungan Pecahan',  description:'Add, subtract, multiply, divide fractions.', descriptionId:'Jumlah, kurang, kali, dan bagi pecahan.' },
        { id:'squares',   title:'Squares & Square Roots',titleId:'Pangkat Dua & Akar', description:'n² and √n with perfect squares.',             descriptionId:'n² dan √n dengan bilangan kuadrat.' },
        { id:'statistics',title:'Mean, Median & Mode',   titleId:'Mean, Median & Modus',description:'Analyse data sets.',                           descriptionId:'Analisis dan rangkum kumpulan data.' }
    ]},
    6: { name:'Grade 6', nameId:'Kelas 6', topics:[
        { id:'algebra',title:'Basic Algebra',        titleId:'Aljabar Dasar',         description:'Variables, coefficients, equations.', descriptionId:'Variabel, koefisien, dan persamaan.' },
        { id:'circle', title:'Circles',              titleId:'Lingkaran',             description:'Circumference and area of circles.',  descriptionId:'Bagian lingkaran, keliling, dan luas.' },
        { id:'volume', title:'Volume & Surface Area',titleId:'Volume & Luas Permukaan',description:'Formulas for 3D shapes.',           descriptionId:'Rumus-rumus bangun ruang.' }
    ]}
};

const GAME_TYPES = [
    { id:'quiz', title:'Quiz Quest',       titleId:'Kuis',            icon:'🎯', description:'Choose the correct answer!',              descriptionId:'Pilih jawaban yang benar!' },
    { id:'drag', title:'Drag & Drop',      titleId:'Drag and Drop',   icon:'✋', description:'Drag or click the right number!',          descriptionId:'Seret atau ketuk angka yang benar!' },
    { id:'fill', title:'Fill-in',          titleId:'Isi Jawaban',     icon:'✏️', description:'Type the right number!',                   descriptionId:'Ketik angka yang benar!' },
    { id:'match',title:'Card Pairing',     titleId:'Pasangkan Kartu', icon:'🃏', description:'Match each question to its answer!',       descriptionId:'Cocokkan soal dengan jawabannya!' },
    { id:'dino', title:'Dino Jump',        titleId:'Dino Jump',       icon:'🦕', description:'Jump over wrong answers, catch the right!', descriptionId:'Lompati yang salah, tangkap yang benar!' }
];

const GRADE_INFO = {
    1:{ emoji:'🍎', taglineId:'Ayo mulai menghitung!' },
    2:{ emoji:'🌟', taglineId:'Negatif, bangun datar & lainnya!' },
    3:{ emoji:'🌿', taglineId:'Saatnya tabel perkalian!' },
    4:{ emoji:'🚀', taglineId:'Bangun ruang, satuan & lainnya!' },
    5:{ emoji:'🦋', taglineId:'Pecahan, kuadrat & statistik!' },
    6:{ emoji:'🏆', taglineId:'Aljabar, lingkaran & volume!' }
};

const GRADE_TAG_COLORS = { 1:'#FF6B6B', 2:'#FF9F43', 3:'#E0A800', 4:'#05C46B', 5:'#A55EEA', 6:'#0652DD' };

const GRADE13_GAME_MAP = {
    1: { 'place-value':'drag', 'compare-numbers':'quiz', 'addition':'quiz', 'subtraction':'drag' },
    2: { 'negative-numbers':'fill', 'shapes':'match', 'multiplication':'quiz', 'division':'drag' },
    3: { 'pecahan':'quiz', 'luas-keliling':'fill', 'sudut':'match', 'desimal-persen':'quiz' }
};

const GRADE13_COLORS = [
    { bg:'linear-gradient(145deg,#783dc2,#a555f7)', shadow:'#5f1ea9' },
    { bg:'linear-gradient(145deg,#c44f8a,#e06ab3)', shadow:'#9e2e6b' },
    { bg:'linear-gradient(145deg,#636100,#8f8c00)', shadow:'#4a4900' },
    { bg:'linear-gradient(145deg,#2e9e62,#3dc47a)', shadow:'#1e7a49' }
];

const TOPIC_EMOJIS = {
    'addition':'➕','subtraction':'➖','compare-numbers':'⚖️','place-value':'🏠',
    'negative-numbers':'➖','shapes':'🔺','multiplication':'✖️','division':'➗',
    'pecahan':'🍕','luas-keliling':'📐','sudut':'📐','desimal-persen':'💯',
    '3d-shapes':'📦','negative-calc':'➕➖','measurement':'📏','time-units':'⏱️',
    'fractions':'🍕','squares':'²√','statistics':'📊',
    'algebra':'🔤','circle':'⭕','volume':'📦'
};

/* ── Display helpers ── */
function getGradeName(g)       { return GRADES[g]?.nameId || GRADES[g]?.name || g; }
function getTagline(g)         { return GRADE_INFO[g]?.taglineId || ''; }
function getTopicTitle(tp)     { return tp.titleId || tp.title; }
function getTopicDesc(tp)      { return tp.descriptionId || tp.description; }
function getGameTitle(gm)      { return gm.titleId || gm.title; }
function getGameDesc(gm)       { return gm.descriptionId || gm.description; }
function getMaterialBody(m)    { return m.bodyId || m.body || '<p>Coming soon!</p>'; }
function getMaterialExample(m) { return m.exampleId || m.example; }
function displayGradeName(name) {
    const m = name.match(/Grade (\d)/);
    return m ? `Kelas ${m[1]}` : name;
}
function displayTopicTitle(topicId, gradeName) {
    const gradeNum = Object.entries(GRADES).find(([,d]) => d.name === gradeName)?.[0];
    if (!gradeNum) return topicId;
    const tp = GRADES[gradeNum].topics.find(t => t.id === topicId);
    return tp ? getTopicTitle(tp) : topicId;
}

/* ── Material content (HTML learning materials, display-only) ── */
const MATERIAL_CONTENT = {
  1: {
    _pdf:'materials/materi-level1.pdf',
    'place-value':{ emoji:'🏠',
      bodyId:`<p><strong>Nilai tempat</strong> adalah nilai dari sebuah angka yang menunjukkan letaknya pada suatu bilangan.</p><ul><li>🟢 <strong>Satuan</strong>: 0–9</li><li>🔵 <strong>Puluhan</strong>: 10–99</li><li>🔴 <strong>Ratusan</strong>: 100–999</li></ul>`,
      exampleId:`✏️ Contoh: 214\n→ 2 = Ratusan, 1 = Puluhan, 4 = Satuan\n\nLatihan:\n• 741 = 7 ratusan + 4 puluhan + 1 satuan`,
      visual:'2️⃣1️⃣4️⃣  →  Ratusan:2 | Puluhan:1 | Satuan:4' },
    'compare-numbers':{ emoji:'⚖️',
      bodyId:`<p>Gunakan <strong>garis bilangan</strong>: angka paling kiri = paling kecil, kanan = paling besar.</p><ul><li><strong>&gt;</strong> = Lebih Besar &nbsp;→&nbsp; 7 &gt; 4</li><li><strong>&lt;</strong> = Lebih Kecil &nbsp;→&nbsp; 2 &lt; 9</li><li><strong>=</strong> = Sama Dengan &nbsp;→&nbsp; 5 = 5</li></ul>`,
      exampleId:`✏️ Latihan:\n• 9 ... 21  → 9 < 21\n• 15 ... 7  → 15 > 7`,
      visual:'← Kecil   0  1  2  3  4  5  6  7  8  9   Besar →' },
    'addition':{ emoji:'➕',
      bodyId:`<p><strong>Penjumlahan</strong> — menggabungkan dua bilangan untuk mendapatkan nilai yang lebih besar.</p><ul><li>3 + 5 = 5 + 3 = 8 (urutan tidak mempengaruhi hasil)</li><li>Angka berapa pun + 0 = angka itu sendiri</li></ul>`,
      exampleId:`✏️ 2 + 5 = 7\nLatihan: 3+2=5  |  4+5=9  |  6+6=12`,
      visual:'2 🥕 + 5 🥕 = 7 🥕' },
    'subtraction':{ emoji:'➖',
      bodyId:`<p><strong>Pengurangan</strong> — mengambil sebagian dari suatu bilangan untuk menemukan sisanya.</p><ul><li>Angka berapa pun − 0 = angka itu sendiri</li><li>Kebalikan dari penjumlahan</li></ul>`,
      exampleId:`✏️ 6 − 2 = 4\nLatihan: 5-2=3  |  8-4=4  |  12-5=7`,
      visual:'🎩🎩🎩🎩🎩🎩 − 🎩🎩 = 🎩🎩🎩🎩' }
  },
  2: {
    _pdf:'materials/materi-kelas-2.pdf',
    'negative-numbers':{ emoji:'➖',
      bodyId:`<p><strong>Bilangan negatif</strong> nilainya di bawah nol, terletak di kiri angka 0 pada garis bilangan.</p><ul><li>Ditulis: −1, −2, −3, …</li><li>Semakin ke kiri → semakin <strong>kecil</strong></li></ul>`,
      exampleId:`✏️ Latihan:\n• −4 ... −9  →  −4 > −9\n• −9 ... 2   →  −9 < 2`,
      visual:'←  −5  −4  −3  −2  −1  |0|  1  2  3  →' },
    'shapes':{ emoji:'🔺',
      bodyId:`<p><strong>Bangun datar</strong> — bentuk 2D yang memiliki sisi dan titik sudut.</p><ul><li>⭕ Lingkaran = 0 sisi</li><li>🔺 Segi Tiga = 3 sisi, 3 sudut</li><li>🟥 Persegi = 4 sisi sama, 4 sudut</li><li>▬ Persegi Panjang = 4 sisi, 4 sudut</li></ul>`,
      exampleId:`✏️ Bola → Lingkaran  |  Pizza → Segi Tiga  |  Papan catur → Persegi`,
      visual:'⭕ Lingkaran  🔺 Segi Tiga  🟥 Persegi  ▬ Persegi Panjang' },
    'multiplication':{ emoji:'✖️',
      bodyId:`<p><strong>Perkalian</strong> = penjumlahan berulang: 2 × 3 = 2+2+2 = 6</p><ul><li>Angka × 0 = 0</li><li>Angka × 1 = angka itu sendiri</li><li>Urutan tidak mengubah hasil: 2×3 = 3×2</li></ul>`,
      exampleId:`✏️ Latihan: 3×2=6  |  4×5=20  |  6×2=12  |  7×3=21`,
      visual:'2×3=6   4×5=20   6×2=12' },
    'division':{ emoji:'➗',
      bodyId:`<p><strong>Pembagian</strong> = memotong bilangan menjadi bagian yang sama besar.</p><ul><li>8 ÷ 2 = 4 (bagi 8 menjadi kelompok 2 → ada 4 kelompok)</li><li>Kebalikan perkalian: 2×4=8, maka 8÷2=4</li><li>Tidak bisa bagi dengan 0!</li></ul>`,
      exampleId:`✏️ Latihan: 6÷2=3  |  10÷5=2  |  12÷3=4`,
      visual:'8÷2=4   6÷2=3   10÷5=2' }
  },
  3: {
    _pdf:'materials/materi-kelas-3.pdf',
    'pecahan':{ emoji:'🍕',
      bodyId:`<p><strong>Pecahan</strong> menunjukkan bagian dari keseluruhan.</p><ul><li>📌 <strong>Pembilang</strong> = angka atas (bagian yang diambil)</li><li>📌 <strong>Penyebut</strong> = angka bawah (jumlah bagian keseluruhan)</li></ul>`,
      exampleId:`✏️ 5/4 → Pembilang=5, Penyebut=4\nLatihan: 1/5 (p=1,py=5)  |  9/2 (p=9,py=2)`,
      visual:'1/2 🟡 | 2/4 🟢 | 4/8 🔵  (semua = setengah)' },
    'luas-keliling':{ emoji:'📐',
      bodyId:`<p><strong>Luas</strong> = besar permukaan (cm²). <strong>Keliling</strong> = panjang semua sisi.</p><ul><li>🟪 Persegi: L = s×s &nbsp;|&nbsp; K = 4×s</li><li>🟥 Persegi Panjang: L = p×l &nbsp;|&nbsp; K = 2×(p+l)</li></ul>`,
      exampleId:`✏️ Persegi s=4: L = 16 cm², K = 16 cm\nPersegi panjang p=7, l=4: L = 28 cm², K = 22 cm`,
      visual:'🟪 L=s×s  K=4s   |   🟥 L=p×l  K=2(p+l)' },
    'sudut':{ emoji:'📐',
      bodyId:`<p><strong>Sudut</strong> = pertemuan dua garis, diukur dalam derajat (°).</p><ul><li>📐 Lancip: 0°–90°</li><li>⬛ Siku-siku: 90°</li><li>📏 Tumpul: 90°–180°</li><li>↔️ Lurus: 180°</li></ul>`,
      exampleId:`✏️ 45° → Lancip  |  90° → Siku-siku  |  120° → Tumpul  |  180° → Lurus`,
      visual:'Lancip <90°  |  Siku-siku =90°  |  Tumpul >90°  |  Lurus =180°' },
    'desimal-persen':{ emoji:'💯',
      bodyId:`<p><strong>Desimal</strong> — bilangan pecahan ditulis dengan koma. <strong>Persen (%)</strong> = bagian dari 100.</p><ul><li>2,5 = 25/10 &nbsp;|&nbsp; 60% = 60/100 = 0,60</li><li>1/2 = 50% &nbsp;|&nbsp; 3/4 = 75% &nbsp;|&nbsp; 1/5 = 20%</li></ul>`,
      exampleId:`✏️ Pembulatan: 0,436 → 0,44  |  0,432 → 0,43\nPersen: 40% = 2/5  |  1/2 = 50%`,
      visual:'1/2=50%  |  1/4=25%  |  3/4=75%  |  1/5=20%' }
  },
  4: {
    _pdf:'materials/materi-kelas-4.pdf',
    '3d-shapes':{ emoji:'📦',
      bodyId:`<p><strong>Bangun ruang</strong> — bentuk 3D yang menempati ruang.</p><ul><li>📦 Kubus: 6 sisi, 12 rusuk, 8 titik sudut</li><li>🧱 Balok: 6 sisi, 12 rusuk, 8 titik sudut</li><li>🟢 Bola: 1 permukaan, 0 rusuk</li><li>🥫 Tabung: 3 sisi, 2 rusuk</li><li>🔺 Limas segi empat: 5 sisi, 8 rusuk, 5 titik sudut</li></ul>`,
      exampleId:`✏️ Rubik → Kubus  |  Kaleng → Tabung  |  Kotak sepatu → Balok`,
      visual:'📦Kubus  🧱Balok  🟢Bola  🥫Tabung  🔺Limas' },
    'negative-calc':{ emoji:'🔢',
      bodyId:`<p><strong>Aturan tanda:</strong></p><ul><li>(+)(−) = negatif &nbsp;|&nbsp; (−)(+) = negatif</li><li>(−)(−) = positif → <em>dua negatif = positif!</em></li></ul>`,
      exampleId:`✏️ 20 + (−8) = 12  |  8 − (−6) = 14\nLatihan: 15+(−7)=8  |  3−(−9)=12`,
      visual:'(+)(−)=−   (−)(+)=−   (−)(−)=+' },
    'measurement':{ emoji:'📏',
      bodyId:`<p>Satuan panjang — <strong>tangga</strong>: tiap anak tangga ×10 ke bawah, ÷10 ke atas.</p><p>Km → Hm → Dam → M → Dm → Cm → Mm</p><p>Berat: Kg → Hg → Dag → g → Dg → Cg → Mg</p>`,
      exampleId:`✏️ 5 km → m : turun 3 tangga → ×1.000 → 5.000 m\n17 kg → Dag : turun 2 tangga → ×100 → 1.700 Dag`,
      visual:'Km→Hm→Dam→M→Dm→Cm→Mm  (×10 tiap tangga ke bawah)' },
    'time-units':{ emoji:'⏱️',
      bodyId:`<p><strong>Satuan waktu:</strong></p><ul><li>1 menit = 60 detik &nbsp;|&nbsp; 1 jam = 60 menit = 3.600 detik</li><li>1 hari = 24 jam &nbsp;|&nbsp; 1 minggu = 7 hari &nbsp;|&nbsp; 1 bulan = 30 hari</li><li>1 tahun = 12 bulan &nbsp;|&nbsp; 1 windu = 8 tahun &nbsp;|&nbsp; 1 abad = 100 tahun</li></ul>`,
      exampleId:`✏️ 2 jam = 120 menit  |  3 minggu = 21 hari  |  2 abad = 200 tahun`,
      visual:'60s=1min  60min=1jam  24jam=1hari  7hari=1minggu' }
  },
  5: {
    _pdf:'materials/materi-kelas-5.pdf',
    'fractions':{ emoji:'🍕',
      bodyId:`<p><strong>Penjumlahan/Pengurangan</strong> — samakan penyebut: ${_fr(1,2)} + ${_fr(2,3)} → ${_fr(3,6)} + ${_fr(4,6)} = ${_fr(7,6)}</p><p><strong>Perkalian</strong> — kalikan langsung: ${_fr(5,2)} × ${_fr(4,3)} = ${_fr(20,6)}</p><p><strong>Pembagian</strong> — balik lalu kali: ${_fr(2,4)} ÷ ${_fr(3,5)} = ${_fr(2,4)} × ${_fr(5,3)} = ${_fr(10,12)}</p>`,
      exampleId:`✏️ ${_fr(1,2)} + ${_fr(2,3)} = ${_fr(7,6)}  |  ${_fr(5,2)} × ${_fr(4,3)} = ${_fr(20,6)}`,
      visual:`${_fr(1,2)}+${_fr(1,3)}=${_fr(5,6)}` },
    'squares':{ emoji:'²√',
      bodyId:`<p><strong>Pangkat Dua</strong>: n² = n×n &nbsp;→&nbsp; 3²=9, 10²=100</p><table style="width:100%;border-collapse:collapse;font-size:.85em;text-align:center"><tr style="background:#f0e6ff"><td>1²=1</td><td>2²=4</td><td>3²=9</td><td>4²=16</td><td>5²=25</td></tr><tr><td>6²=36</td><td>7²=49</td><td>8²=64</td><td>9²=81</td><td>10²=100</td></tr></table><p><strong>Akar Kuadrat</strong>: √25=5 karena 5×5=25</p>`,
      exampleId:`✏️ √1=1  √4=2  √9=3  √16=4  √25=5  √36=6  √49=7  √64=8  √81=9  √100=10`,
      visual:'3²=9   5²=25   √36=6   √81=9' },
    'statistics':{ emoji:'📊',
      bodyId:`<p><strong>Mean</strong> = jumlah ÷ banyak data: [6,2,5,7] → 20÷4 = 5</p><p><strong>Median</strong> = nilai tengah setelah diurutkan: [1,2,<b>6</b>,7,9] → 6</p><p><strong>Modus</strong> = nilai paling sering muncul: [1,7,5,7,3] → 7</p>`,
      exampleId:`✏️ Data: 6,2,5,7 → Mean=5  |  Data: 9,2,6,1,7 → Median=6`,
      visual:'Mean=rata-rata  Median=tengah  Modus=terbanyak' }
  },
  6: {
    _pdf:'materials/materi-kelas-6.pdf',
    'algebra':{ emoji:'🔤',
      bodyId:`<p>Aljabar menggunakan <strong>angka dan huruf</strong> untuk nilai yang belum diketahui.</p><ul><li><strong>Variabel</strong>: huruf pengganti (a, b, x)</li><li><strong>Koefisien</strong>: angka di depan variabel. Contoh: 3a → koef=3</li><li><strong>Konstanta</strong>: angka berdiri sendiri</li><li><strong>Suku sejenis</strong>: 3a + 2a = 5a</li></ul>`,
      exampleId:`✏️ 3a+2b−4: koef a=3, koef b=2, konstanta=4\nPersamaan: x+5=12 → x=7  |  2x=14 → x=7`,
      visual:'3a+2b−4 | Variabel:a,b | Koefisien:3,2' },
    'circle':{ emoji:'⭕',
      bodyId:`<p>Lingkaran — kumpulan titik berjarak sama dari satu titik pusat.</p><ul><li><strong>Jari-jari (r)</strong>: pusat ke tepi (r = d÷2)</li><li><strong>Diameter (d)</strong>: melalui pusat (d = 2r)</li></ul><p><strong>K = π×d</strong> &nbsp;|&nbsp; <strong>L = π×r²</strong></p><p>π = ${_fr(22,7)} jika r/d kelipatan 7 &nbsp;|&nbsp; π = 3,14 lainnya</p>`,
      exampleId:`✏️ d=28 cm:\nK = 22/7 × 28 = 88 cm\nL = 22/7 × 14² = 616 cm²`,
      visual:'K=π×d   L=π×r²   d=2r   r=d÷2' },
    'volume':{ emoji:'📦',
      bodyId:`<table style="width:100%;border-collapse:collapse;font-size:.85em"><tr style="background:#f0e6ff;font-weight:bold"><td style="padding:4px 8px">Bangun</td><td style="padding:4px 8px">Luas Permukaan</td><td style="padding:4px 8px">Volume</td></tr><tr><td style="padding:4px 8px">📦 Kubus (s)</td><td style="padding:4px 8px">6×s²</td><td style="padding:4px 8px">s³</td></tr><tr style="background:#faf0ff"><td style="padding:4px 8px">🧱 Balok (p,l,t)</td><td style="padding:4px 8px">2×(pl+pt+lt)</td><td style="padding:4px 8px">p×l×t</td></tr><tr><td style="padding:4px 8px">🥫 Tabung (r,t)</td><td style="padding:4px 8px">2×π×r×(r+t)</td><td style="padding:4px 8px">π×r²×t</td></tr><tr style="background:#faf0ff"><td style="padding:4px 8px">🟢 Bola (r)</td><td style="padding:4px 8px">4×π×r²</td><td style="padding:4px 8px">${_fr(4,3)}×π×r³</td></tr></table>`,
      exampleId:`✏️ Kubus s=4: V=64cm³  |  Balok 5×3×2: V=30cm³  |  Tabung r=7,t=10: V=1540cm³`,
      visual:'Kubus:V=s³  Balok:V=plt  Tabung:V=πr²t' }
  }
};
