 // Основные переменные
let currentAdmin = null;
let categories = [];
let editingCategoryId = null;
let editingProductId = null;

// DOM элементы
const loginSection = document.getElementById('loginSection');
const adminPanel = document.getElementById('adminPanel');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginMessage = document.getElementById('loginMessage');
const categoriesCount = document.getElementById('categoriesCount');
const productsCount = document.getElementById('productsCount');

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  // Проверяем авторизацию
  checkAuth();
  
  // Загрузка данных
  loadData();
  
  // Назначаем обработчики
  document.querySelectorAll('.admin-menu li').forEach(item => {
    if (item.id !== 'logoutBtn') {
      item.addEventListener('click', () => {
        const section = item.getAttribute('data-section');
        showSection(section);
      });
    }
  });
  
  if (loginBtn) loginBtn.addEventListener('click', login);
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
  
  // Категории
  document.getElementById('addCategoryBtn')?.addEventListener('click', showCategoryForm);
  document.getElementById('cancelCategoryBtn')?.addEventListener('click', hideCategoryForm);
  document.getElementById('saveCategoryBtn')?.addEventListener('click', saveCategory);
  
  // Товары
  document.getElementById('addProductBtn')?.addEventListener('click', showProductForm);
  document.getElementById('cancelProductBtn')?.addEventListener('click', hideProductForm);
  document.getElementById('saveProductBtn')?.addEventListener('click', saveProduct);
  
  // Заказы
  document.getElementById('applyFilterBtn')?.addEventListener('click', applyOrderFilter);
  
  // Статистика
  document.getElementById('apply-stats')?.addEventListener('click', applyStatsFilter);
  
  // Баннер
  document.getElementById('featuredEnabled')?.addEventListener('change', toggleFeaturedSettings);
  document.getElementById('featuredSelectionMode')?.addEventListener('change', toggleSelectionMode);
  document.getElementById('saveFeaturedBtn')?.addEventListener('click', saveFeaturedSettings);
  
  // Дизайн
  document.getElementById('saveCssBtn')?.addEventListener('click', saveCss);
  
  // Настройки
  document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSettings);
});

// Проверка авторизации
function checkAuth() {
  const savedAdmin = localStorage.getItem('limonet_admin');
  if (savedAdmin) {
    currentAdmin = JSON.parse(savedAdmin);
    loginSection.style.display = 'none';
    adminPanel.style.display = 'flex';
  }
}

// Загрузка данных
function loadData() {
  // Загрузка категорий и товаров
  fetch('products.json')
    .then(response => response.json())
    .then(data => {
      categories = data;
      updateCounts();
      renderCategories();
      renderProducts();
      renderFeaturedProducts();
      
      // Загрузка настроек баннера
      const featuredSettings = JSON.parse(localStorage.getItem('featured_settings')) || {
        enabled: false,
        selectionMode: 'all',
        selectedProducts: []
      };
      
      document.getElementById('featuredEnabled').checked = featuredSettings.enabled;
      document.getElementById('featuredSelectionMode').value = featuredSettings.selectionMode;
      toggleSelectionMode();
    })
    .catch(error => console.error('Error loading products:', error));
  
  // Загрузка CSS
  fetch('styles.css')
    .then(response => response.text())
    .then(css => {
      document.getElementById('cssContent').value = css;
    });
  
  // Загрузка заказов
  renderOrders();
}

// Обновление счетчиков
function updateCounts() {
  categoriesCount.textContent = categories.length;
  
  let totalProducts = 0;
  categories.forEach(category => {
    totalProducts += category.items.length;
  });
  productsCount.textContent = totalProducts;
}

// Показать раздел
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  document.querySelectorAll('.admin-menu li').forEach(item => {
    item.classList.remove('active');
  });
  
  document.getElementById(`${sectionId}Section`).classList.add('active');
  document.querySelector(`.admin-menu li[data-section="${sectionId}"]`).classList.add('active');
  
  // Загружаем заказы при переходе в раздел
  if (sectionId === 'orders') {
    renderOrders();
  }
  
  // Загружаем статистику при переходе в раздел
  if (sectionId === 'stats') {
    renderStats('day');
  }
}

