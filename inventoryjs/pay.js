function updateTotalCost() {
    const price = parseFloat(document.querySelector('.price').value.replace(/[^0-9.]/g, '')) || 0;
    const quantity = parseInt(document.querySelector('.num-quantity').value, 10) || 0;
    const total = price * quantity;
    document.querySelector('.total').value = `₱${total.toFixed(2)}`;
    updateChange();
}

function updateChange() {
    const budget = parseFloat(document.querySelector('.input-budget').value.replace(/[^0-9.]/g, '')) || 0;
    const total = parseFloat(document.querySelector('.total').value.replace(/[^0-9.]/g, '')) || 0;
    const change = budget - total;
    document.querySelector('.change').value = `₱${Math.max(change, 0).toFixed(2)}`;
}

function addnum() {
    const quantityInput = document.querySelector('.num-quantity');
    let currentValue = parseInt(quantityInput.value, 10) || 0;
    quantityInput.value = currentValue + 1;
    updateTotalCost();
}

function deductnum() {
    const quantityInput = document.querySelector('.num-quantity');
    let currentValue = parseInt(quantityInput.value, 10) || 0;
    if (currentValue > 0) {
        quantityInput.value = currentValue - 1;
        updateTotalCost();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.imported-clothes-container').addEventListener('click', function(event) {
        if (event.target.classList.contains('buy-button')) {
            const id = parseInt(event.target.getAttribute('data-item-id'), 10);
            const type = event.target.getAttribute('data-item-type');
            document.querySelector('.input-pname').setAttribute('data-item-id', id);
            document.querySelector('.input-pname').setAttribute('data-item-type', type);
            buyItemOrSupply(id, type);
        }
    });

    document.querySelector('.imported-clothes-container').addEventListener('click', function(event) {
        if (event.target.classList.contains('buy-button')) {
            const id = parseInt(event.target.getAttribute('data-item-id'), 10);
            const type = event.target.getAttribute('data-item-type');
            document.querySelector('.input-pname').setAttribute('data-item-id', id);
            document.querySelector('.input-pname').setAttribute('data-item-type', type);
            buyItemOrSupply(id, type);
        }
    });
});

document.querySelector('.paid').addEventListener('click', function() {
    const itemName = document.querySelector('.input-pname').value.trim();
    const size = selectedSize;

    if (itemName && size) {
        checkOutItem(itemName, size);
    } else {
        console.error('Item name or size is missing.');
    }
});

document.querySelector('.paid2').addEventListener('click', function() {
    const type = document.querySelector('.input-pname').getAttribute('data-item-type');
    if (!type) {
        console.error('Type is not set.');
        return;
    }
    checkOutSupply(); 
});

document.querySelector('.reset-sales').addEventListener('click', function() {
    localStorage.removeItem('numberOfSales');
    document.querySelector('.sold').value = 0;
});

document.addEventListener('DOMContentLoaded', function() {
    loadSales();
});

function loadSales() {
    const soldInput = document.querySelector('.sold');
    const savedSales = localStorage.getItem('numberOfSales');
    soldInput.value = savedSales !== null ? parseInt(savedSales, 10) : 0;
}

function saveSales(sales) {
    localStorage.setItem('numberOfSales', sales);
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.num-quantity').addEventListener('input', updateTotalCost);
    document.querySelector('.price').addEventListener('input', updateTotalCost);
    document.querySelector('.input-budget').addEventListener('input', updateChange);

    document.querySelector('.add-button').addEventListener('click', addnum);
    document.querySelector('.deduct-button').addEventListener('click', deductnum);
});

function updateStocksDisplay(quantity) {
    const numStocksInput = document.querySelector('.num-stocks');
    numStocksInput.value = quantity;
}

