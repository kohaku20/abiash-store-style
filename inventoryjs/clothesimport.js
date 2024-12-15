let selectedSize = '';

let imageSrcs = []; 

let db;

function initDB() {
    const request = indexedDB.open('InventoryDB', 3);

    request.onupgradeneeded = function(event) {
        db = event.target.result;

        // Setup 'items' object store and its index
        if (!db.objectStoreNames.contains('items')) {
            const itemsStore = db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
            itemsStore.createIndex('name-size-price', ['name', 'size', 'price'], { unique: true });
        } else {
            const itemsStore = event.target.transaction.objectStore('items');
            if (!itemsStore.indexNames.contains('name-size-price')) {
                itemsStore.createIndex('name-size-price', ['name', 'size', 'price'], { unique: true });
            }
        }

        // Setup 'supplies' object store and its index
        if (!db.objectStoreNames.contains('supplies')) {
            const suppliesStore = db.createObjectStore('supplies', { keyPath: 'id', autoIncrement: true });
            suppliesStore.createIndex('name-quantity', ['name', 'price'], { unique: false });
        } else {
            const suppliesStore = event.target.transaction.objectStore('supplies');
            if (!suppliesStore.indexNames.contains('name-quantity')) {
                suppliesStore.createIndex('name-quantity', ['name', 'price'], { unique: false });
            }
        }

        // Setup 'purchases' object store and its index
        if (!db.objectStoreNames.contains('purchases')) {
            const purchasesStore = db.createObjectStore('purchases', { keyPath: 'id', autoIncrement: true });
            purchasesStore.createIndex('date', 'date', { unique: false });
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        listIndexes();
        loadItemsAndSupplies();
        loadPurchases();
        fetchProducts();
        console.log('Database opened successfully.');
    };

    request.onerror = function(event) {
        console.error('Database error:', event.target.errorCode || event.target.error.name);
    };
}

document.addEventListener('DOMContentLoaded', initDB);

function loadPurchases() {
    const purchaseContainer = document.querySelector('.bought-container');
    const transaction = db.transaction('purchases', 'readonly');
    const store = transaction.objectStore('purchases');
    const request = store.openCursor();

    purchaseContainer.innerHTML = ''; 

    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const data = cursor.value;

            const purchaseElement = document.createElement('div');
            purchaseElement.classList.add('purchase-item');
            purchaseElement.classList
            purchaseElement.innerHTML = `
                <div class="item">${data.itemName}</div>
                <div class="item">₱${data.price}</div>
                <div class="item">${data.size || ''}</div>
                <div class="item">${data.quantity}</div>
                <div class="item">₱${data.totalCost}</div> 
                <div class="item">₱${data.budget}</div>
                <div class="item">₱${data.change}</div>
                <div class="item">${data.date}</div>
                <div class="item"><button class="dltBtn" onclick="deletePurchase(${data.id})">Delete</button></div>
            `;
            purchaseContainer.appendChild(purchaseElement);

            cursor.continue();
        }
    };

    request.onerror = function(event) {
        console.error('Error loading purchases:', event.target.errorCode || event.target.error.name);
    };
}

function listIndexes() {
    if (!db) {
        console.error('Database is not initialized.');
        return;
    }

    const itemsTransaction = db.transaction(['items'], 'readonly');
    const itemsStore = itemsTransaction.objectStore('items');
    console.log('Indexes for "items" object store:');
    const itemsIndexNames = Array.from(itemsStore.indexNames);
    itemsIndexNames.forEach(index => console.log(`- ${index}`));

    const suppliesTransaction = db.transaction(['supplies'], 'readonly');
    const suppliesStore = suppliesTransaction.objectStore('supplies');
    console.log('Indexes for "supplies" object store:');
    const suppliesIndexNames = Array.from(suppliesStore.indexNames);
    suppliesIndexNames.forEach(index => console.log(`- ${index}`));
}

