let photos=[], filtered=[], current=0, selectedCategory='All', selectedTag='All', newest=true;
let currentLang = document.documentElement.lang === 'en' ? 'en' : 'ja';
const $=s=>document.querySelector(s);
const grid=$('#galleryGrid'),filters=$('#filters'),tagFilters=$('#tagFilters'),modal=$('#modal');
const likes=JSON.parse(localStorage.getItem('yuPhotoLikes')||'{}');

const labels={
  ja:{all:'すべて',newest:'新しい順 ↓',oldest:'古い順 ↑',search:'写真を検索...',photos:'枚',photo:'枚',noPhotos:'写真が見つかりません。',share:'共有',like:'♡',close:'閉じる',previous:'前の写真',next:'次の写真'},
  en:{all:'All',newest:'Newest ↓',oldest:'Oldest ↑',search:'Search photos...',photos:'photos',photo:'photo',noPhotos:'No photos found.',share:'Share',like:'♡',close:'Close',previous:'Previous',next:'Next'}
};

function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}

function renderFeatured(){
  const fg=$('#featuredGrid');
  if(!fg)return;
  const top=[...photos].sort((a,b)=>(likes[b.image]||0)-(likes[a.image]||0)||(b.date||'').localeCompare(a.date||'')).slice(0,3);
  fg.innerHTML=top.map(p=>`<article class="card" data-feature="${esc(p.image)}"><div class="photo-wrap"><img loading="lazy" src="${esc(p.image)}" alt="${esc(p.alt||p.title)}"></div><h3>${esc(p.title)}</h3><div class="card-meta">${esc(p.category)} · ${esc(p.date)}</div></article>`).join('');
  fg.onclick=e=>{const c=e.target.closest('[data-feature]');if(!c)return;const i=filtered.findIndex(p=>p.image===c.dataset.feature);if(i>=0)openModal(i)};
}

function applyLanguage(){
  document.documentElement.lang=currentLang;
  document.querySelectorAll('[data-ja][data-en]').forEach(el=>{
    el.textContent=el.dataset[currentLang];
  });
  $('#langBtn').textContent=currentLang==='ja'?'EN':'JP';
  $('#searchInput').placeholder=labels[currentLang].search;
  $('#searchInput').setAttribute('aria-label',labels[currentLang].search);
  $('#sortBtn').textContent=newest?labels[currentLang].newest:labels[currentLang].oldest;
  $('#empty').textContent=labels[currentLang].noPhotos;
  $('#closeModal').setAttribute('aria-label',labels[currentLang].close);
  $('#prevBtn').setAttribute('aria-label',labels[currentLang].previous);
  $('#nextBtn').setAttribute('aria-label',labels[currentLang].next);
  renderFilters();
  apply();
}

async function init(){
  try{
    photos=await (await fetch('photos.json?'+Date.now())).json();
    renderFeatured();
    buildFilters();
    apply();
  }catch(e){
    grid.innerHTML='<p>写真データを読み込めませんでした。</p>';
  }
}

function buildFilters(){
  filters.onclick=e=>{
    if(!e.target.dataset.cat)return;
    selectedCategory=e.target.dataset.cat;
    selectedTag='All';
    renderFilters();
    apply();
  };
  tagFilters.onclick=e=>{
    if(!e.target.dataset.tag)return;
    selectedTag=e.target.dataset.tag;
    renderTagFilters();
    apply();
  };
  renderFilters();
  renderTagFilters();
}

function renderFilters(){
  const cats=['All',...new Set(photos.map(p=>p.category).filter(Boolean))];
  filters.innerHTML=cats.map(c=>`<button class="${c===selectedCategory?'active':''}" data-cat="${esc(c)}">${c==='All'?labels[currentLang].all:esc(c)}</button>`).join('');
  renderTagFilters();
}

function renderTagFilters(){
  const tags=['All',...new Set(photos.flatMap(p=>p.tags||[]))];
  tagFilters.innerHTML=tags.map(t=>`<button class="${t===selectedTag?'active':''}" data-tag="${esc(t)}">${t==='All'?labels[currentLang].all:'#'+esc(t)}</button>`).join('');
}