function checkOutItem(itemName, size) {
    if (!db) {
        console.error('Database is not initialized.');
        alert('Database is not initialized.');
        return;
    }

    const nameField = document.querySelector('.input-pname');
    const priceField = document.querySelector('.price');
    const quantityField = document.querySelector('.num-quantity');
    const budgetField = document.querySelector('.input-budget');

    const name = nameField.value.trim();
    let price = parseFloat(priceField.value.replace(/[^0-9.]/g, ''));
    const quantityToDeduct = parseInt(quantityField.value, 10);
    const budget = parseFloat(budgetField.value.replace(/[^0-9.]/g, '')) || 0;

    if (!name || !size) {
        console.error('Item name or size is missing.');
        alert('Item name or size is missing.');
        return;
    }

    if (isNaN(price) || isNaN(quantityToDeduct) || isNaN(budget)) {
        console.error('Invalid price, quantity, or budget input.');
        alert('Invalid price, quantity, or budget input.');
        return;
    }

    const totalCost = price * quantityToDeduct;

    if (budget < totalCost) {
        console.error('Insufficient budget:', { budget, totalCost });
        alert('Insufficient budget. Please add more funds.');
        return;
    }

    const transaction = db.transaction(['items', 'purchases'], 'readwrite');
    const itemStore = transaction.objectStore('items');
    const purchaseStore = transaction.objectStore('purchases');
    const index = itemStore.index('name-size-price');

    const key = [name, size, price.toFixed(2)];
    console.log('Retrieving key:', key);
    const request = index.get(key);

    request.onsuccess = function(event) {
        const data = event.target.result;
        if (data) {
            if (data.quantity >= quantityToDeduct) {
                data.quantity -= quantityToDeduct;

                const updateRequest = itemStore.put(data);
                updateRequest.onsuccess = function() {
                    const soldInput = document.querySelector('.sold');
                    let currentSold = parseInt(soldInput.value, 10) || 0;
                    soldInput.value = currentSold + quantityToDeduct;
                    saveSales(currentSold + quantityToDeduct);  // Save the updated sales count

                    updateRenderedItemm(data.id, data.quantity);
                    renderItem(data);

                    updateStocksDisplay(data.quantity);

                    const change = budget - totalCost;
                    document.querySelector('.change').value = `₱${Math.max(change, 0).toFixed(2)}`;

                    const date = new Date().toLocaleDateString();

                    const purchaseData = {
                        itemId: data.id,
                        itemName: name,
                        price: price.toFixed(2),
                        size: size,
                        quantity: quantityToDeduct,
                        totalCost: totalCost.toFixed(2),
                        budget: budget.toFixed(2),
                        change: change.toFixed(2),
                        date: date
                    };

                    purchaseStore.add(purchaseData);

                    alert('Check out successful!');
                    loadPurchases(); // Reload purchases to reflect new addition
                };
                updateRequest.onerror = function(event) {
                    console.error('Update error:', event.target.errorCode || event.target.error.name);
                };
            } else {
                alert('Not enough stock available.');
            }
        } else {
            alert('Item not found.');
        }
    };

    request.onerror = function(event) {
        console.error('Request error:', event.target.errorCode || event.target.error.name);
    };
}


function checkOutData() {
    const itemNameElement = document.querySelector('.item-name');
    if (!itemNameElement) {
        console.error('.item-name element not found.');
        return;
    }

    const itemName = itemNameElement.value.trim();
    const size = selectedSize;

    if (itemName && size) {
        checkOutItem(itemName, size);
    } else {
        console.log('Please select a valid item and size.');
    }
}

