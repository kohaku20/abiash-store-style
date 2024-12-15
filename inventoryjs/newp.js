document.addEventListener('DOMContentLoaded', () => {
    const costInput = document.querySelector('.cost-p');
    const markupInput = document.querySelector('.markup');
    const priceInput = document.querySelector('.price02');
    const submitButton = document.querySelector('.submit-newp');

    function updatePrice() {
        const cost = parseFloat(costInput.value.trim()) || 0;
        const markup = parseFloat(markupInput.value.trim()) || 0;
        const finalPrice = cost + (cost * markup / 100);
        priceInput.value = finalPrice.toFixed(2);
    }

    costInput.addEventListener('input', updatePrice);
    markupInput.addEventListener('input', updatePrice);

    function addNewP(event) {
        event.preventDefault(); 

        const itemName = document.querySelector('.input-discription').value.trim();
        const itemDateReceived = document.querySelector('.data01').value.trim();
        const itemQuantityReceived = parseInt(document.querySelector('.quantity01').value, 10) || 0;
        const itemCost = parseFloat(document.querySelector('.cost-p').value.trim()) || 0;
        const itemDateSold = document.querySelector('.data02').value.trim();
        const itemInvNo = document.querySelector('.inv-num').value.trim();
        const itemAddress = document.querySelector('.p-address').value.trim();
        const itemQuantitySold = parseInt(document.querySelector('.quantity02').value, 10) || 0;
        const itemPrice = parseFloat(document.querySelector('.price02').value.trim()) || 0;
        const itemAmount = parseFloat(document.querySelector('.amount02').value.trim()) || 0;
        const stocksOnHand = document.querySelector('.hold').value.trim();

        if (!itemDateReceived || !itemQuantityReceived || !itemCost || !itemDateSold || !itemInvNo || !itemAddress || !itemQuantitySold || !itemPrice || !itemAmount || !stocksOnHand) {
            alert('Please fill out all fields.');
            return; 
        }

        fetch('/submit-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                description: itemName,
                date1: itemDateReceived,
                quantity1: itemQuantityReceived,
                cost: itemCost,
                date2: itemDateSold,
                invNum: itemInvNo,
                pAddress: itemAddress,
                quantity2: itemQuantitySold,
                price: itemPrice.toFixed(2),
                amount: itemAmount,
                hold: stocksOnHand,
            }),
        })
        .then(response => response.text())
        .then(data => {
            alert(data); 
            document.querySelectorAll('input').forEach(input => input.value = '');
            fetchProducts(); 
        })
        .catch(error => console.error('Error:', error));
    }

    submitButton.addEventListener('click', addNewP);

    fetchProducts(); 
});


let currentProductData = {};
let useServer = true; 

function fetchProducts() {
    if (useServer) {
        fetch('/get-products')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Fetched data from server:', data);
                currentProductData = {};
                const container = document.querySelector('.newproduct-output');
                container.innerHTML = '';

                data.forEach(product => {
                    currentProductData[product.id] = { ...product };
                    const row = document.createElement('div');
                    row.className = 'output-row';
                    row.dataset.id = product.id;

                    Object.keys(product).forEach(key => {
                        if (key !== 'description') {
                            const cell = document.createElement('div');
                            cell.className = 'output-cell';
                            cell.classList.add('cell');
                            cell.textContent = key === 'date1' || key === 'date2'
                                ? new Date(product[key]).toISOString().split('T')[0]
                                : product[key];

                            cell.dataset.key = key;
                            cell.contentEditable = false;

                            cell.addEventListener('dblclick', () => enableEditing(cell));
                            cell.addEventListener('blur', () => disableEditing(cell));
                            cell.addEventListener('keydown', (event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    disableEditing(cell);
                                }
                            });

                            row.appendChild(cell);
                        }
                    });

                    const importCell = document.createElement('div');
                    importCell.className = 'output-cell';
                    const importButton = document.createElement('button');
                    importButton.textContent = 'Import';
                    importButton.className = 'output-cell-button';
                    importButton.addEventListener('click', () => showImportForm(product));
                    importCell.appendChild(importButton);
                    row.appendChild(importCell);

                    const deleteCell = document.createElement('div');
                    deleteCell.className = 'output-cell';
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.className = 'output-cell-dlt';
                    deleteButton.addEventListener('click', () => deleteProduct(product.id));
                    deleteCell.appendChild(deleteButton);
                    row.appendChild(deleteCell);

                    container.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error fetching from server:', error);
                alert('Failed to load products from server.');
            });
    } else {
        if (!db) {
            console.error('Database is not initialized.');
            return;
        }

        const transaction = db.transaction(['items'], 'readonly');
        const store = transaction.objectStore('items');
        const request = store.getAll();

        request.onsuccess = function(event) {
            const data = event.target.result;
            console.log('Fetched data from IndexedDB:', data);

            const container = document.querySelector('.imported-clothes-container');
            container.innerHTML = '';

            data.forEach(item => {
                if (item.isSupply || !item.size.trim()) {
                    renderSupply(item);
                } else {
                    renderItem(item);
                }
            });
        };

        request.onerror = function(event) {
            console.error('Fetch error from IndexedDB:', event.target.errorCode || event.target.error.name);
        };
    }
}

