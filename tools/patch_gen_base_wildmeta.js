// tools/patch_gen_base_wildmeta.js
//
// 用途: 给 GEN_BASE 24 个曾在 wild/pending 状态的武将加 wildMeta 字段
//       (源数据: src/data/generals.js 内 WILD_GEN_META const, 24 entries)
//
// 设计: wildMeta = { title, post } 是 cross-scenario 跨剧本默认人物标签
//       scenario.generals.wildData 可 override.
//       字段插入在 "debutYear": ..., 之后.
//
// 用法: node tools/patch_gen_base_wildmeta.js

const fs = require('fs');
const { execSync } = require('child_process');

const FILE = 'src/data/general_base.js';

// 从 WILD_GEN_META (src/data/generals.js L66-93) 抄录的 24 entries (只取 title/post)
const WILD_META = {
  '徐庶':   { title:'单福·颍川名士', post:{ name:'军师',rank:'文官',desc:'早年化名单福投刘备，智谋出众，识人极准。' } },
  '陈宫':   { title:'宁死不屈',       post:{ name:'谋主',rank:'文官',desc:'智谋深远，尤擅分析天下大势，主公决策准确率+15%。' } },
  '田丰':   { title:'刚而犯上',       post:{ name:'上计',rank:'文官',desc:'内政全才，己方城市粮产+6%，人口增长+5%。' } },
  '沮授':   { title:'河北谋主',       post:{ name:'监军',rank:'文官',desc:'军政双修，行军期间部队粮耗-10%，补给线不易被截断。' } },
  '张松':   { title:'倒持西蜀',       post:{ name:'别驾',rank:'文官',desc:'熟知益州山川地理，己方在蜀地行军AP消耗-20%。' } },
  '庞德':   { title:'抬棺决死',       post:{ name:'先锋',rank:'将',desc:'万人敌之勇，正面冲阵时部队战力+12%。' } },
  '文聘':   { title:'荆州柱石',       post:{ name:'守将',rank:'将',desc:'长于守备，驻守城市防御加成+15%。' } },
  '高顺':   { title:'陷阵营统领',     post:{ name:'陷阵将',rank:'将',desc:'统率陷阵营，所部重步兵战力+18%，营寨战强攻成功率+15%。' } },
  '李严':   { title:'托孤重臣',       post:{ name:'尚书令',rank:'文官',desc:'蜀汉重臣，主持内政可加速建设速度-1旬。' } },
  '邓艾':   { title:'偷渡阴平',       post:{ name:'合围',rank:'将',desc:'善用险道奇兵，山地行军AP消耗减半，奇袭成功率+20%。' } },
  '钟会':   { title:'志大才疏',       post:{ name:'谋帅',rank:'文官',desc:'文武兼备，统率与智谋均衡，伏击识破率+25%。' } },
  '孟达':   { title:'反复无常',       post:{ name:'守将',rank:'将',desc:'善守关隘，驻守山城防御加成+10%。' } },
  '申耽':   { title:'上庸豪族',       post:{ name:'郡守',rank:'将',desc:'上庸地方豪族，驻守上庸城城防+8%。' } },
  '马谡':   { title:'言过其实',       post:{ name:'参军',rank:'文官',desc:'熟读兵书，制定作战计划时战力评估误差-10%。' } },
  '郝昭':   { title:'陈仓坚守',       post:{ name:'守将',rank:'将',desc:'守城专家，攻城方攻城兵器效果对己方城市减半。' } },
  '张任':   { title:'落凤之弓',       post:{ name:'先锋',rank:'将',desc:'蜀道险关守将，山地伏击成功率+20%。' } },
  '杨洪':   { title:'蜀中干吏',       post:{ name:'郡守',rank:'文官',desc:'精于内政，辖区人口增长+8%，民心稳定。' } },
  '蒋琬':   { title:'社稷之器',       post:{ name:'丞相继任',rank:'文官',desc:'诸葛亮身后蜀汉柱石，内政全面加成+8%。' } },
  '费祎':   { title:'折冲良臣',       post:{ name:'大将军',rank:'文官',desc:'调和文武，外交行动成功率+15%。' } },
  '向宠':   { title:'出师表所荐',     post:{ name:'中领军',rank:'将',desc:'公允持平，麾下部队士气稳定，不会因欠饷骤降。' } },
  '姜维':   { title:'天水麒麟儿',     post:{ name:'镇军将军',rank:'将',desc:'文武双全，诸葛亮衣钵传人，蜀汉后期柱石。' } },
  '文鸯':   { title:'单骑退雄兵',     post:{ name:'前将军',rank:'将',desc:'勇冠三军，单骑冲阵退敌。' } },
  '羊祜':   { title:'襄阳儒帅',       post:{ name:'征南大将军',rank:'文官',desc:'以德服人，镇守襄阳，为灭吴奠基。' } },
  '王濬':   { title:'楼船灭吴',       post:{ name:'龙骧将军',rank:'将',desc:'建造楼船，顺江而下灭吴，水军统帅。' } },
};

