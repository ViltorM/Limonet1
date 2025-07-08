
let lang = 'ua';
let translations = {};
let products = [];

fetch('translations.js')
  .then(response => response.text())
  .then(data => {
    eval(data);
    applyTranslations();
  });

function setLang(selectedLang) {
  lang = selectedLang;
  applyTranslations();
  renderProducts();
}

function applyTranslations() {
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
}

fetch('products.json')
  .then(res => res.json())
  .then(data => {
    products = data;
    renderProducts();
  });

function renderProducts() {
  const container = document.getElementById('products');
  container.innerHTML = '';
  products.forEach(category => {
    const title = document.createElement('h3');
    title.textContent = category.category;
    container.appendChild(title);
    category.items.forEach(item => {
      if (item.status === "hidden") return;
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${item.image}" alt="${item.size}">
        <h4>${item.size}</h4>
        <p>${item.price} грн</p>
        <p>${item.status === 'soon' ? 'Очікується' : ''}</p>
        <input type="number" min="1" max="20" value="1">
        <button>Додати в кошик</button>
      `;
      container.appendChild(card);
    });
  });
}