function selectedsize(size, element) {
    document.querySelectorAll('.size-btn').forEach(button => {
        button.style.backgroundColor = button.textContent.trim() === size ? 'lightblue' : '';
    });

    element.classList.add('selected');
    element.style.backgroundColor = 'lightblue';
    selectedSize = size;
    console.log(`Selected size for checkout: ${size}`);
}

function selectSize(size, element) {
    document.querySelectorAll('.avail-size .sizes').forEach(btn => {
        btn.classList.remove('selected');
        btn.style.backgroundColor = '';
    });

    element.classList.add('selected');
    element.style.backgroundColor = 'lightblue';
    selectedSize = size;
    console.log(`Size selected for import: ${selectedSize}`);
}

function previewImages(event) {
    const files = event.target.files;
    imageSrcs = []; // Ensure this is defined in the right scope

    if (files.length > 0) {
        let loadedImages = 0;
        for (const file of files) {
            const reader = new FileReader();

            reader.onload = function(event) {
                imageSrcs.push(event.target.result);
                loadedImages++;
                if (loadedImages === files.length) {
                    if (imageSrcs.length > 0) {
                        document.querySelector('.shirt-images').src = imageSrcs[0];
                    }
                }
            };

            reader.readAsDataURL(file);
        }
    }
}

function addItem() {
    if (!db) {
        console.error('Database is not initialized.');
        return;
    }

    const itemName = document.querySelector('.search-name').value.trim();
    const itemPrice = document.querySelector('.item-price').value.trim();
    const itemQuantity = parseInt(document.querySelector('.current-quantity').value, 10) || 1;

    if (!itemName || !itemPrice || !selectedSize || imageSrcs.length === 0) {
        alert('Please fill out all fields and upload at least one image.');
        return;
    }

    const priceNumber = parseFloat(itemPrice.replace(/[^0-9.]/g, ''));
    if (isNaN(priceNumber) || priceNumber <= 0) {
        alert('Please enter a valid price.');
        return;
    }

    const transaction = db.transaction(['items'], 'readwrite');
    const store = transaction.objectStore('items');
    const index = store.index('name-size-price');
    const request = index.get([itemName, selectedSize, priceNumber.toFixed(2)]);

    request.onsuccess = function(event) {
        const existingItem = event.target.result;

        if (existingItem) {
            existingItem.quantity += itemQuantity;
            const updateRequest = store.put(existingItem);
            updateRequest.onsuccess = function() {
                updateRenderedItemm(existingItem.id, existingItem.quantity);
                renderItem(existingItem);
            };
            updateRequest.onerror = function(event) {
                console.error('Update error:', event.target.errorCode || event.target.error.name);
            };
        } else {
            const newItem = {
                name: itemName,
                size: selectedSize,
                price: priceNumber.toFixed(2),
                imageSrcs: imageSrcs, // Store as an array
                quantity: itemQuantity
            };

            const addRequest = store.add(newItem);
            addRequest.onsuccess = function(event) {
                newItem.id = event.target.result;
                renderItem(newItem);
                addToStocksContainer(newItem.id, newItem.name, newItem.size, newItem.quantity);
            };
            addRequest.onerror = function(event) {
                console.error('Add error:', event.target.errorCode || event.target.error.name);
            };
        }
    };

    request.onerror = function(event) {
        console.error('Request error:', event.target.errorCode || event.target.error.name);
    };
}

function updateRenderedItemm(itemId, newQuantity) {
    const container = document.querySelector('.number-clothes-stocks');
    
    if (!container) {
        console.error('Container not found.');
        return;
    }

    const itemstocked = container.querySelectorAll(`.stored-stock-item[data-item-id="${itemId}"]`);

    let updated = false;

    itemstocked.forEach(stock => {
        const stockitemID = stock.getAttribute('data-item-id');
        if (stockitemID && parseInt(stockitemID, 10) === itemId) {
            const quantityEle = stock.querySelector('.quantity'); // Ensure this class matches the HTML
            if (quantityEle) {
                quantityEle.textContent = newQuantity || 'No quantity'; // Update quantity
                updated = true;
                console.log(`Updated stock: ID ${itemId}, Quantity: ${newQuantity}`);
            } else {
                console.error('Quantity element not found.');
            }
        }
    });

    if (!updated) {
        const transaction = db.transaction(['items'], 'readonly');
        const store = transaction.objectStore('items');
        const request = store.get(itemId);

        request.onsuccess = function(event) {
            const item = event.target.result;
            if (item) {
                addToStocksContainer(item.id, item.name, item.size, item.quantity);
            } else {
                console.error('Item not found in database.');
            }
        };

        request.onerror = function(event) {
            console.error('Error fetching item:', event.target.errorCode || event.target.error.name);
        };
    }
}

