let lang = 'ua'; // По умолчанию украинский
let translations = {};
let products = [];
let cart = [];
let currentView = 'grid';

// Основная функция инициализации
async function initializeApp() {
  // 1. Загружаем переводы
  await loadTranslations();
  
  // 2. Восстанавливаем язык из localStorage
  const savedLang = localStorage.getItem('limonet_lang');
  if (savedLang) {
    lang = savedLang;
  }
  
  // 3. Применяем переводы
  applyTranslations();
  
  // 4. Восстанавливаем корзину
  const savedCart = localStorage.getItem('limonet_cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
  }
  
  // 5. Загружаем продукты
  await loadProducts();
  
  // 6. Инициализируем интерфейс
  initInterface();
  
  // 7. Рендерим контент
  renderProducts();
  renderCart();
  initFeaturedBanner();
}

// Загрузка переводов
async function loadTranslations() {
  try {
    const response = await fetch('translations.js');
    const data = await response.text();
    eval(data);
  } catch (error) {
    console.error('Error loading translations:', error);
  }
}

// Загрузка продуктов
async function loadProducts() {
  try {
    const response = await fetch('products.json');
    products = await response.json();
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// Инициализация интерфейса
function initInterface() {
  // Восстанавливаем настройки вида
  const savedView = localStorage.getItem('product_view');
  if (savedView) {
    currentView = savedView;
  }
  
  // Устанавливаем активную кнопку языка
  document.querySelectorAll('.lang-switcher button').forEach(btn => {
    if (btn.textContent === lang.toUpperCase()) {
      btn.classList.add('active');
    }
  });
  
  // Инициализация переключателей вида
  document.querySelectorAll('.view-option').forEach(btn => {
    if (btn.getAttribute('data-view') === currentView) {
      btn.classList.add('active');
    }
    
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.getAttribute('data-view');
      localStorage.setItem('product_view', currentView);
      renderProducts();
    });
  });

  // Добавляем иконки для полей формы
  const addIcon = (selector, iconCode) => {
    const input = document.querySelector(selector);
    if (input) {
      const wrapper = document.createElement('div');
      wrapper.className = 'input-with-icon';
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);
      wrapper.insertAdjacentHTML('afterbegin', `<span class="input-icon">${iconCode}</span>`);
    }
  };
  
  addIcon('input[name="fio"]', '👤');
  addIcon('input[name="phone"]', '📱');
  addIcon('input[name="city"]', '🏙️');
  addIcon('input[name="post"]', '📮');
  
  // Обработка формы оплаты
  const paymentSelect = document.querySelector('select[name="payment"]');
  if (!paymentSelect.value) {
    paymentSelect.selectedIndex = 0;
  }
  
  paymentSelect.addEventListener('change', function() {
    if (this.value) {
      const placeholderOption = this.querySelector('option[disabled]');
      if (placeholderOption) placeholderOption.removeAttribute('selected');
    }
  });
  
  document.getElementById('order-form')?.addEventListener('submit', function() {
    if (paymentSelect.value) {
      const placeholderOption = paymentSelect.querySelector('option[disabled]');
      if (placeholderOption) placeholderOption.removeAttribute('selected');
    }
  });
}

// Установка языка
function setLang(selectedLang) {
  lang = selectedLang;
  localStorage.setItem('limonet_lang', lang);
  
  // Обновляем активные кнопки
  document.querySelectorAll('.lang-switcher button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent === lang.toUpperCase()) {
      btn.classList.add('active');
    }
  });
  
  applyTranslations();
  renderProducts();
  renderCart();
}

// Применение переводов
function applyTranslations() {
  if (!translations[lang]) return;
  
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
  
  document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
    const key = el.getAttribute('data-translate-placeholder');
    if (translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });
  
  document.querySelectorAll('.view-option').forEach(btn => {
    const viewType = btn.getAttribute('data-view');
    const translationKey = `${viewType}_view`;
    if (translations[lang][translationKey]) {
      btn.setAttribute('title', translations[lang][translationKey]);
    }
  });
}

// Баннер рекомендуемых товаров (остается без изменений)
function initFeaturedBanner() {
  // ... существующий код ...
}

// Рендер продуктов (остается без изменений)
function renderProducts() {
  // ... существующий код ...
}

// Добавление в корзину (остается без изменений)
function addToCart(catIndex, itemIndex, quantity) {
  // ... существующий код ...
}

// Рендер корзины с гарантией правильного перевода
function renderCart() {
  const container = document.getElementById('cart-items');
  if (!container) return;
  
  const totalElement = document.getElementById('cart-total');
  if (!totalElement) return;
  
  container.innerHTML = '';
  
  let total = 0;
  
  // Всегда используем текущий перевод
  const externalSizeLabel = translations[lang]?.external_size || 'Зовнішні розміри';
  
  cart.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    
    const externalSizeHtml = item.externalSize ? 
      `<div class="item-size">${externalSizeLabel}: ${item.externalSize}</div>` : '';
    
    li.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        ${externalSizeHtml}
        <div class="item-price">${item.price} грн × ${item.quantity}</div>
      </div>
      <div class="item-controls">
        <div class="quantity-controls">
          <button class="quantity-btn cart-minus" data-index="${index}">-</button>
          <input type="number" min="1" value="${item.quantity}" class="quantity-input cart-quantity" data-index="${index}">
          <button class="quantity-btn cart-plus" data-index="${index}">+</button>
        </div>
        <button class="remove-item" data-index="${index}">✕</button>
      </div>
    `;
    container.appendChild(li);
    
    total += item.price * item.quantity;
  });
  
  totalElement.textContent = total.toFixed(2);
  
  // Добавляем обработчики
  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      removeFromCart(index);
    });
  });
  
  document.querySelectorAll('.cart-minus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      updateCartItemQuantity(index, -1);
    });
  });
  
  document.querySelectorAll('.cart-plus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      updateCartItemQuantity(index, 1);
    });
  });
  
  document.querySelectorAll('.cart-quantity').forEach(input => {
    input.addEventListener('change', (e) => {
      const index = e.target.getAttribute('data-index');
      const value = parseInt(e.target.value);
      if (value > 0) {
        cart[index].quantity = value;
        saveCart();
        renderCart();
      }
    });
  });
}

// Остальные функции без изменений
function updateCartItemQuantity(index, change) {
  // ... существующий код ...
}

function removeFromCart(index) {
  // ... существующий код ...
}

function saveCart() {
  // ... существующий код ...
}

// Обработка формы заказа
document.getElementById('order-form')?.addEventListener('submit', function(e) {
  // ... существующий код ...
});

function saveOrder(order) {
  // ... существующий код ...
}

// Для админ-панели
document.addEventListener('dataUpdated', () => {
  // ... существующий код ...
});

// Запуск приложения при загрузке
document.addEventListener('DOMContentLoaded', initializeApp);