function apply(){
  let q=$('#searchInput').value.trim().toLowerCase();
  filtered=photos.filter(p=>(selectedCategory==='All'||p.category===selectedCategory)&&(selectedTag==='All'||(p.tags||[]).includes(selectedTag))&&(!q||[p.title,p.category,p.date,p.location,p.note,...(p.tags||[])].join(' ').toLowerCase().includes(q)));
  filtered.sort((a,b)=>newest?(b.date||'').localeCompare(a.date||''):(a.date||'').localeCompare(b.date||''));
  const n=filtered.length;
  $('#count').textContent=currentLang==='ja'?`${n}枚`:n===1?'1 photo':`${n} photos`;
  $('#empty').hidden=n>0;
  grid.innerHTML=filtered.map((p,i)=>`<article class="card" data-i="${i}"><div class="photo-wrap"><img loading="lazy" src="${esc(p.image)}" alt="${esc(p.alt||p.title)}"><button class="like-badge" data-like="${i}">${labels[currentLang].like} ${likes[p.image]||0}</button></div><h3>${esc(p.title)}</h3><div class="card-meta">${esc(p.category)} · ${esc(p.date)}${p.location?' · '+esc(p.location):''}</div><div class="tags">${(p.tags||[]).map(t=>`<span class="tag">#${esc(t)}</span>`).join(' ')}</div></article>`).join('');
  renderFeatured();
}

grid.onclick=e=>{
  let lb=e.target.closest('[data-like]');
  if(lb){
    e.stopPropagation();
    let p=filtered[+lb.dataset.like];
    likes[p.image]=(likes[p.image]||0)+1;
    saveLikes();
    apply();
    return;
  }
  let card=e.target.closest('.card');
  if(card)openModal(+card.dataset.i);
};

function saveLikes(){localStorage.setItem('yuPhotoLikes',JSON.stringify(likes));}

function openModal(i){
  current=i;
  let p=filtered[current];
  $('#modalImg').src=p.image;
  $('#modalImg').alt=p.alt||p.title;
  $('#modalTitle').textContent=p.title;
  $('#modalMeta').textContent=[p.category,p.date,p.location].filter(Boolean).join(' · ');
  $('#modalNote').textContent=p.note||'';
  $('#likeCount').textContent=likes[p.image]||0;
  $('#shareBtn').textContent=labels[currentLang].share;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  history.replaceState(null,'','#photo-'+encodeURIComponent(p.image));
}

function closeModal(){
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  if(location.hash.startsWith('#photo-'))history.replaceState(null,'',location.pathname+location.search);
}

function move(d){if(!filtered.length)return;current=(current+d+filtered.length)%filtered.length;openModal(current)}

$('#closeModal').onclick=closeModal;
$('#prevBtn').onclick=()=>move(-1);
$('#nextBtn').onclick=()=>move(1);
$('#likeBtn').onclick=()=>{
  let p=filtered[current];
  likes[p.image]=(likes[p.image]||0)+1;
  saveLikes();
  $('#likeCount').textContent=likes[p.image];
  apply();
};
$('#shareBtn').onclick=async()=>{
  let p=filtered[current],data={title:p.title,text:'YU PHOTOGRAPHY - '+p.title,url:location.href};
  try{if(navigator.share)await navigator.share(data);else await navigator.clipboard.writeText(location.href)}catch(e){}
};

document.addEventListener('keydown',e=>{
  if(!modal.classList.contains('open'))return;
  if(e.key==='Escape')closeModal();
  if(e.key==='ArrowLeft')move(-1);
  if(e.key==='ArrowRight')move(1);
});

let sx=0;
modal.addEventListener('touchstart',e=>sx=e.changedTouches[0].screenX,{passive:true});
modal.addEventListener('touchend',e=>{let dx=e.changedTouches[0].screenX-sx;if(Math.abs(dx)>50)move(dx>0?-1:1)},{passive:true});

$('#searchInput').oninput=apply;
$('#sortBtn').onclick=()=>{newest=!newest;$('#sortBtn').textContent=newest?labels[currentLang].newest:labels[currentLang].oldest;apply()};
$('#langBtn').onclick=()=>{
  currentLang=currentLang==='ja'?'en':'ja';
  applyLanguage();
};

$('#menuBtn').onclick=()=>document.querySelector('.site-header nav').classList.toggle('mobile-open');
document.querySelectorAll('.site-header nav a').forEach(a=>a.addEventListener('click',()=>document.querySelector('.site-header nav').classList.remove('mobile-open')));

init();