function initializeModal() {
    let modal = document.getElementById('imageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.classList.add('modal');
        modal.innerHTML = `
            <span class="prev">&#10094;</span>
            <span class="next">&#10095;</span>
            <img class="modal-content" id="modalImg">
        `;
        document.body.appendChild(modal);
    }

    const modalImg = modal.querySelector('#modalImg');
    const prev = modal.querySelector('.prev');
    const next = modal.querySelector('.next');

    let currentImageIndex = 0;
    let currentImageSrcs = [];

    function showImageGallery(srcs) {
        currentImageSrcs = srcs;
        currentImageIndex = 0;
        if (currentImageSrcs.length > 0) {
            modalImg.src = currentImageSrcs[currentImageIndex];
            modal.style.display = 'block';
        }
    }

    function showNextImage() {
        if (currentImageSrcs.length > 0) {
            currentImageIndex = (currentImageIndex + 1) % currentImageSrcs.length;
            modalImg.src = currentImageSrcs[currentImageIndex];
        }
    }

    function showPreviousImage() {
        if (currentImageSrcs.length > 0) {
            currentImageIndex = (currentImageIndex - 1 + currentImageSrcs.length) % currentImageSrcs.length;
            modalImg.src = currentImageSrcs[currentImageIndex];
        }
    }

    prev.addEventListener('click', showPreviousImage);
    next.addEventListener('click', showNextImage);

    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    return showImageGallery;
}

const showImageGallery = initializeModal();

function renderItem(item) {
    console.log('Rendering item:', item);
    const container = document.querySelector('.imported-clothes-container');

    // Check if the item already exists in the DOM
    let existingItem = container.querySelector(`.imported-clothes-item[data-item-id="${item.id}"]`);

    if (existingItem) {
        // Ensure existingItem is a DOM element before calling updateRenderedItem
        if (existingItem instanceof Element) {
            // If item exists, update the existing item's details
            updateRenderedItem(existingItem, item);
        } else {
            console.error('Expected existingItem to be a DOM element, but got:', existingItem);
        }
    } else {
        // If item does not exist, create a new slot for it
        const newItem = document.createElement('div');
        newItem.style.width = "300px";
        newItem.style.borderRadius = "20px";
        newItem.style.overflow = "hidden";
        newItem.style.position = "relative";
        newItem.style.boxShadow = "0 0 5px rgba(0,0,0,0.20)";
        newItem.style.height = "320px";
        newItem.style.display = 'flex';
        newItem.style.flexDirection = 'column';
        newItem.style.alignItems='center';
        newItem.style.justifyContent='start';
        newItem.style.backgroundColor = "white";
        newItem.classList.add('imported-clothes-item');
        newItem.setAttribute('data-item-id', item.id);

        const firstImageSrc = item.imageSrcs && item.imageSrcs.length > 0 ? item.imageSrcs[0] : '';

        newItem.innerHTML = `
            <input type="checkbox" class="edit-checkbox" style="position: absolute; top: 10px; right: 10px; display: none; height: 20px; width: 20px; z-index: 10px;">
            <div class="stored-img" style="position: relative;">
                <img src="${firstImageSrc}" alt="Item Image" width="100%" height="100%">
                 ${item.isNew ? '<div class="new-item-design">New</div>' : ''}
            </div>
            <div class="stored-item">
                <label class="data-info">Item name:</label>
                <h2 class="stored-name">${item.name}</h2>
            </div>
            ${item.size ? `
                <div class="stored-size">
                    <label class="data-info">Size:</label>
                    <h2 class="stored-sized">${item.size}</h2>
                </div>
                ` : ''}
            <div class="stored-price">
                <label class="data-info">Price:</label>
                <h2 class="stored-name"><span class="pesos">₱</span>${parseFloat(item.price).toFixed(2)}</h2>
            </div>
            <div class="stored-quantity2">
                <label class="data-info">Stocks:</label>
                <h2 class="stored-quantities">${item.quantity}</h2>
            </div>
            <button class="buy-button" data-item-id="${item.id}" data-item-type="item">
            &#128722;
            </button>
        `;

        newItem.querySelector('.stored-img img').addEventListener('click', () => {
            showImageGallery(item.imageSrcs);
        });

        console.log('New item created:', newItem);
        container.appendChild(newItem);
    }
}

