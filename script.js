let lang = 'ua';
let translations = {};
let products = [];
let cart = [];
let currentView = 'grid'; // grid, list, horizontal

// Загрузка переводов
fetch('translations.js')
  .then(response => response.text())
  .then(data => {
    eval(data);
    applyTranslations();
  });

// Проверяем localStorage при загрузке
document.addEventListener('DOMContentLoaded', () => {
  const savedCart = localStorage.getItem('limonet_cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    renderCart();
  }
  
  const savedCss = localStorage.getItem('limonet_css');
  if (savedCss) {
    const styleTag = document.createElement('style');
    styleTag.textContent = savedCss;
    styleTag.id = 'dynamic-css';
    document.head.appendChild(styleTag);
  }

  // Загрузка продуктов
  fetch('products.json')
    .then(res => res.json())
    .then(data => {
      products = data;
      renderProducts();
      initFeaturedBanner();
    });
    
  // Загрузка настроек вида
  const savedView = localStorage.getItem('product_view');
  if (savedView) {
    currentView = savedView;
    document.querySelectorAll('.view-option').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-view') === currentView) {
        btn.classList.add('active');
      }
    });
  }
  
  // Инициализация переключателей вида
  document.querySelectorAll('.view-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.getAttribute('data-view');
      localStorage.setItem('product_view', currentView);
      renderProducts();
    });
  });
});

function setLang(selectedLang) {
  lang = selectedLang;
  applyTranslations();
  renderProducts();
  renderCart();
}

function applyTranslations() {
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
  
  // Обновляем плейсхолдеры
  document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
    const key = el.getAttribute('data-translate-placeholder');
    if (translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });
}

// Баннер рекомендуемых товаров
function initFeaturedBanner() {
  const featuredSettings = JSON.parse(localStorage.getItem('featured_settings')) || {
    enabled: false,
    products: [],
    autoRotate: true
  };
  
  if (!featuredSettings.enabled || featuredSettings.products.length === 0) {
    document.getElementById('featured-products').style.display = 'none';
    return;
  }
  
  document.getElementById('featured-products').style.display = 'block';
  const container = document.querySelector('.featured-items');
  container.innerHTML = '';
  
  featuredSettings.products.forEach(id => {
    const [catIndex, itemIndex] = id.split('-');
    const product = products[catIndex]?.items[itemIndex];
    if (!product) return;
    
    const div = document.createElement('div');
    div.className = 'featured-item';
    div.innerHTML = `
      <img src="${product.image}" alt="${product.name[lang] || product.name}">
      <h4>${product.name[lang] || product.name}</h4>
      <p>${product.price} грн</p>
    `;
    container.appendChild(div);
  });
  
  // Навигация
  document.getElementById('prev-featured').addEventListener('click', () => {
    document.querySelector('.featured-items').scrollBy({ left: -200, behavior: 'smooth' });
  });
  
  document.getElementById('next-featured').addEventListener('click', () => {
    document.querySelector('.featured-items').scrollBy({ left: 200, behavior: 'smooth' });
  });
}

