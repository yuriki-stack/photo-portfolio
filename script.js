const grid=document.getElementById('gallery-grid');
const filters=document.getElementById('filters');
const modal=document.getElementById('photo-modal');
const nav=document.querySelector('.nav-links');
const menu=document.querySelector('.menu-toggle');
let photos=[], filtered=[], activeIndex=0;

fetch('photos.json').then(r=>{if(!r.ok)throw new Error('photos.json を読み込めません');return r.json()}).then(data=>{photos=data; filtered=[...photos]; renderFilters(); renderGallery();}).catch(err=>{grid.innerHTML='<p>写真データを読み込めませんでした。</p>';console.error(err)});
function renderFilters(){const cats=['All',...new Set(photos.map(p=>p.category))];filters.innerHTML=cats.map((c,i)=>`<button class="filter ${i===0?'active':''}" data-category="${c}">${c==='All'?'All':c}</button>`).join('');filters.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{filters.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');filtered=b.dataset.category==='All'?[...photos]:photos.filter(p=>p.category===b.dataset.category);renderGallery();});}
function renderGallery(){grid.innerHTML=filtered.map((p,i)=>`<button class="card" data-index="${i}"><div class="card-image"><img src="${p.image}" alt="${p.alt}" loading="lazy"></div><h3>${p.title}</h3><p>${p.category}</p></button>`).join('');grid.querySelectorAll('.card').forEach(c=>c.onclick=()=>openModal(Number(c.dataset.index)));}
function openModal(i){activeIndex=i;const p=filtered[i];document.getElementById('modal-image').src=p.image;document.getElementById('modal-image').alt=p.alt;document.getElementById('modal-category').textContent=p.category;document.getElementById('modal-title').textContent=p.title;document.getElementById('modal-date').textContent=p.date;document.getElementById('modal-location').textContent=p.location;document.getElementById('modal-note').textContent=p.note;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';}
function move(n){openModal((activeIndex+n+filtered.length)%filtered.length)}
document.querySelector('.modal-close').onclick=closeModal;document.querySelector('.prev').onclick=()=>move(-1);document.querySelector('.next').onclick=()=>move(1);modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});document.addEventListener('keydown',e=>{if(!modal.classList.contains('open'))return;if(e.key==='Escape')closeModal();if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1)});menu.onclick=()=>{nav.classList.toggle('open');menu.setAttribute('aria-expanded',nav.classList.contains('open'));};