function updateRenderedItem(existingItem, item) {
    if (!(existingItem instanceof Element)) {
        console.error('Expected existingItem to be a DOM element, but got:', existingItem);
        return;
    }

    // Update the existing item’s details
    const nameElement = existingItem.querySelector('.stored-name');
    if (nameElement) {
        nameElement.textContent = item.name;
    }

    const sizeElement = existingItem.querySelector('.stored-sized');
    if (sizeElement) {
        sizeElement.textContent = item.size || 'N/A';
    }

    const priceElement = existingItem.querySelector('.stored-price');
    if (priceElement) {
        priceElement.innerHTML = `<span class="pesos">₱</span>${parseFloat(item.price).toFixed(2)}`;
    }

    const quantityElement = existingItem.querySelector('.stored-quantities');
    if (quantityElement) {
        quantityElement.textContent = item.quantity;
    }

    const imgElement = existingItem.querySelector('img');
    if (imgElement) {
        imgElement.src = item.imageSrcs && item.imageSrcs.length > 0 ? item.imageSrcs[0] : '';
    }
}


function updateItem(existingItem, item) {
    // Update the existing item with new data
    existingItem.querySelector('.stored-img img').src = item.imageSrcs[0] || '';
    existingItem.querySelector('.stored-name').textContent = item.name;
    if (item.size) {
        existingItem.querySelector('.stored-size').innerHTML = `
            <label class="data-info">Size:</label>
            <h2 class="stored-sized">${item.size}</h2>
        `;
    }
    existingItem.querySelector('.stored-price h2').innerHTML = `<span class="pesos">₱</span>${parseFloat(item.price).toFixed(2)}`;
    existingItem.querySelector('.stored-quantities').textContent = item.quantity;

    // Optionally handle new badge display if needed
    const newBadge = existingItem.querySelector('.new-badge');
    if (item.isNew) {
        if (!newBadge) {
            const badge = document.createElement('div');
            badge.className = 'new-badge';
            badge.style.position = 'absolute';
            badge.style.top = '10px';
            badge.style.right = '10px';
            badge.style.background = 'red';
            badge.style.color = 'white';
            badge.style.padding = '5px 10px';
            badge.style.borderRadius = '10px';
            badge.style.fontSize = '14px';
            badge.style.fontWeight = 'bold';
            badge.textContent = 'New';
            existingItem.querySelector('.stored-img').appendChild(badge);
        }
    } else if (newBadge) {
        newBadge.remove();
    }
}

function addToStocksContainer(id, name, size, quantity) {
    const stocksContainer = document.querySelector('.number-clothes-stocks');

    let existingItem = stocksContainer.querySelector(`.stored-stock-item[data-item-id="${id}"]`);
    if (existingItem) {
        const quantityEle = existingItem.querySelector('.quantity');
        if (quantityEle) {
            quantityEle.textContent = quantity || 'No quantity';
        } else {
            console.error('Quantity element not found for existing item.');
        }
        return;
    }

    const stockItem = document.createElement('div');
    stockItem.classList.add('stored-stock-item');
    stockItem.setAttribute('data-item-id', id);

    stockItem.innerHTML = `
        <p class="detail">${name}</p>
        <p class="detail">${size}</p>
        <p class="quantity stored-quantities">${quantity}</p> 
    `;

    stocksContainer.appendChild(stockItem);
}

