const PREPARING = {
  "crewmate.mct-official.com": "CREWMATE",
  "texroot.mct-official.com": "TEXROOT",
};

function preparationResponse(name) {
  const isCrewmate = name === "CREWMATE";
  const description = isCrewmate
    ? "クリエイター、コミュニティ、制作活動をつなぐプロジェクト。"
    : "PC・テクノロジー、プロダクト、実験的なアイデアを扱うブランド。";
  const eyebrow = isCrewmate ? "CREATIVE COMMUNITY / 01" : "TECH & PRODUCTS / 02";
  const accent = isCrewmate ? "#a8ff4d" : "#6ee7ff";
  const accentSoft = isCrewmate ? "rgba(168,255,77,.12)" : "rgba(110,231,255,.12)";
  const indexLabel = isCrewmate ? "CREW" : "TEX";
  const copy = isCrewmate
    ? "つくる人が集まり、作品とプロジェクトが動き出す場所へ。"
    : "技術を試し、プロダクトに変え、次の体験をつくる場所へ。";
  const secondary = isCrewmate
    ? "制作・発信・コラボレーションを支えるサービスを準備しています。"
    : "PC・テクノロジー領域を中心に、新しいプロダクトを準備しています。";

  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#07090d">
<meta name="description" content="${description}">
<title>${name} — MCT Official</title>
<style>
:root{--accent:${accent};--accent-soft:${accentSoft};--bg:#07090d;--panel:rgba(255,255,255,.055);--line:rgba(255,255,255,.11);--muted:#9aa3b2;--text:#f4f7fb}
*{box-sizing:border-box}
html{background:var(--bg)}
body{margin:0;min-height:100vh;color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;background:radial-gradient(900px 500px at 80% 0%,var(--accent-soft),transparent 62%),radial-gradient(700px 450px at 0% 100%,rgba(255,255,255,.035),transparent 65%),var(--bg)}
a{color:inherit}
.page{min-height:100vh;display:flex;flex-direction:column}
.nav{width:min(1180px,calc(100% - 40px));margin:auto;padding:24px 0;display:flex;justify-content:space-between;align-items:center}
.brand{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:800;letter-spacing:.16em}
.mark{width:30px;height:30px;border:1px solid var(--line);border-radius:9px;display:grid;place-items:center;background:var(--panel);color:var(--accent);font-size:11px}
.nav-link{text-decoration:none;color:#aeb6c3;font-size:13px}
.nav-link:hover{color:#fff}
main{width:min(1180px,calc(100% - 40px));margin:auto;flex:1;display:grid;align-items:center;padding:48px 0 80px}
.hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:clamp(36px,7vw,96px);align-items:end}
.eyebrow{display:inline-flex;align-items:center;gap:9px;color:var(--accent);font-size:11px;font-weight:800;letter-spacing:.18em}
.eyebrow:before{content:"";width:24px;height:1px;background:var(--accent)}
h1{font-size:clamp(64px,12vw,148px);line-height:.82;letter-spacing:-.075em;margin:24px 0 34px;font-weight:850}
.lead{font-size:clamp(20px,2.4vw,30px);line-height:1.45;letter-spacing:-.025em;max-width:760px;margin:0}
.copy{color:var(--muted);line-height:1.8;max-width:650px;margin:20px 0 0;font-size:15px}
.panel{border:1px solid var(--line);background:linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.025));border-radius:24px;padding:26px;backdrop-filter:blur(14px);box-shadow:0 24px 80px rgba(0,0,0,.25)}
.status{display:flex;align-items:center;justify-content:space-between;padding-bottom:22px;border-bottom:1px solid var(--line)}
.status strong{font-size:13px;letter-spacing:.08em}
.dot{width:9px;height:9px;border-radius:50%;background:var(--accent);box-shadow:0 0 18px var(--accent)}
.meta{display:grid;gap:18px;padding-top:22px}
.meta-row{display:flex;justify-content:space-between;gap:20px;font-size:13px}
.meta-row span:first-child{color:#727c8b}
.meta-row span:last-child{text-align:right}
.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border-radius:12px;border:1px solid var(--line);background:var(--panel);text-decoration:none;font-size:13px;font-weight:750;transition:.18s ease}
.btn.primary{background:var(--text);color:#07090d;border-color:var(--text)}
.btn:hover{transform:translateY(-1px);border-color:var(--accent)}
footer{width:min(1180px,calc(100% - 40px));margin:auto;padding:20px 0 28px;color:#687180;font-size:11px;display:flex;justify-content:space-between;gap:20px;border-top:1px solid var(--line)}
footer a{text-decoration:none}
@media(max-width:760px){
.nav{width:min(100% - 28px,1180px);padding:18px 0}
main{width:min(100% - 28px,1180px);padding:44px 0 60px}
.hero{grid-template-columns:1fr;align-items:start}
h1{font-size:clamp(64px,22vw,110px);margin:22px 0 28px}
.panel{padding:22px}
footer{width:min(100% - 28px,1180px);flex-direction:column}
}

