const grid = document.getElementById('gallery-grid');
const filters = document.getElementById('filters');
const count = document.getElementById('photo-count');
const modal = document.getElementById('photo-modal');
const nav = document.querySelector('.nav-links');
const menu = document.querySelector('.menu-toggle');
let photos = [];
let filtered = [];
let activeIndex = 0;
let touchStartX = 0;
let touchStartY = 0;

fetch('photos.json')
  .then(r => {
    if (!r.ok) throw new Error('photos.json を読み込めません');
    return r.json();
  })
  .then(data => {
    photos = Array.isArray(data) ? data : [];
    filtered = [...photos];
    renderFilters();
    renderGallery();
  })
  .catch(err => {
    grid.innerHTML = '<p class="load-error">写真データを読み込めませんでした。</p>';
    console.error(err);
  });

function renderFilters() {
  const cats = ['All', ...new Set(photos.map(p => p.category).filter(Boolean))];
  filters.innerHTML = cats.map((c, i) =>
    `<button class="filter ${i === 0 ? 'active' : ''}" data-category="${escapeHtml(c)}">${c === 'All' ? 'All' : escapeHtml(c)}</button>`
  ).join('');

  filters.querySelectorAll('.filter').forEach(button => {
    button.addEventListener('click', () => {
      filters.querySelectorAll('.filter').forEach(x => x.classList.remove('active'));
      button.classList.add('active');
      filtered = button.dataset.category === 'All'
        ? [...photos]
        : photos.filter(p => p.category === button.dataset.category);
      renderGallery();
    });
  });
}

function renderGallery() {
  count.textContent = filtered.length;
  grid.innerHTML = filtered.map((p, i) => `
    <button class="card" data-index="${i}" aria-label="${escapeHtml(p.title)}を開く">
      <div class="card-image">
        <img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.alt || p.title)}" loading="lazy">
      </div>
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.category || '')}</p>
    </button>
  `).join('');

  grid.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => openModal(Number(card.dataset.index)));
  });
}

function openModal(i) {
  if (!filtered.length) return;
  activeIndex = (i + filtered.length) % filtered.length;
  const p = filtered[activeIndex];

  document.getElementById('modal-image').src = p.image;
  document.getElementById('modal-image').alt = p.alt || p.title;
  document.getElementById('modal-category').textContent = p.category || '';
  document.getElementById('modal-title').textContent = p.title || '';
  document.getElementById('modal-date').textContent = p.date || '';
  document.getElementById('modal-location').textContent = p.location || '';
  document.getElementById('modal-note').textContent = p.note || '';

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function move(n) {
  openModal(activeIndex + n);
}

document.querySelector('.modal-close').addEventListener('click', closeModal);
document.querySelector('.prev').addEventListener('click', () => move(-1));
document.querySelector('.next').addEventListener('click', () => move(1));

modal.addEventListener('click', e => {
  if (e.target === modal) closeModal();
});

document.addEventListener('keydown', e => {
  if (!modal.classList.contains('open')) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowLeft') move(-1);
  if (e.key === 'ArrowRight') move(1);
});

modal.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].clientX;
  touchStartY = e.changedTouches[0].clientY;
}, {passive:true});

modal.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
    move(dx < 0 ? 1 : -1);
  }
}, {passive:true});

menu.addEventListener('click', () => {
  nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', nav.classList.contains('open'));
});

nav.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
  });
});

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[ch]));
}
function escapeAttr(value) { return escapeHtml(value); }