function buyItemOrSupply(id, type) {
    console.log('buyItemOrSupply called:', { id, type }); 

    if (typeof id !== 'number' || (type !== 'item' && type !== 'supply')) {
        console.error('Invalid parameters:', { id, type });
        return;
    }

    const storeName = type === 'item' ? 'items' : 'supplies'; 
    const request = indexedDB.open('InventoryDB'); 

    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction([storeName], 'readonly'); 
        const store = transaction.objectStore(storeName);
        const getRequest = store.get(id); 

        getRequest.onsuccess = function(event) {
            const data = event.target.result;
            console.log('Data retrieved:', data);
            if (data) {
                transferToPaymentRepository(data, type);
            } else {
                console.error(`Data not found for ${type} with ID: ${id}`);
            }
        };

        getRequest.onerror = function(event) {
            console.error('Request error:', event.target.errorCode || event.target.error.name);
        };
    };

    request.onerror = function(event) {
        console.error('Database error:', event.target.errorCode || event.target.error.name);
    };
}


function transferToPaymentRepository(data, type) {
    console.log('transferToPaymentRepository called:', { data, type }); 

    const purchaseQuantity = 1;
    const totalPrice = parseFloat(data.price) * purchaseQuantity;

    document.querySelector('.input-pname').value = data.name;
    document.querySelector('.price').value = data.price;
    document.querySelector('.num-quantity').value = purchaseQuantity;
    document.querySelector('.total').value = `₱${totalPrice.toFixed(2)}`;
    document.querySelector('.num-stocks').value = data.quantity;

    if (type === 'item') {
        document.querySelectorAll('.size-btn').forEach(button => {
            if (button.textContent.trim() === data.size) {
                button.style.backgroundColor = 'lightblue';
                selectedSize = data.size; // Ensure selectedSize is updated
            } else {
                button.style.backgroundColor = '';
            }
        });
        document.querySelector('.supply-images').src = ''; 
    } else if (type === 'supply') {
        document.querySelector('.supply-images').src = data.img;
        document.querySelectorAll('.size-btn').forEach(button => {
            button.style.backgroundColor = ''; 
        });
    }
}

function removeFromStocksContainer(name, size) {
    const stocksContainer = document.querySelector('.number-clothes-stocks');
    const stockItems = stocksContainer.querySelectorAll('.stored-stock-item');

    stockItems.forEach(stock => {
        const itemName = stock.querySelector('.detail:first-child').textContent;
        const itemSize = stock.querySelector('.detail:nth-child(2)').textContent;
        if (itemName === name && itemSize === size) {
            stocksContainer.removeChild(stock);
        }
    });
}

function loadItemsAndSupplies() {
    if (!db) {
        console.error('Database is not initialized.');
        return;
    }

    const itemsTransaction = db.transaction(['items'], 'readonly');
    const itemsStore = itemsTransaction.objectStore('items');
    const itemsRequest = itemsStore.getAll();

    itemsRequest.onsuccess = function(event) {
        const items = event.target.result;
        console.log('Items loaded:', items);

        document.querySelector('.number-clothes-stocks').innerHTML = '';

        items.forEach(item => {
            renderItem(item);
            addToStocksContainer(item.id, item.name, item.size, item.quantity);
        });

        const suppliesTransaction = db.transaction(['supplies'], 'readonly');
        const suppliesStore = suppliesTransaction.objectStore('supplies');
        const suppliesRequest = suppliesStore.getAll();

        suppliesRequest.onsuccess = function(event) {
            const supplies = event.target.result;
            console.log('Supplies loaded:', supplies);

            document.querySelector('.number-supplies-stocks').innerHTML = '';

            supplies.forEach(supply => {
                renderSupply(supply);
                addtoSupplyStocksContainer(supply.id, supply.name, supply.quantity);
            });
        };

        suppliesRequest.onerror = function(event) {
            console.error('Supplies request error:', event.target.errorCode || event.target.error.name);
        };
    };

    itemsRequest.onerror = function(event) {
        console.error('Items request error:', event.target.errorCode || event.target.error.name);
    };
}