let text = fs.readFileSync(FILE, 'utf8');
const before = text;
const patched = [];
const skipped = [];

function entryAlreadyHasWildMeta(text, name) {
  const entryStart = text.indexOf(`"${name}":`);
  if (entryStart < 0) return false;
  // entry 结束: 下一个 `\n  "<name>":` (顶层 entry indent=2)
  const nextEntryRe = /\n  "[^"]+":\s*\{/;
  const after = text.slice(entryStart + name.length + 5);
  const nm = after.match(nextEntryRe);
  const entryEnd = nm ? entryStart + name.length + 5 + nm.index : text.length;
  const entryBlock = text.slice(entryStart, entryEnd);
  return entryBlock.includes('"wildMeta"');
}

for (const [name, meta] of Object.entries(WILD_META)) {
  if (entryAlreadyHasWildMeta(text, name)) {
    skipped.push(`${name} (already has wildMeta)`);
    continue;
  }
  // 多行格式: 找 `"debutYear": <num>,\n    "birthplace":` 或单行 `"debutYear": <num>, "birthplace":`
  // 在 "debutYear": ..., 后插入 "wildMeta": {...}, 同 indent
  // 用 single-line JSON 嵌入 (避免缩进问题, 多行/单行 entries 都 work)
  const wildMetaJson = JSON.stringify(meta);
  // 多行版本 regex
  const multilineRe = new RegExp(`("${name}":\\s*\\{[\\s\\S]*?"debutYear":\\s*\\d+,)(\\s*\\n\\s*)("birthplace":)`);
  const m1 = text.match(multilineRe);
  if (m1) {
    text = text.replace(multilineRe, (match, p1, p2, p3) =>
      `${p1}${p2}"wildMeta": ${wildMetaJson},${p2}${p3}`
    );
    patched.push(name);
    continue;
  }
  // 单行版本 regex
  const singlelineRe = new RegExp(`("${name}":\\s*\\{[^}]*?"debutYear":\\s*\\d+,)\\s*("birthplace":)`);
  const m2 = text.match(singlelineRe);
  if (m2) {
    text = text.replace(singlelineRe, (match, p1, p2) =>
      `${p1} "wildMeta": ${wildMetaJson}, ${p2}`
    );
    patched.push(name);
    continue;
  }
  skipped.push(`${name} (entry/format not matched)`);
}

fs.writeFileSync(FILE, text, 'utf8');
console.log(`Patched: ${patched.length} / ${Object.keys(WILD_META).length}`);
if (skipped.length) console.log(`Skipped: ${skipped.length} — ${skipped.join(', ')}`);

try {
  execSync(`node --check ${FILE}`, { stdio: 'pipe' });
  console.log('Syntax OK');
} catch (e) {
  console.error('❌ Syntax error, reverting');
  fs.writeFileSync(FILE, before, 'utf8');
  process.exit(1);
}