function previewImages3() {
    const imageInput = document.getElementById('item-images');
    const previewContainer = document.querySelector('.image-preview-container');

    if (imageInput.files && imageInput.files.length > 0) {
        previewContainer.innerHTML = ''; // Clear previous previews

        // Show only the first image in the preview
        const firstFile = imageInput.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            const imgElement = document.createElement('img');
            imgElement.src = e.target.result;
            imgElement.style.width = '100%';
            imgElement.style.height = '100%';
            previewContainer.appendChild(imgElement);
        };

        reader.onerror = function() {
            console.error('Error reading file:', firstFile.name);
        };

        reader.readAsDataURL(firstFile); // Start reading the first file
    } else {
        previewContainer.innerHTML = ''; // Clear previews if no files
    }
}

// Function to show the import form
function showImportForm(product) {
    const formHtml = `
        <div id="import-form-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;">
            <div class="newpnewform" style="padding: 20px; border-radius: 10px; background: #fff;">
                <h2>Import Item</h2>
                <form id="import-form">
                    <div class="image-preview-container"> </div>
                    <div class="onenewp">
                        <div class="newpfirst">
                            <label for="item-name">Name:</label>
                            <input type="text" id="item-name" name="name" required>
                        </div>
                        <div class="newpsecond">
                            <label for="item-size">Size:</label>
                            <input type="text" id="item-size" name="size">
                        </div>
                    </div>
                    <div class="secondnewp">
                        <div class="newpthird">
                            <label for="item-quantity">Quantity:</label>
                            <input type="number" id="item-quantity" name="quantity" required>
                        </div>
                        <div class="newpfifth">
                            <label for="item-price">Price:</label>
                            <input type="text" id="item-price" name="price" readonly>
                        </div>
                    </div>
                    <div class="newpfourth">
                        <label for="item-images">Images:</label>
                        <input type="file" id="item-images" name="images" accept="image/*" multiple required>
                    </div>
                    <div class="newp-btns">
                        <button class="newpsubmit" type="submit">Add Item</button>
                        <button class="newpcancel" type="button" id="cancel-import">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', formHtml);

    const priceInput = document.getElementById('item-price');
    priceInput.value = product.price;

    const imageInput = document.getElementById('item-images');
    const previewContainer = document.querySelector('.image-preview-container');

    // Attach event listener for image input change to preview images
    imageInput.addEventListener('change', previewImages3);

    const importForm = document.getElementById('import-form');
    const cancelImport = document.getElementById('cancel-import');

    importForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const itemName = document.getElementById('item-name').value.trim();
        const itemSize = document.getElementById('item-size').value.trim();

        if (itemSize) {
            handleImportSubmit();  // Size field is filled
        } else {
            handleWithoutSize();   // Size field is not filled
        }
    });

    cancelImport.addEventListener('click', () => {
        document.getElementById('import-form-overlay').remove();
    });
}

function handleImportSubmit() {
    const itemName = document.getElementById('item-name').value.trim();
    const itemSize = document.getElementById('item-size').value.trim() ? document.getElementById('item-size').value.trim() : '';
    const itemQuantity = parseInt(document.getElementById('item-quantity').value, 10) || 1;
    const itemPrice = document.getElementById('item-price').value.trim();
    const imageFiles = document.getElementById('item-images').files;

    if (!itemName || !itemPrice || imageFiles.length === 0) {
        alert('Please fill out all fields and upload at least one image.');
        return;
    }

    const priceNumber = parseFloat(itemPrice.replace(/[^0-9.]/g, ''));
    if (isNaN(priceNumber) || priceNumber <= 0) {
        alert('Please enter a valid price.');
        return;
    }

    // Convert images to base64
    convertImagesToBase64(imageFiles).then(imageSrcs => {
        const newItem = {
            name: itemName,
            size: itemSize || 'N/A',  // Handle missing size by using a default value like 'N/A'
            price: priceNumber.toFixed(2),
            imageSrcs: imageSrcs,  // Store all base64 images
            quantity: itemQuantity,
            isNew: true  // Mark the item as new
        };

        // Storing the item in IndexedDB
        const transaction = db.transaction(['items'], 'readwrite');
        const store = transaction.objectStore('items');
        const addRequest = store.add(newItem);

        addRequest.onsuccess = function(event) {
            newItem.id = event.target.result;
            renderItem(newItem);  // Use your custom renderItem function to display it
            addToStocksContainer(newItem.id, newItem.name, newItem.size, newItem.quantity);  // Update the stock container
        };

        addRequest.onerror = function(event) {
            console.error('Add error:', event.target.errorCode || event.target.error.name);
        };

        document.getElementById('import-form-overlay').remove();
    }).catch(error => {
        console.error('Error converting images:', error);
        alert('An error occurred while processing the images.');
    });
}

function convertImagesToBase64(files) {
    return new Promise((resolve, reject) => {
        const imageSrcs = [];
        let processed = 0;

        Array.from(files).forEach(file => {
            const reader = new FileReader();

            reader.onload = function(e) {
                imageSrcs.push(e.target.result);
                processed++;

                if (processed === files.length) {
                    resolve(imageSrcs);
                }
            };

            reader.onerror = function() {
                reject(new Error("Failed to convert image to base64."));
            };

            // Start reading the file
            reader.readAsDataURL(file);
        });
    });
}

function convertSupplyImagesToBase64(files) {
    return new Promise((resolve, reject) => {
        const imgSrcs = [];
        let processed = 0;

        Array.from(files).forEach(file => {
            const reader = new FileReader();

            reader.onload = function(e) {
                imgSrcs.push(e.target.result);
                processed++;

                if (processed === files.length) {
                    resolve(imgSrcs);
                }
            };

            reader.onerror = function() {
                reject(new Error("Failed to convert image to base64."));
            };

            // Start reading the file
            reader.readAsDataURL(file);
        });
    });
}


// Function to handle supply without size (size is explicitly set to null)
function handleWithoutSize() {
    const supplyName = document.getElementById('item-name').value.trim();
    const supplyPrice = document.getElementById('item-price').value.trim();
    const supplyQuantity = parseInt(document.getElementById('item-quantity').value, 10) || 1;
    const imageInput = document.getElementById('item-images');

    // Validate that the image input exists and has files
    if (!supplyName || !supplyPrice || !imageInput || !imageInput.files || imageInput.files.length === 0) {
        alert('Please fill out all fields and upload at least one image.');
        return;
    }

    const supplyPriceNumber = parseFloat(supplyPrice.replace(/[^0-9.]/g, ''));
    if (isNaN(supplyPriceNumber) || supplyPriceNumber <= 0) {
        alert('Please enter a valid price.');
        return;
    }

    convertSupplyImagesToBase64(imageInput.files).then(supplyImgSrcs => {
        // Process and add the supply to IndexedDB
        const transaction = db.transaction(['supplies'], 'readwrite');
        const store = transaction.objectStore('supplies');
        const index = store.index('name-quantity');

        const request = index.get([supplyName, supplyPriceNumber.toFixed(2)]);

        request.onsuccess = function(event) {
            const existingSupply = event.target.result;

            if (existingSupply) {
                // Update existing supply quantity
                existingSupply.quantity += supplyQuantity;
                const updateRequest = store.put(existingSupply);
                updateRequest.onsuccess = function() {
                    updateStocksSupplyContainerById(existingSupply.id, existingSupply.quantity);
                    renderSupply(existingSupply);  // Render updated supply
                };
                updateRequest.onerror = function(event) {
                    console.error('Update error:', event.target.errorCode || event.target.error.name);
                };
            } else {
                // Add new supply with size set to null
                const newSupply = {
                    name: supplyName,
                    size: null,  // Explicitly set size to null
                    price: supplyPriceNumber.toFixed(2),
                    imgSrcs: supplyImgSrcs,  // Use the Base64 images
                    quantity: supplyQuantity,
                    isNew: true
                };
                const addRequest = store.add(newSupply);
                addRequest.onsuccess = function(event) {
                    newSupply.id = event.target.result;
                    renderSupply(newSupply);  // Render new supply
                    addtoSupplyStocksContainer(newSupply.id, newSupply.name, newSupply.quantity);  // Update stock container
                };
                addRequest.onerror = function(event) {
                    console.error('Add error:', event.target.errorCode || event.target.error.name);
                };
            }
        };

        request.onerror = function(event) {
            console.error('Request error:', event.target.errorCode || event.target.error.name);
        };

        // Optionally, close the form or overlay if necessary
        document.getElementById('import-form-overlay').remove();
    }).catch(error => {
        console.error('Error converting images:', error);
        alert('An error occurred while processing the images.');
    });
}

function enableEditing(cell) {
    cell.contentEditable = 'true';
    cell.focus(); 
}

function disableEditing(cell) {
    const row = cell.parentElement;
    const id = row.dataset.id;
    const key = cell.dataset.key;
    const value = cell.textContent.trim();

    cell.contentEditable = 'false';

    if (cell.dataset.originalValue !== value) {
        saveChanges(id, key, value);
    }
}

document.addEventListener('focusin', (event) => {
    if (event.target.classList.contains('output-cell')) {
        event.target.dataset.originalValue = event.target.textContent.trim();
    }
});


function saveChanges(id, key, value) {
    if (key === 'date1' || key === 'date2') {
        const formattedDate = new Date(value).toISOString().split('T')[0];
        value = formattedDate;
    }

    currentProductData[id][key] = value; // Update local data

    fetch(`/edit-product/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentProductData[id]), // Send entire product data
    })
    .then(response => response.text())
    .then(message => {
        alert(message);
        fetchProducts(); 
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to update product.');
    });
}