function saveSupplies(supplies) {
    supplies.forEach(supply => {
        renderSupply(supply);
        addtoSupplyStocksContainer(supply.name, supply.quantity);
    });
}

function clearInputs() {
    document.querySelector('.search-name').value = '';
    document.querySelector('.item-price').value = '';
    document.querySelector('.shirt-images').src = '';
    document.querySelector('.current-quantity').value = '';
    selectedSize = '';
    document.querySelectorAll('.sizes').forEach(button => button.style.backgroundColor = '');
}


let supplyImageSrcs = []; 

function previewImages2(event) {
    const files = event.target.files;
    supplyImageSrcs = []; // Ensure this is defined in the right scope

    if (files.length > 0) {
        let loadedImages = 0;
        for (const file of files) {
            const reader = new FileReader();

            reader.onload = function(event) {
                supplyImageSrcs.push(event.target.result);
                loadedImages++;
                if (loadedImages === files.length) {
                    if (supplyImageSrcs.length > 0) {
                        document.querySelector('.supply-images').src = supplyImageSrcs[0];
                        console.log('Loaded supply image URLs:', supplyImageSrcs); // Debug line
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    }
}

function addSupply() {
    if (!db) {
        console.error('Database is not initialized.');
        return;
    }

    const supplyName = document.querySelector('.search-supply').value.trim();
    const supplyPrice = document.querySelector('.supply-price').value.trim();
    const supplyImgSrcs = supplyImageSrcs; // Array of image URLs
    const supplyQuantityField = parseInt(document.querySelector('.c-quantity').value, 10) || 1;

    if (!supplyName || !supplyPrice || supplyImgSrcs.length === 0) {
        alert('Please fill out all fields and upload at least one image.');
        return;
    }

    const convertPrice = parseFloat(supplyPrice.replace(/[^0-9.]/g, ''));
    if (isNaN(convertPrice) || convertPrice <= 0) {
        alert('Please enter a valid price.');
        return;
    }

    const transaction = db.transaction(['supplies'], 'readwrite');
    const store = transaction.objectStore('supplies');
    const index = store.index('name-quantity');

    const request = index.get([supplyName, convertPrice.toFixed(2)]);

    request.onsuccess = function(event) {
        const existingSupply = event.target.result;

        if (existingSupply) {
            existingSupply.quantity += supplyQuantityField;
            const updateRequest = store.put(existingSupply);
            updateRequest.onsuccess = function() {
                updateStocksSupplyContainerById(existingSupply.id, existingSupply.quantity);
                renderSupply(existingSupply);
            };
            updateRequest.onerror = function(event) {
                console.error('Update error:', event.target.errorCode || event.target.error.name);
            };
        } else {
            const newSupply = {
                name: supplyName,
                price: convertPrice.toFixed(2),
                imgSrcs: supplyImgSrcs, // Ensure this is correctly assigned
                quantity: supplyQuantityField
            };
            console.log('New supply to add:', newSupply); // Debug line
            const addRequest = store.add(newSupply);
            addRequest.onsuccess = function(event) {
                newSupply.id = event.target.result;
                renderSupply(newSupply);
                addtoSupplyStocksContainer(newSupply.id, newSupply.name, newSupply.quantity);
            };
            addRequest.onerror = function(event) {
                console.error('Add error:', event.target.errorCode || event.target.error.name);
            };
        }
    };

    request.onerror = function(event) {
        console.error('Request error:', event.target.errorCode || event.target.error.name);
    };
}

function updateStocksSupplyContainerById(supplyId, newQuantity) {
    const stocksContainer = document.querySelector('.number-supplies-stocks');
    const stockItems = stocksContainer.querySelectorAll(`.stored-stock-supply[data-item-id="${supplyId}"]`);

    let updated = false;

    stockItems.forEach(stock => {
        const stockSupplyId = stock.getAttribute('data-item-id');
        if (stockSupplyId && parseInt(stockSupplyId, 10) === supplyId) {
            const quantityElement = stock.querySelector('.stored-s-quantities');
            if (quantityElement) {
                quantityElement.textContent = newQuantity || 'No quantity';
            }
            updated = true;
            console.log(`Updated stock: ID ${supplyId}, Quantity: ${newQuantity}`);
        }
    });

    if (!updated) {
        const transaction = db.transaction(['supplies'], 'readonly');
        const store = transaction.objectStore('supplies');
        const request = store.get(supplyId);

        request.onsuccess = function(event) {
            const supply = event.target.result;
            if (supply) {
                addtoSupplyStocksContainer(supply.name, supply.quantity);
            }
        };

        request.onerror = function(event) {
            console.error('Error fetching supply:', event.target.errorCode || event.target.error.name);
        };
    }
}

function renderSupply(supply) {
    console.log('Rendering supply:', supply);
    const container = document.querySelector('.imported-clothes-container');

    const existingSupply = container.querySelector(`.imported-supply-supply[data-item-id='${supply.id}']`);
    if (existingSupply) {
        container.removeChild(existingSupply);
    }

    const newSupply = document.createElement('div');
    newSupply.style.width = "300px";
    newSupply.style.borderRadius = "20px";
    newSupply.style.overflow = "hidden";
    newSupply.style.position = "relative";
    newSupply.style.boxShadow = "0 0 5px rgba(0,0,0,0.20)";
    newSupply.style.height = "320px";
    newSupply.style.display = 'flex';
    newSupply.style.flexDirection = 'column';
    newSupply.style.alignItems='center';
    newSupply.style.justifyContent='start';
    newSupply.style.backgroundColor = "white";
    newSupply.classList.add('imported-supply-supply');
    newSupply.setAttribute('data-item-id', supply.id);

    const firstImageSrc = supply.imgSrcs && supply.imgSrcs.length > 0 ? supply.imgSrcs[0] : '';
    console.log('First image source:', firstImageSrc);  // Debugging line

    newSupply.innerHTML = `
        <input type="checkbox" class="edit-checkbox" style="display:none; position: absolute; top: 10px; right: 10px; height: 20px; width: 20px;">
        <div class="stored-img" style="position: relative;">
            <img src="${firstImageSrc}" alt="Item Image" width="100%" height="100%">
            ${supply.isNew ? '<div class="new-item-design">New</div>' : ''}
        </div>
        <div class="stored-item">
            <label class="data-info">Item name:</label>
            <h2 class="stored-name">${supply.name}</h2>
        </div>
        <div class="stored-price">
            <label class="data-info">Price:</label>
            <h2 class="stored-name"><span class="pesos">₱</span>${supply.price}</h2>
        </div>
        <div class="stored-quantity">
            <label class="data-info">Stocks:</label>
            <h2 class="stored-quantities">${supply.quantity}</h2>
        </div>
        <button class="buy-button" data-item-id="${supply.id}" data-item-type="supply">
            &#128722;
        </button>
    `;

    newSupply.querySelector('.stored-img img').addEventListener('click', () => {
        showImageGallery(supply.imgSrcs);
    });

    console.log('New supply created:', newSupply);
    container.appendChild(newSupply);
}

function addtoSupplyStocksContainer(id, name, quantity) {
    console.log('Adding to stocks container with:', { id, name, quantity });

    const supplystocksContainer = document.querySelector('.number-supplies-stocks');

    const newSstock = document.createElement('div');
    newSstock.setAttribute('data-item-id', id);
    newSstock.classList.add('stored-stock-supply');

    newSstock.innerHTML = `
        <h1 class="detail-stocks">${name || 'No name'}</h1>
        <h1 class="detail-stocks stored-s-quantities">${quantity || 'No quantity'}</h1>
    `;
    supplystocksContainer.appendChild(newSstock);
}