// Авторизация
function login() {
  const login = document.getElementById('adminLogin').value;
  const password = document.getElementById('adminPassword').value;
  
  if (login === 'admin' && password === 'admin') {
    currentAdmin = { login };
    localStorage.setItem('limonet_admin', JSON.stringify(currentAdmin));
    loginSection.style.display = 'none';
    adminPanel.style.display = 'flex';
    showSection('dashboard');
  } else {
    loginMessage.textContent = 'Невірний логін або пароль';
  }
}

// Выход
function logout() {
  localStorage.removeItem('limonet_admin');
  location.reload();
}

// ===== Категории =====
function showCategoryForm() {
  document.getElementById('categoryForm').style.display = 'block';
  editingCategoryId = null;
  document.getElementById('categoryNameUa').value = '';
  document.getElementById('categoryNameRu').value = '';
}

function hideCategoryForm() {
  document.getElementById('categoryForm').style.display = 'none';
}

function saveCategory() {
  const nameUa = document.getElementById('categoryNameUa').value.trim();
  const nameRu = document.getElementById('categoryNameRu').value.trim();
  
  if (!nameUa || !nameRu) {
    alert('Введіть назву категорії обома мовами');
    return;
  }
  
  if (editingCategoryId === null) {
    // Новая категория
    categories.push({
      category: {
        ua: nameUa,
        ru: nameRu
      },
      items: []
    });
  } else {
    // Редактирование существующей
    categories[editingCategoryId].category = {
      ua: nameUa,
      ru: nameRu
    };
  }
  
  saveData();
  hideCategoryForm();
  renderCategories();
}

function renderCategories() {
  const container = document.getElementById('categoriesList');
  container.innerHTML = '';
  
  categories.forEach((category, index) => {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `
      <h3>${category.category.ua} / ${category.category.ru}</h3>
      <p>Товарів: ${category.items.length}</p>
      <div class="actions" style="display: flex; gap: 10px; margin-top: 10px;">
        <button class="btn btn-primary edit-category" data-id="${index}">
          <i class="fas fa-edit"></i> Редагувати
        </button>
        <button class="btn btn-danger delete-category" data-id="${index}">
          <i class="fas fa-trash"></i> Видалити
        </button>
      </div>
    `;
    container.appendChild(card);
  });
  
  // Назначаем обработчики
  document.querySelectorAll('.edit-category').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      editCategory(id);
    });
  });
  
  document.querySelectorAll('.delete-category').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      deleteCategory(id);
    });
  });
}

function editCategory(id) {
  editingCategoryId = id;
  const category = categories[id];
  document.getElementById('categoryNameUa').value = category.category.ua;
  document.getElementById('categoryNameRu').value = category.category.ru;
  document.getElementById('categoryForm').style.display = 'block';
}

function deleteCategory(id) {
  if (confirm('Видалити цю категорію? Всі товари в ній також будуть видалені.')) {
    categories.splice(id, 1);
    saveData();
    renderCategories();
  }
}