function checkOutSupply() {
    const nameField = document.querySelector('.input-pname');
    const priceField = document.querySelector('.price');
    const quantityField = document.querySelector('.num-quantity');
    const budgetField = document.querySelector('.input-budget');

    const name = nameField.value.trim();
    let price = parseFloat(priceField.value.replace(/[^0-9.]/g, ''));
    const quantityToDeduct = parseInt(quantityField.value, 10);
    const budget = parseFloat(budgetField.value.replace(/[^0-9.]/g, '')) || 0;

    console.log('Checkout Supply Data:', { name, price, quantityToDeduct, budget });

    if (!name || isNaN(price) || isNaN(quantityToDeduct) || quantityToDeduct <= 0) {
        console.error('Validation failed:', { name, price, quantityToDeduct });
        alert('Please fill out all fields correctly.');
        return;
    }

    if (!db) {
        console.error('Database is not initialized.');
        alert('Database is not initialized.');
        return;
    }

    const totalCost = price * quantityToDeduct;

    if (budget < totalCost) {
        console.error('Insufficient budget:', { budget, totalCost });
        alert('Insufficient budget. Please add more funds.');
        return;
    }

    const transaction = db.transaction(['supplies', 'purchases'], 'readwrite');
    const supplyStore = transaction.objectStore('supplies');
    const purchaseStore = transaction.objectStore('purchases');
    const index = supplyStore.index('name-quantity');

    const key = [name, price.toFixed(2)];
    console.log('Retrieving key:', key);
    const request = index.get(key);

    request.onsuccess = function(event) {
        const data = event.target.result;
        console.log('Data retrieved:', data);
        if (data) {
            if (data.quantity >= quantityToDeduct) {
                data.quantity -= quantityToDeduct;

                const updateRequest = supplyStore.put(data);
                updateRequest.onsuccess = function() {
                    console.log('Supply updated:', data);

                    const soldInput = document.querySelector('.sold');
                    let currentSold = parseInt(soldInput.value, 10) || 0;
                    soldInput.value = currentSold + quantityToDeduct;
                    saveSales(currentSold + quantityToDeduct);  // Save the updated sales count

                    updateStocksSupplyContainerById(data.id, data.quantity);
                    renderSupply(data);

                    updateStocksDisplay(data.quantity);

                    const change = budget - totalCost;
                    document.querySelector('.change').value = `₱${Math.max(change, 0).toFixed(2)}`;

                    const date = new Date().toLocaleDateString();

                    const purchaseData = {
                        itemId: data.id,
                        itemName: name,
                        price: price.toFixed(2),
                        quantity: quantityToDeduct,
                        totalCost: totalCost.toFixed(2),  // Include totalCost
                        budget: budget.toFixed(2),
                        change: change.toFixed(2),
                        date: date
                    };

                    purchaseStore.add(purchaseData);

                    alert('Check out successful!');
                    loadPurchases(); 
                };

                updateRequest.onerror = function(event) {
                    console.error('Update error:', event.target.errorCode || event.target.error.name);
                };
            } else {
                alert('Not enough stock available.');
            }
        } else {
            alert('Supply not found.');
        }
    };

    request.onerror = function(event) {
        console.error('Request error:', event.target.errorCode || event.target.error.name);
    };
}

function saveSoldItemOrSupply(name, quantity) {
    if (!db) {
        console.error('Database is not initialized.');
        return;
    }

    const transaction = db.transaction(['sold'], 'readwrite');
    const store = transaction.objectStore('sold');

    const soldData = {
        name: name,
        quantity: quantity
    };

    const request = store.add(soldData);

    request.onsuccess = function() {
        console.log('Sold item or supply saved:', soldData);
    };

    request.onerror = function(event) {
        console.error('Error saving sold item or supply:', event.target.errorCode || event.target.error.name);
    };
}

function getSelectedSize() {
    const selectedButton = document.querySelector('.sizes-container .size-btn.selected');
    return selectedButton ? selectedButton.dataset.size : '';
}

function deletePurchase(id) {
    const transaction = db.transaction('purchases', 'readwrite');
    const store = transaction.objectStore('purchases');
    const request = store.delete(id);

    request.onsuccess = function() {
        alert('Purchase deleted successfully!');
        loadPurchases(); 
    };

    request.onerror = function(event) {
        console.error('Error deleting purchase:', event.target.errorCode || event.target.error.name);
    };
}