function renderProducts() {
  const container = document.getElementById('products');
  container.innerHTML = '';
  
  const productsContainer = document.createElement('div');
  productsContainer.className = `category-container ${currentView}-view`;
  container.appendChild(productsContainer);
  
  products.forEach((category, catIndex) => {
    if (currentView !== 'horizontal') {
      const title = document.createElement('h3');
      title.className = 'category-title';
      title.textContent = category.category[lang] || category.category;
      productsContainer.appendChild(title);
    }
    
    const categoryWrapper = document.createElement('div');
    categoryWrapper.className = 'products-group';
    
    // ДОБАВЛЕНО: Принудительное применение row-gap для режима сетки
    if (currentView === 'grid') {
      categoryWrapper.style.rowGap = '25px';
    }
    
    productsContainer.appendChild(categoryWrapper);
    
    category.items.forEach((item, itemIndex) => {
      if (item.status === "hidden") return;
      
      const card = document.createElement('div');
      card.className = 'product-card';
      
      const name = item.name[lang] || item.name;
      const description = item.description?.[lang] || item.description || '';
      
      card.innerHTML = `
        <img src="${item.image}" alt="${name}">
        <h4>${name}</h4>
        <div class="description">${description}</div>
        <p>${item.price} грн</p>
        <p>${item.status === 'soon' ? 'Очікується' : ''}</p>
        
        <div class="quantity-controls">
          <button class="quantity-btn minus" data-cat="${catIndex}" data-item="${itemIndex}">-</button>
          <input type="number" min="1" value="1" class="quantity-input" 
                 data-cat="${catIndex}" data-item="${itemIndex}">
          <button class="quantity-btn plus" data-cat="${catIndex}" data-item="${itemIndex}">+</button>
        </div>
        
        <button class="add-to-cart btn-primary" data-cat="${catIndex}" data-item="${itemIndex}">
          ${lang === 'ua' ? 'Додати в кошик' : 'Добавить в корзину'}
        </button>
      `;
      categoryWrapper.appendChild(card);
    });
  });
  
  // Добавляем обработчики
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const catIndex = e.target.getAttribute('data-cat');
      const itemIndex = e.target.getAttribute('data-item');
      const quantityInput = e.target.parentElement.querySelector('.quantity-input');
      const quantity = parseInt(quantityInput.value);
      
      addToCart(catIndex, itemIndex, quantity);
    });
  });
  
  // Обработчики кнопок +/-
  document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const input = e.target.parentElement.querySelector('.quantity-input');
      input.value = parseInt(input.value) + 1;
    });
  });
  
  document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const input = e.target.parentElement.querySelector('.quantity-input');
      if (input.value > 1) {
        input.value = parseInt(input.value) - 1;
      }
    });
  });
}

function addToCart(catIndex, itemIndex, quantity) {
  const product = products[catIndex].items[itemIndex];
  
  // Проверяем, есть ли уже товар в корзине
  const existingItem = cart.find(item => 
    item.catIndex == catIndex && item.itemIndex == itemIndex
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      catIndex: parseInt(catIndex),
      itemIndex: parseInt(itemIndex),
      quantity: quantity,
      price: product.price,
      name: product.name[lang] || product.name,
      image: product.image
    });
  }
  
  saveCart();
  renderCart();
  
  // Анимация добавления
  const btn = document.querySelector(`.add-to-cart[data-cat="${catIndex}"][data-item="${itemIndex}"]`);
  btn.classList.add('animate');
  setTimeout(() => btn.classList.remove('animate'), 500);
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const totalElement = document.getElementById('cart-total');
  container.innerHTML = '';
  
  let total = 0;
  
  cart.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="item-info">
        <div>${item.name}</div>
        <div>${item.price} грн × <span class="item-quantity">${item.quantity}</span></div>
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

function updateCartItemQuantity(index, change) {
  const newQuantity = cart[index].quantity + change;
  if (newQuantity > 0) {
    cart[index].quantity = newQuantity;
    saveCart();
    renderCart();
  }
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem('limonet_cart', JSON.stringify(cart));
}

// Обработка формы заказа
document.getElementById('order-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  if (cart.length === 0) {
    alert(lang === 'ua' ? 'Кошик порожній!' : 'Корзина пуста!');
    return;
  }
  
  const formData = new FormData(this);
  const order = {
    id: Date.now(), // Уникальный ID заказа
    customer: Object.fromEntries(formData),
    items: [...cart],
    total: document.getElementById('cart-total').textContent,
    date: new Date().toLocaleString('ua-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    status: 'new' // Статус заказа: new, processing, completed, cancelled
  };
  
  // Сохраняем заказ
  saveOrder(order);
  
  alert(lang === 'ua' 
    ? 'Замовлення оформлено! Ми з вами зв\'яжемось.' 
    : 'Заказ оформлен! Мы с вами свяжемся.');
  
  // Очищаем корзину
  cart = [];
  saveCart();
  renderCart();
  this.reset();
});

function saveOrder(order) {
  // Получаем текущие заказы
  const orders = JSON.parse(localStorage.getItem('limonet_orders')) || [];
  
  // Добавляем новый заказ
  orders.push(order);
  
  // Сохраняем обратно
  localStorage.setItem('limonet_orders', JSON.stringify(orders));
  
  // Оповещаем админ-панель о новом заказе
  const event = new Event('newOrder');
  document.dispatchEvent(event);
}

// Для админ-панели: обновляем данные при изменении
document.addEventListener('dataUpdated', () => {
  fetch('products.json')
    .then(res => res.json())
    .then(data => {
      products = data;
      renderProducts();
      initFeaturedBanner();
    });
});