// ===== Товары =====
function showProductForm() {
  // Заполняем выпадающий список категорий
  const categorySelect = document.getElementById('productCategory');
  categorySelect.innerHTML = '';
  
  categories.forEach((category, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${category.category.ua} (${category.category.ru})`;
    categorySelect.appendChild(option);
  });
  
  document.getElementById('productForm').style.display = 'block';
  editingProductId = null;
  
  // Сброс значений
  document.getElementById('productNameUa').value = '';
  document.getElementById('productNameRu').value = '';
  document.getElementById('productDescUa').value = '';
  document.getElementById('productDescRu').value = '';
  document.getElementById('productSize').value = '';
  document.getElementById('productPrice').value = '';
  document.getElementById('productImage').value = '';
  document.getElementById('productStatus').value = 'available';
}

function hideProductForm() {
  document.getElementById('productForm').style.display = 'none';
}

function saveProduct() {
  const categoryId = document.getElementById('productCategory').value;
  const nameUa = document.getElementById('productNameUa').value.trim();
  const nameRu = document.getElementById('productNameRu').value.trim();
  const descUa = document.getElementById('productDescUa').value.trim();
  const descRu = document.getElementById('productDescRu').value.trim();
  const size = document.getElementById('productSize').value.trim();
  const price = parseFloat(document.getElementById('productPrice').value);
  const image = document.getElementById('productImage').value.trim();
  const status = document.getElementById('productStatus').value;
  
  if (!nameUa || !nameRu || !size || !price || !image) {
    alert('Заповніть всі обов\'язкові поля');
    return;
  }
  
  const productData = {
    name: {
      ua: nameUa,
      ru: nameRu
    },
    description: {
      ua: descUa,
      ru: descRu
    },
    size,
    price,
    image,
    status
  };
  
  if (editingProductId === null) {
    // Новый товар
    categories[categoryId].items.push(productData);
  } else {
    // Редактирование существующего товара
    const [catId, prodId] = editingProductId.split('-');
    categories[catId].items[prodId] = productData;
  }
  
  saveData();
  hideProductForm();
  renderProducts();
  renderFeaturedProducts();
}

function renderProducts() {
  const container = document.getElementById('productsList');
  container.innerHTML = '';
  
  categories.forEach((category, catIndex) => {
    category.items.forEach((item, prodIndex) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div style="display: flex; gap: 15px;">
          <div style="flex: 0 0 120px;">
            <img src="${item.image}" alt="${item.name.ua}" style="max-width: 100%; border-radius: 6px;">
          </div>
          <div style="flex: 1;">
            <h3>${item.name.ua} / ${item.name.ru}</h3>
            <p><strong>Категорія:</strong> ${category.category.ua} (${category.category.ru})</p>
            <p><strong>Розмір:</strong> ${item.size}</p>
            <p><strong>Ціна:</strong> ${item.price} грн</p>
            <p><strong>Статус:</strong> ${getStatusText(item.status)}</p>
          </div>
        </div>
        <div class="actions" style="display: flex; gap: 10px; margin-top: 15px;">
          <button class="btn btn-primary edit-product" data-id="${catIndex}-${prodIndex}">
            <i class="fas fa-edit"></i> Редагувати
          </button>
          <button class="btn btn-danger delete-product" data-id="${catIndex}-${prodIndex}">
            <i class="fas fa-trash"></i> Видалити
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  });
  
  // Назначаем обработчики
  document.querySelectorAll('.edit-product').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      editProduct(id);
    });
  });
  
  document.querySelectorAll('.delete-product').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      deleteProduct(id);
    });
  });
}

function getStatusText(status) {
  switch(status) {
    case 'available': return '<span style="color: #27ae60;">Доступно</span>';
    case 'soon': return '<span style="color: #f39c12;">Очікується</span>';
    case 'hidden': return '<span style="color: #7f8c8d;">Приховано</span>';
    default: return status;
  }
}

function editProduct(id) {
  editingProductId = id;
  const [catId, prodId] = id.split('-');
  const product = categories[catId].items[prodId];
  
  // Заполняем выпадающий список категорий
  const categorySelect = document.getElementById('productCategory');
  categorySelect.innerHTML = '';
  
  categories.forEach((category, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${category.category.ua} (${category.category.ru})`;
    if (index == catId) option.selected = true;
    categorySelect.appendChild(option);
  });
  
  // Заполняем поля
  document.getElementById('productNameUa').value = product.name.ua;
  document.getElementById('productNameRu').value = product.name.ru;
  document.getElementById('productDescUa').value = product.description?.ua || '';
  document.getElementById('productDescRu').value = product.description?.ru || '';
  document.getElementById('productSize').value = product.size;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productImage').value = product.image;
  document.getElementById('productStatus').value = product.status;
  
  document.getElementById('productForm').style.display = 'block';
}

function deleteProduct(id) {
  if (confirm('Видалити цей товар?')) {
    const [catId, prodId] = id.split('-');
    categories[catId].items.splice(prodId, 1);
    saveData();
    renderProducts();
    renderFeaturedProducts();
  }
}

