const filters = [...document.querySelectorAll(".filter")];
const cards = [...document.querySelectorAll(".work")];
const buttons = [...document.querySelectorAll(".photo-button")];

filters.forEach(filter => {
  filter.addEventListener("click", () => {
    filters.forEach(item => item.classList.remove("active"));
    filter.classList.add("active");

    const target = filter.dataset.filter;
    cards.forEach(card => {
      const show = target === "all" || card.dataset.category === target;
      card.hidden = !show;
    });
  });
});

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxTitle = document.getElementById("lightbox-title");
const lightboxCategory = document.getElementById("lightbox-category");
const lightboxNote = document.getElementById("lightbox-note");
const closeBtn = document.querySelector(".lightbox-close");
const prevBtn = document.querySelector(".lightbox-prev");
const nextBtn = document.querySelector(".lightbox-next");

let currentIndex = 0;

function visibleButtons() {
  return buttons.filter(button => !button.closest(".work").hidden);
}

function openPhoto(button) {
  const visible = visibleButtons();
  currentIndex = Math.max(0, visible.indexOf(button));
  showPhoto(visible[currentIndex]);
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lock");
}

function showPhoto(button) {
  if (!button) return;
  lightboxImage.src = button.dataset.full;
  lightboxImage.alt = button.dataset.title;
  lightboxTitle.textContent = button.dataset.title;
  lightboxCategory.textContent = button.dataset.category;
  lightboxNote.textContent = button.dataset.note || "";
}

buttons.forEach(button => {
  button.addEventListener("click", () => openPhoto(button));
});

function movePhoto(direction) {
  const visible = visibleButtons();
  if (!visible.length) return;
  currentIndex = (currentIndex + direction + visible.length) % visible.length;
  showPhoto(visible[currentIndex]);
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lock");
  lightboxImage.src = "";
}

closeBtn.addEventListener("click", closeLightbox);
prevBtn.addEventListener("click", () => movePhoto(-1));
nextBtn.addEventListener("click", () => movePhoto(1));

lightbox.addEventListener("click", event => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", event => {
  if (!lightbox.classList.contains("open")) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") movePhoto(-1);
  if (event.key === "ArrowRight") movePhoto(1);
});

let touchStartX = 0;
lightbox.addEventListener("touchstart", event => {
  touchStartX = event.changedTouches[0].screenX;
}, {passive:true});

lightbox.addEventListener("touchend", event => {
  const delta = event.changedTouches[0].screenX - touchStartX;
  if (Math.abs(delta) > 45) movePhoto(delta < 0 ? 1 : -1);
}, {passive:true});
