let photos = [];
let currentIndex = 0;

const filtersEl = document.getElementById("filters");
const galleryEl = document.getElementById("gallery-grid");
const emptyState = document.getElementById("empty-state");
const heroCount = document.getElementById("hero-count");

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxTitle = document.getElementById("lightbox-title");
const lightboxCategory = document.getElementById("lightbox-category");
const lightboxNote = document.getElementById("lightbox-note");

async function loadPhotos() {
  try {
    const response = await fetch("photos.json", { cache: "no-store" });
    if (!response.ok) throw new Error("photos.json could not be loaded");
    photos = await response.json();
    renderFilters();
    renderGallery("All");
    heroCount.textContent = String(photos.length).padStart(2, "0");
  } catch (error) {
    galleryEl.innerHTML = '<p class="empty-state">写真データを読み込めませんでした。</p>';
    console.error(error);
  }
}

function renderFilters() {
  const categories = ["All", ...new Set(photos.map(photo => photo.category).filter(Boolean))];
  filtersEl.innerHTML = categories.map((category, index) =>
    `<button class="filter ${index === 0 ? "active" : ""}" data-filter="${escapeHtml(category)}">${escapeHtml(category)}</button>`
  ).join("");

  filtersEl.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
      filtersEl.querySelectorAll(".filter").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      renderGallery(button.dataset.filter);
    });
  });
}

function renderGallery(category) {
  const selected = category === "All" ? photos : photos.filter(photo => photo.category === category);
  emptyState.hidden = selected.length !== 0;

  galleryEl.innerHTML = selected.map((photo, index) => {
    const sizeClass = index % 3 === 1 ? "secondary" : "featured";
    const number = String(index + 1).padStart(2, "0");
    return `
      <article class="work ${sizeClass}" data-category="${escapeHtml(photo.category)}">
        <button class="photo-button"
          data-index="${photos.indexOf(photo)}"
          aria-label="${escapeHtml(photo.title)}を大きく表示">
          <div class="image-wrap">
            <img src="${escapeAttr(photo.image)}" alt="${escapeAttr(photo.alt || photo.title)}" loading="lazy">
            <span class="view-label">View photo ↗</span>
          </div>
          <div class="work-info">
            <div>
              <h3>${escapeHtml(photo.title)}</h3>
              <p>${escapeHtml(photo.category)}</p>
            </div>
            <span class="work-no">${number}</span>
          </div>
        </button>
      </article>`;
  }).join("");

  galleryEl.querySelectorAll(".photo-button").forEach(button => {
    button.addEventListener("click", () => {
      currentIndex = Number(button.dataset.index);
      openPhoto(currentIndex);
    });
  });
}

function openPhoto(index) {
  currentIndex = index;
  const photo = photos[currentIndex];
  if (!photo) return;
  lightboxImage.src = photo.image;
  lightboxImage.alt = photo.alt || photo.title;
  lightboxTitle.textContent = photo.title;
  lightboxCategory.textContent = photo.category;
  lightboxNote.textContent = photo.note || "";
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lock");
}

function movePhoto(direction) {
  if (!photos.length) return;
  currentIndex = (currentIndex + direction + photos.length) % photos.length;
  openPhoto(currentIndex);
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lock");
  lightboxImage.src = "";
}

document.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
document.querySelector(".lightbox-prev").addEventListener("click", () => movePhoto(-1));
document.querySelector(".lightbox-next").addEventListener("click", () => movePhoto(1));
lightbox.addEventListener("click", event => { if (event.target === lightbox) closeLightbox(); });

document.addEventListener("keydown", event => {
  if (!lightbox.classList.contains("open")) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") movePhoto(-1);
  if (event.key === "ArrowRight") movePhoto(1);
});

let touchStartX = 0;
lightbox.addEventListener("touchstart", event => { touchStartX = event.changedTouches[0].screenX; }, {passive:true});
lightbox.addEventListener("touchend", event => {
  const delta = event.changedTouches[0].screenX - touchStartX;
  if (Math.abs(delta) > 45) movePhoto(delta < 0 ? 1 : -1);
}, {passive:true});

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}
function escapeAttr(value) { return escapeHtml(value); }

loadPhotos();