// ===== Заказы =====
function loadOrders() {
  return JSON.parse(localStorage.getItem('limonet_orders')) || [];
}

function applyOrderFilter() {
  const filter = document.getElementById('orderStatusFilter').value;
  renderOrders(filter);
}

function renderOrders(filter = 'all') {
  const container = document.getElementById('ordersList');
  const orders = loadOrders();
  
  if (orders.length === 0) {
    container.innerHTML = '<p>Немає замовлень</p>';
    return;
  }
  
  let filteredOrders = orders;
  if (filter !== 'all') {
    filteredOrders = orders.filter(order => order.status === filter);
  }
  
  // Сортируем по дате (новые сверху)
  filteredOrders.sort((a, b) => b.id - a.id);
  
  container.innerHTML = '';
  
  filteredOrders.forEach(order => {
    const orderElement = document.createElement('div');
    orderElement.className = 'order-card';
    orderElement.style.background = 'white';
    orderElement.style.padding = '15px';
    orderElement.style.borderRadius = '8px';
    orderElement.style.marginBottom = '15px';
    orderElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
    
    orderElement.innerHTML = `
      <div class="order-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0;">Замовлення #${order.id}</h3>
        <div>
          <span class="order-status status-${order.status}">${getOrderStatusText(order.status)}</span>
          <span class="order-date" style="color: #7f8c8d; font-size: 14px;">${order.date}</span>
        </div>
      </div>
      <div class="order-summary" style="margin-top: 10px;">
        <p><strong>Клієнт:</strong> ${order.customer.fio}</p>
        <p><strong>Телефон:</strong> ${order.customer.phone}</p>
        <p><strong>Сума:</strong> ${order.total} грн</p>
        <p><strong>Оплата:</strong> ${getPaymentMethod(order.customer.payment)}</p>
      </div>
      <div style="margin-top: 15px; text-align: right;">
        <button class="btn btn-primary view-order-details" data-id="${order.id}">
          <i class="fas fa-eye"></i> Деталі
        </button>
      </div>
    `;
    container.appendChild(orderElement);
  });
  
  // Добавляем обработчики для кнопок "Детали"
  document.querySelectorAll('.view-order-details').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const orderId = e.target.getAttribute('data-id');
      viewOrderDetails(orderId);
    });
  });
}

function getOrderStatusText(status) {
  switch(status) {
    case 'new': return 'Новий';
    case 'processing': return 'В обробці';
    case 'completed': return 'Завершено';
    case 'cancelled': return 'Скасовано';
    default: return status;
  }
}

function getPaymentMethod(payment) {
  if (payment === 'card') return 'На картку';
  if (payment === 'cod') return 'Накладений платіж';
  return payment;
}

