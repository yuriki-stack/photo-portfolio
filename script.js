let photos=[], filtered=[], current=0, selectedCategory='All', selectedTag='All', selectedYear='All', selectedMonth='All', newest=true;
const $=s=>document.querySelector(s);
const grid=$('#galleryGrid'), filters=$('#filters'), tagFilters=$('#tagFilters'), modal=$('#modal');
const likes=JSON.parse(localStorage.getItem('yuPhotoLikes')||'{}');
const favorites=JSON.parse(localStorage.getItem('yuPhotoFavorites')||'{}');
const SUPABASE_URL='';
const SUPABASE_ANON_KEY='';
const categoryJA={All:'すべて',Cat:'猫',Travel:'旅行',Nature:'自然',City:'街',Landscape:'風景',Other:'その他'};
let globalLikesEnabled=false;

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function lang(){return document.documentElement.lang==='en'?'en':'ja'}
function categoryLabel(c){return lang()==='en'?c:(categoryJA[c]||c)}
function titleClean(p){return p.title||''}
function isFeatured(p){return !!p.featured || /(^|[-_])featured([-_]|$)/i.test(p.image||'')}
function localLikeCount(p){return likes[p.image]||0}
function applyStaticLanguage(){
  const en=lang()==='en';
  document.querySelectorAll('[data-ja][data-en]').forEach(el=>el.textContent=en?el.dataset.en:el.dataset.ja);
  const input=$('#searchInput');
  input.placeholder=en?input.dataset.placeholderEn:input.dataset.placeholderJa;
  input.setAttribute('aria-label',en?'Search photos':'写真を検索');
  $('#langJa').classList.toggle('active',!en); $('#langEn').classList.toggle('active',en);
  $('#langJa').setAttribute('aria-pressed',String(!en)); $('#langEn').setAttribute('aria-pressed',String(en));
  $('#menuBtn').setAttribute('aria-label',en?'Menu':'メニュー');
  $('#closeModal').setAttribute('aria-label',en?'Close':'閉じる');
  $('#prevBtn').setAttribute('aria-label',en?'Previous photo':'前の写真');
  $('#nextBtn').setAttribute('aria-label',en?'Next photo':'次の写真');
  $('#backToTop').setAttribute('aria-label',en?'Back to top':'トップへ戻る');
  $('#sortBtn').textContent=en?(newest?'Newest ↓':'Oldest ↑'):(newest?'新しい順 ↓':'古い順 ↑');
  updateLikeUI();
}
function setLanguage(next){
  document.documentElement.lang=next;
  localStorage.setItem('yuPhotoLang',next);
  applyStaticLanguage();
  buildFilters();buildDateFilters();apply();renderFeatured();
}
function renderFeatured(){
  const fg=$('#featuredGrid'); if(!fg)return;
  const top=[...photos].sort((a,b)=>Number(isFeatured(b))-Number(isFeatured(a))||(favorites[b.image]?1:0)-(favorites[a.image]?1:0)||localLikeCount(b)-localLikeCount(a)||(b.date||'').localeCompare(a.date||'')).slice(0,3);
  fg.innerHTML=top.length?top.map(p=>cardHTML(p,-1,true)).join(''):`<p class="section-note">${lang()==='en'?'Add photos to see featured work here.':'写真を追加するとここに表示されます。'}</p>`;
}
function cardHTML(p,i,feature=false){
  const liked=localLikeCount(p),fav=!!favorites[p.image];
  return `<article class="card" data-${feature?'feature':'i'}="${esc(feature?p.image:i)}">
    <div class="photo-wrap">
      <img loading="lazy" src="${esc(p.image)}" alt="${esc(p.alt||titleClean(p))}">
      <button class="favorite-badge ${fav?'is-favorite':''}" data-favorite="${feature?'feature:'+esc(p.image):i}" aria-label="${lang()==='en'?'Favorite':'お気に入り'}" type="button">${fav?'★':'☆'}</button>
      <button class="like-badge" data-like="${feature?'feature:'+esc(p.image):i}" aria-label="${lang()==='en'?'Like':'いいね'}" type="button">♡ ${liked}</button>
    </div>
    <h3>${esc(titleClean(p))}</h3>
    <div class="card-meta">${esc(categoryLabel(p.category))} · ${esc(p.date||'')}${p.location?' · '+esc(p.location):''}</div>
    <div class="tags">${(p.tags||[]).map(t=>`<span class="tag">#${esc(t)}</span>`).join(' ')}</div>
  </article>`;
}
async function init(){
  const saved=localStorage.getItem('yuPhotoLang');
  document.documentElement.lang=saved==='en'?'en':'ja';
  applyStaticLanguage();
  try{
    const r=await fetch('photos.json?'+Date.now()); if(!r.ok)throw new Error('photos.json');
    photos=await r.json(); buildFilters();buildDateFilters();apply();renderFeatured(); await loadGlobalLikes();
  }catch(e){grid.innerHTML=`<p>${lang()==='en'?'Photo data could not be loaded.':'写真データを読み込めませんでした。'}</p>`;}
}
function buildFilters(){
  const cats=['All',...new Set(photos.map(p=>p.category).filter(Boolean))];
  filters.innerHTML=cats.map(c=>`<button class="${c===selectedCategory?'active':''}" data-cat="${esc(c)}" type="button">${esc(categoryLabel(c))}</button>`).join('');
}
function buildTagFilters(){
  const tags=['All',...new Set(photos.flatMap(p=>p.tags||[]).filter(Boolean))];
  tagFilters.innerHTML=tags.map(t=>`<button class="${t===selectedTag?'active':''}" data-tag="${esc(t)}" type="button">${t==='All'?(lang()==='en'?'All tags':'すべてのタグ'):'#'+esc(t)}</button>`).join('');
}
function buildDateFilters(){
  const years=[...new Set(photos.map(p=>(p.date||'').slice(0,4)).filter(Boolean))].sort().reverse();
  $('#yearFilter').innerHTML=`<option value="All">${lang()==='en'?'All years':'すべて'}</option>`+years.map(y=>`<option value="${y}">${y}</option>`).join('');
  const months=[...new Set(photos.filter(p=>selectedYear==='All'||(p.date||'').startsWith(selectedYear)).map(p=>(p.date||'').slice(5,7)).filter(Boolean))].sort();
  $('#monthFilter').innerHTML=`<option value="All">${lang()==='en'?'All months':'すべて'}</option>`+months.map(m=>`<option value="${m}">${m}</option>`).join('');
  $('#yearFilter').value=selectedYear;$('#monthFilter').value=selectedMonth;
}
function apply(){
  const q=$('#searchInput').value.trim().toLowerCase();
  filtered=photos.filter(p=>{
    const date=p.date||''; const hay=[p.title,p.category,p.date,p.location,p.note,...(p.tags||[])].join(' ').toLowerCase();
    return (selectedCategory==='All'||p.category===selectedCategory)&&(selectedTag==='All'||(p.tags||[]).includes(selectedTag))&&(selectedYear==='All'||date.startsWith(selectedYear))&&(selectedMonth==='All'||date.slice(5,7)===selectedMonth)&&(!q||hay.includes(q));
  });
  filtered.sort((a,b)=>newest?(b.date||'').localeCompare(a.date||''):(a.date||'').localeCompare(b.date||''));
  $('#count').textContent=lang()==='en'?`${filtered.length} photo${filtered.length===1?'':'s'}`:`${filtered.length}枚の写真`;
  $('#empty').hidden=filtered.length>0;
  grid.innerHTML=filtered.map((p,i)=>cardHTML(p,i)).join('');
}
function saveLikes(){localStorage.setItem('yuPhotoLikes',JSON.stringify(likes))}
function saveFavorites(){localStorage.setItem('yuPhotoFavorites',JSON.stringify(favorites));renderFeatured();apply()}
function toggleFavorite(image){favorites[image]=!favorites[image];if(!favorites[image])delete favorites[image];saveFavorites()}
function updateLikeUI(){const p=filtered[current];if(!p)return;$('#likeCount').textContent=globalLikesEnabled?(likes[p.image]||0):localLikeCount(p);$('#favoriteBtn').classList.toggle('active',!!favorites[p.image]);$('#favoriteBtn').querySelector('span').textContent=lang()==='en'?'Favorite':'お気に入り'}
function openModal(i){
  current=i;const p=filtered[current];if(!p)return;
  $('#modalImg').src=p.image;$('#modalImg').alt=p.alt||p.title;$('#modalTitle').textContent=p.title;$('#modalMeta').textContent=[categoryLabel(p.category),p.date,p.location].filter(Boolean).join(' · ');$('#modalNote').textContent=p.note||'';updateLikeUI();modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');history.replaceState(null,'','#photo-'+encodeURIComponent(p.image));
}
function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');if(location.hash.startsWith('#photo-'))history.replaceState(null,'',location.pathname+location.search)}
function move(d){if(!filtered.length)return;current=(current+d+filtered.length)%filtered.length;openModal(current)}
function resetFilters(){selectedCategory='All';selectedTag='All';selectedYear='All';selectedMonth='All';$('#searchInput').value='';buildFilters();buildDateFilters();apply()}

$('#closeModal').onclick=closeModal;$('#prevBtn').onclick=()=>move(-1);$('#nextBtn').onclick=()=>move(1);
$('#favoriteBtn').onclick=()=>{const p=filtered[current];if(!p)return;toggleFavorite(p.image);updateLikeUI();apply();renderFeatured()};
$('#likeBtn').onclick=async()=>{const p=filtered[current];if(!p)return;await addLike(p.image);updateLikeUI();apply();renderFeatured()};
$('#shareBtn').onclick=async()=>{const p=filtered[current];if(!p)return;const data={title:p.title,text:'YU PHOTOGRAPHY - '+p.title,url:location.href};try{if(navigator.share)await navigator.share(data);else await navigator.clipboard.writeText(location.href)}catch(e){}};
$('#searchInput').oninput=apply;
$('#sortBtn').onclick=()=>{newest=!newest;applyStaticLanguage();apply()};
$('#yearFilter').onchange=e=>{selectedYear=e.target.value;selectedMonth='All';buildDateFilters();apply()};
$('#monthFilter').onchange=e=>{selectedMonth=e.target.value;apply()};
$('#clearFilters').onclick=resetFilters;
$('#filters').onclick=e=>{if(!e.target.dataset.cat)return;selectedCategory=e.target.dataset.cat;selectedTag='All';buildFilters();buildTagFilters();apply()};
$('#tagFilters').onclick=e=>{if(!e.target.dataset.tag)return;selectedTag=e.target.dataset.tag;buildTagFilters();apply()};
$('#menuBtn').onclick=()=>{const nav=$('#siteNav');const open=nav.classList.toggle('mobile-open');$('#menuBtn').setAttribute('aria-expanded',String(open))};
$('#siteNav').onclick=e=>{if(e.target.tagName==='A'){$('#siteNav').classList.remove('mobile-open');$('#menuBtn').setAttribute('aria-expanded','false')}};
$('#langJa').onclick=()=>setLanguage('ja'); $('#langEn').onclick=()=>setLanguage('en');
$('#backToTop').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
window.addEventListener('scroll',()=>$('#backToTop').classList.toggle('visible',window.scrollY>500),{passive:true});

document.addEventListener('keydown',e=>{if(!modal.classList.contains('open'))return;if(e.key==='Escape')closeModal();if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1)});
let sx=0;modal.addEventListener('touchstart',e=>sx=e.changedTouches[0].screenX,{passive:true});modal.addEventListener('touchend',e=>{let dx=e.changedTouches[0].screenX-sx;if(Math.abs(dx)>50)move(dx>0?-1:1)},{passive:true});modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});

document.addEventListener('click',async e=>{
  const lb=e.target.closest('[data-like]');
  if(lb){e.stopPropagation();const raw=lb.dataset.like;const image=raw.startsWith('feature:')?raw.slice(8):filtered[+raw]?.image;if(image){await addLike(image);apply();renderFeatured();if(modal.classList.contains('open'))updateLikeUI()}return}
  const fb=e.target.closest('[data-favorite]');
  if(fb){e.stopPropagation();const raw=fb.dataset.favorite;const image=raw.startsWith('feature:')?raw.slice(8):filtered[+raw]?.image;if(image){toggleFavorite(image);apply();renderFeatured()}return}
  const card=e.target.closest('[data-i]');if(card)openModal(+card.dataset.i);
  const fcard=e.target.closest('[data-feature]');if(fcard){const i=filtered.findIndex(p=>p.image===fcard.dataset.feature);if(i>=0)openModal(i)}
});

async function loadGlobalLikes(){
  if(!SUPABASE_URL||!SUPABASE_ANON_KEY)return;
  try{const r=await fetch(`${SUPABASE_URL}/rest/v1/photo_likes?select=image,likes`,{headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`}});if(!r.ok)throw new Error();const rows=await r.json();rows.forEach(x=>likes[x.image]=Number(x.likes)||0);globalLikesEnabled=true;apply();renderFeatured()}catch(e){globalLikesEnabled=false}
}
async function addLike(image){
  if(!globalLikesEnabled){likes[image]=(likes[image]||0)+1;saveLikes();return}
  try{const r=await fetch(`${SUPABASE_URL}/rest/v1/photo_likes?on_conflict=image`,{method:'POST',headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({image,likes:(likes[image]||0)+1})});if(!r.ok)throw new Error();const rows=await r.json();if(rows[0])likes[image]=Number(rows[0].likes)||0}catch(e){likes[image]=(likes[image]||0)+1;globalLikesEnabled=false;saveLikes()}
}

init();