function deleteProduct(id) {
    fetch(`/delete-product/${id}`, { method: 'DELETE' })
        .then(response => response.text())
        .then(message => {
            alert(message);
            fetchProducts(); 
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to delete product.');
        });
}

function editProduct(id) {
    const newDescription = prompt('Enter new description:');
    if (newDescription === null) return;

    const newDate1 = prompt('Enter new date1 (YYYY-MM-DD):');
    const newDate2 = prompt('Enter new date2 (YYYY-MM-DD):');
    const newQuantity1 = parseInt(prompt('Enter new quantity1:'), 10);
    const newCost = parseFloat(prompt('Enter new cost:'));
    const newQuantity2 = parseInt(prompt('Enter new quantity2:'), 10);
    const newPrice = parseFloat(prompt('Enter new price:'));
    const newAmount = parseFloat(prompt('Enter new amount:'));
    const newHold = prompt('Enter new hold:');
    const newInvNum = prompt('Enter new invNum:');
    const newPAddress = prompt('Enter new pAddress:');

    const updatedProduct = {
        description: newDescription,
        date1: newDate1,
        quantity1: newQuantity1,
        cost: newCost,
        date2: newDate2,
        invNum: newInvNum,
        pAddress: newPAddress,
        quantity2: newQuantity2,
        price: newPrice,
        amount: newAmount,
        hold: newHold
    };

    fetch(`/edit-product/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProduct),
    })
    .then(response => response.text())
    .then(message => {
        alert(message);
        fetchProducts(); 
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to update product.');
    });
}