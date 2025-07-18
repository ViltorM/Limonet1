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

  // Добавляем иконки для полей формы
  const addIcon = (selector, iconCode) => {
    const input = document.querySelector(selector);
    if (input) {
      const wrapper = document.createElement('div');
      wrapper.className = 'input-with-icon';
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);
      
      wrapper.insertAdjacentHTML('afterbegin', 
        `<span class="input-icon">${iconCode}</span>`);
    }
  };
  
  addIcon('input[name="fio"]', '👤');
  addIcon('input[name="phone"]', '📱');
  addIcon('input[name="city"]', '🏙️');
  addIcon('input[name="post"]', '📮');
  
  // Решение проблемы с выбором оплаты
  const paymentSelect = document.querySelector('select[name="payment"]');
  
  // Инициализация: если ничего не выбрано, показываем placeholder
  if (!paymentSelect.value) {
    paymentSelect.selectedIndex = 0;
  }
  
  // При изменении выбора
  paymentSelect.addEventListener('change', function() {
    // Удаляем атрибут selected у placeholder после выбора
    if (this.value) {
      const placeholderOption = this.querySelector('option[disabled]');
      if (placeholderOption) {
        placeholderOption.removeAttribute('selected');
      }
    }
  });
  
  // При отправке формы
  document.getElementById('order-form').addEventListener('submit', function() {
    // Гарантируем, что placeholder не будет выбран
    if (paymentSelect.value) {
      const placeholderOption = paymentSelect.querySelector('option[disabled]');
      if (placeholderOption) {
        placeholderOption.removeAttribute('selected');
      }
    }
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
  
  // Обновляем заголовки переключателей видов
  document.querySelectorAll('.view-option').forEach(btn => {
    const viewType = btn.getAttribute('data-view');
    const translationKey = `${viewType}_view`;
    if (translations[lang][translationKey]) {
      btn.setAttribute('title', translations[lang][translationKey]);
      btn.setAttribute('aria-label', translations[lang][translationKey]);
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
    // Создаем заголовок категории для всех режимов
    const title = document.createElement('h3');
    title.className = 'category-title';
    title.textContent = category.category[lang] || category.category;
    productsContainer.appendChild(title);
    
    // Для горизонтального режима добавляем зелёную полоску
    if (currentView === 'horizontal') {
      const line = document.createElement('div');
      line.className = 'category-line';
      productsContainer.appendChild(line);
    }
    
    const categoryWrapper = document.createElement('div');
    categoryWrapper.className = 'products-group';
    
    // Установка стилей для разных режимов
    if (currentView === 'grid') {
      categoryWrapper.style.display = 'flex';
      categoryWrapper.style.flexWrap = 'wrap';
      categoryWrapper.style.justifyContent = 'center';
      categoryWrapper.style.gap = '25px';
      categoryWrapper.style.rowGap = '25px';
    } 
    else if (currentView === 'horizontal') {
      categoryWrapper.style.display = 'flex';
      categoryWrapper.style.flexDirection = 'column';
      categoryWrapper.style.alignItems = 'center';
      categoryWrapper.style.gap = '25px';
    } 
    else if (currentView === 'list') {
      categoryWrapper.style.display = 'flex';
      categoryWrapper.style.flexDirection = 'column';
      categoryWrapper.style.gap = '25px';
    }
    
    productsContainer.appendChild(categoryWrapper);
    
    category.items.forEach((item, itemIndex) => {
      if (item.status === "hidden") return;
      
      const card = document.createElement('div');
      card.className = 'product-card';
      
      const name = item.name[lang] || item.name;
      const description = item.description?.[lang] || item.description || '';
      
      // Определение класса статуса в зависимости от значения
      let statusClass = '';
      let statusText = '';
      
      if (item.status === 'in_stock') {
        statusClass = 'in-stock';
        statusText = translations[lang].in_stock;
      } else if (item.status === 'soon') {
        statusClass = 'soon';
        statusText = translations[lang].soon;
      } else if (item.status === 'out_of_stock') {
        statusClass = 'out-of-stock';
        statusText = translations[lang].out_of_stock;
      }
      
      // Проверяем, доступен ли товар для заказа
      const isDisabled = item.status === 'out_of_stock';
      
      // Добавляем отображение размеров
      const externalSize = item.externalSize ? `
        <div class="size-item">
          <span class="size-label">${translations[lang].external_size}:</span>
          <span class="size-value">${item.externalSize}</span>
        </div>
      ` : '';
      
      const internalSize = item.internalSize ? `
        <div class="size-item">
          <span class="size-label">${translations[lang].internal_size}:</span>
          <span class="size-value">${item.internalSize}</span>
        </div>
      ` : '';
      
      const sizes = (externalSize || internalSize) ? `
        <div class="product-sizes">
          ${externalSize}
          ${internalSize}
        </div>
      ` : '';

      // Генерация HTML в зависимости от режима
      if (currentView === 'list') {
        card.innerHTML = `
          <img src="${item.image}" alt="${name}">
          <div class="product-info">
            <div class="product-group">
              <h4>${name}</h4>
              <div class="description">${description}</div>
            </div>
            ${sizes}
            <div class="control-group">
              ${statusText ? `<div class="status ${statusClass}">${statusText}</div>` : ''}
              <div class="product-price">${item.price} грн</div>
              <div class="quantity-controls">
                <button class="quantity-btn minus" data-cat="${catIndex}" data-item="${itemIndex}" 
                        ${isDisabled ? 'disabled' : ''}>-</button>
                <input type="number" min="1" value="1" class="quantity-input" 
                       data-cat="${catIndex}" data-item="${itemIndex}" 
                       ${isDisabled ? 'disabled' : ''}>
                <button class="quantity-btn plus" data-cat="${catIndex}" data-item="${itemIndex}" 
                        ${isDisabled ? 'disabled' : ''}>+</button>
              </div>
              <button class="add-to-cart btn-primary" data-cat="${catIndex}" data-item="${itemIndex}" 
                      ${isDisabled ? 'disabled' : ''}>
                ${translations[lang].add_to_cart}
              </button>
            </div>
          </div>
        `;
      } else {
        card.innerHTML = `
          <img src="${item.image}" alt="${name}">
          
          <div class="product-group">
            <h4>${name}</h4>
            <div class="description">${description}</div>
          </div>
          
          ${sizes}
          
          <div class="control-group">
            ${statusText ? `<div class="status ${statusClass}">${statusText}</div>` : ''}
            <div class="product-price">${item.price} грн</div>
            
            <div class="quantity-controls">
              <button class="quantity-btn minus" data-cat="${catIndex}" data-item="${itemIndex}" 
                      ${isDisabled ? 'disabled' : ''}>-</button>
              <input type="number" min="1" value="1" class="quantity-input" 
                     data-cat="${catIndex}" data-item="${itemIndex}" 
                     ${isDisabled ? 'disabled' : ''}>
              <button class="quantity-btn plus" data-cat="${catIndex}" data-item="${itemIndex}" 
                      ${isDisabled ? 'disabled' : ''}>+</button>
            </div>
            
            <button class="add-to-cart btn-primary" data-cat="${catIndex}" data-item="${itemIndex}" 
                    ${isDisabled ? 'disabled' : ''}>
              ${translations[lang].add_to_cart}
            </button>
          </div>
        `;
      }
      
      categoryWrapper.appendChild(card);
    });
  });
  
  // Добавляем обработчики
  document.querySelectorAll('.add-to-cart:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const catIndex = e.target.getAttribute('data-cat');
      const itemIndex = e.target.getAttribute('data-item');
      const quantityInput = e.target.closest('.product-card').querySelector('.quantity-input');
      const quantity = parseInt(quantityInput.value);
      
      addToCart(catIndex, itemIndex, quantity);
    });
  });
  
  // Обработчики кнопок +/-
  document.querySelectorAll('.quantity-btn.plus:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const input = e.target.parentElement.querySelector('.quantity-input');
      input.value = parseInt(input.value) + 1;
    });
  });
  
  document.querySelectorAll('.quantity-btn.minus:not(:disabled)').forEach(btn => {
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
      image: product.image,
      externalSize: product.externalSize,
      internalSize: product.internalSize
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
    
    // Добавляем отображение размеров в корзине, если они есть
    const sizeInfo = [];
    if (item.externalSize) sizeInfo.push(`${translations[lang].external_size}: ${item.externalSize}`);
    if (item.internalSize) sizeInfo.push(`${translations[lang].internal_size}: ${item.internalSize}`);
    
    const sizeHtml = sizeInfo.length > 0 
      ? `<div>${sizeInfo.join('<br>')}</div>` 
      : '';
    
    li.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="item-info">
        <div>${item.name}</div>
        ${sizeHtml}
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