function viewOrderDetails(orderId) {
  const orders = loadOrders();
  const order = orders.find(o => o.id == orderId);
  
  if (!order) {
    alert('Замовлення не знайдено');
    return;
  }
  
  // Формируем HTML с деталями заказа
  let itemsHtml = '';
  order.items.forEach(item => {
    itemsHtml += `
      <tr>
        <td><img src="${item.image}" alt="${item.name}" style="width:50px; height:50px; object-fit: cover; border-radius: 4px;"></td>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.price} грн</td>
        <td>${(item.price * item.quantity).toFixed(2)} грн</td>
      </tr>
    `;
  });
  
  const detailsHtml = `
    <div class="order-details" style="background: white; padding: 20px; border-radius: 8px; max-width: 800px; margin: 0 auto;">
      <h2 style="margin-top: 0;">Замовлення #${order.id}</h2>
      
      <div style="margin-bottom: 20px;">
        <label><strong>Статус:</strong></label>
        <select id="orderStatus" class="form-control" style="max-width: 200px;">
          <option value="new" ${order.status === 'new' ? 'selected' : ''}>Новий</option>
          <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>В обробці</option>
          <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Завершено</option>
          <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Скасовано</option>
        </select>
      </div>
      
      <div class="customer-info" style="margin-bottom: 20px;">
        <h3>Інформація про клієнта</h3>
        <p><strong>ПІБ:</strong> ${order.customer.fio}</p>
        <p><strong>Телефон:</strong> ${order.customer.phone}</p>
        <p><strong>Місто:</strong> ${order.customer.city}</p>
        <p><strong>Відділення пошти:</strong> ${order.customer.post}</p>
        <p><strong>Спосіб оплати:</strong> ${getPaymentMethod(order.customer.payment)}</p>
        <p><strong>Коментар:</strong> ${order.customer.comment || '-'}</p>
      </div>
      
      <div class="order-items">
        <h3>Товари</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Фото</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Назва</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Кількість</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Ціна</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Сума</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">Загальна сума:</td>
              <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${order.total} грн</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div class="order-actions" style="display: flex; gap: 10px; margin-top: 20px;">
        <button id="saveOrderBtn" class="btn btn-primary">
          <i class="fas fa-save"></i> Зберегти зміни
        </button>
        <button id="closeOrderDetails" class="btn btn-neutral">
          <i class="fas fa-times"></i> Закрити
        </button>
      </div>
    </div>
  `;
  
  // Создаем модальное окно
  const modal = document.createElement('div');
  modal.className = 'order-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '1000';
  modal.innerHTML = detailsHtml;
  document.body.appendChild(modal);
  
  // Обработчики кнопок
  document.getElementById('saveOrderBtn').addEventListener('click', () => {
    saveOrderStatus(orderId, document.getElementById('orderStatus').value);
  });
  
  document.getElementById('closeOrderDetails').addEventListener('click', () => {
    modal.remove();
  });
}

function saveOrderStatus(orderId, newStatus) {
  const orders = loadOrders();
  const orderIndex = orders.findIndex(o => o.id == orderId);
  
  if (orderIndex !== -1) {
    orders[orderIndex].status = newStatus;
    localStorage.setItem('limonet_orders', JSON.stringify(orders));
    
    // Обновляем список заказов
    const filter = document.getElementById('orderStatusFilter').value;
    renderOrders(filter);
    
    // Закрываем модальное окно
    document.querySelector('.order-modal').remove();
    
    alert('Статус замовлення оновлено!');
  }
}

// ===== Статистика =====
function loadSalesStats(period) {
  const orders = JSON.parse(localStorage.getItem('limonet_orders')) || [];
  const now = new Date();
  const stats = {};
  
  orders.forEach(order => {
    if (order.status !== 'completed') return;
    
    const orderDate = new Date(order.date);
    let include = false;
    
    switch(period) {
      case 'day':
        include = orderDate.toDateString() === now.toDateString();
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        include = orderDate >= weekStart;
        break;
      case 'month':
        include = orderDate.getMonth() === now.getMonth() && 
                 orderDate.getFullYear() === now.getFullYear();
        break;
      case 'year':
        include = orderDate.getFullYear() === now.getFullYear();
        break;
    }
    
    if (include) {
      order.items.forEach(item => {
        if (!stats[item.name]) {
          stats[item.name] = { quantity: 0, sum: 0 };
        }
        stats[item.name].quantity += item.quantity;
        stats[item.name].sum += item.price * item.quantity;
      });
    }
  });
  
  return stats;
}

function renderStats(period) {
  const stats = loadSalesStats(period);
  const tbody = document.getElementById('stats-body');
  tbody.innerHTML = '';
  
  let totalQty = 0;
  let totalSum = 0;
  
  Object.keys(stats).forEach(product => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${product}</td>
      <td>${stats[product].quantity}</td>
      <td>${stats[product].sum.toFixed(2)} грн</td>
      <td>${(stats[product].sum * 0.8).toFixed(2)} грн</td> <!-- Пример расчета дохода -->
    `;
    tbody.appendChild(tr);
    
    totalQty += stats[product].quantity;
    totalSum += stats[product].sum;
  });
  
  document.getElementById('stats-total-qty').textContent = totalQty;
  document.getElementById('stats-total-sum').textContent = totalSum.toFixed(2) + ' грн';
  document.getElementById('stats-total-profit').textContent = (totalSum * 0.8).toFixed(2) + ' грн';
}

function applyStatsFilter() {
  const period = document.getElementById('stats-period').value;
  renderStats(period);
}

// ===== Баннер =====
function toggleFeaturedSettings() {
  const enabled = document.getElementById('featuredEnabled').checked;
  if (enabled) {
    document.getElementById('featuredSelectionMode').disabled = false;
    toggleSelectionMode();
  } else {
    document.getElementById('featuredSelectionMode').disabled = true;
    document.getElementById('manualSelection').style.display = 'none';
  }
}

function toggleSelectionMode() {
  const mode = document.getElementById('featuredSelectionMode').value;
  if (mode === 'manual') {
    document.getElementById('manualSelection').style.display = 'block';
  } else {
    document.getElementById('manualSelection').style.display = 'none';
  }
}

function renderFeaturedProducts() {
  const container = document.getElementById('featured-products-list');
  container.innerHTML = '';
  
  const featuredSettings = JSON.parse(localStorage.getItem('featured_settings')) || {
    enabled: false,
    selectedProducts: []
  };
  
  categories.forEach((category, catIndex) => {
    category.items.forEach((item, itemIndex) => {
      const id = `${catIndex}-${itemIndex}`;
      const isChecked = featuredSettings.selectedProducts.includes(id);
      
      const div = document.createElement('div');
      div.className = 'featured-item';
      div.innerHTML = `
        <img src="${item.image}" alt="${item.name.ua}">
        <div style="margin-top: 10px;">
          <strong>${item.name.ua}</strong>
          <p>${item.price} грн</p>
        </div>
        <div class="featured-checkbox" style="margin-top: 10px;">
          <label>
            <input type="checkbox" class="featured-product" value="${id}" ${isChecked ? 'checked' : ''}>
            Обрати для показу
          </label>
        </div>
      `;
      container.appendChild(div);
    });
  });
}

function saveFeaturedSettings() {
  const enabled = document.getElementById('featuredEnabled').checked;
  const selectionMode = document.getElementById('featuredSelectionMode').value;
  const selected = [];
  
  if (selectionMode === 'manual') {
    document.querySelectorAll('.featured-product:checked').forEach(checkbox => {
      selected.push(checkbox.value);
    });
  }
  
  const settings = {
    enabled,
    selectionMode,
    selectedProducts: selected
  };
  
  localStorage.setItem('featured_settings', JSON.stringify(settings));
  alert('Налаштування баннера збережено!');
}

// ===== Дизайн =====
function saveCss() {
  const cssContent = document.getElementById('cssContent').value;
  
  // Сохраняем CSS в localStorage
  localStorage.setItem('limonet_css', cssContent);
  
  // Обновляем CSS на сайте
  const styleTag = document.createElement('style');
  styleTag.textContent = cssContent;
  
  // Удаляем старый стиль, если есть
  const oldStyle = document.getElementById('dynamic-css');
  if (oldStyle) oldStyle.remove();
  
  styleTag.id = 'dynamic-css';
  document.head.appendChild(styleTag);
  
  alert('CSS успішно збережено!');
}

// ===== Настройки =====
function saveSettings() {
  const newLogin = document.getElementById('adminUsername').value.trim();
  const newPassword = document.getElementById('adminNewPassword').value;
  const confirmPassword = document.getElementById('adminConfirmPassword').value;
  
  if (newLogin && newPassword) {
    if (newPassword !== confirmPassword) {
      alert('Паролі не співпадають');
      return;
    }
    
    currentAdmin.login = newLogin;
    localStorage.setItem('limonet_admin', JSON.stringify(currentAdmin));
    alert('Дані успішно оновлено!');
  }
}

// Сохранение данных
function saveData() {
  // Сохраняем в localStorage
  localStorage.setItem('limonet_products', JSON.stringify(categories));
  
  // Обновляем счетчики
  updateCounts();
  
  // Обновляем данные на сайте
  const event = new Event('dataUpdated');
  document.dispatchEvent(event);
}
