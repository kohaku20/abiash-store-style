let currentView = '';
let editMode = false; 

function editbtn() {
    const edit = document.querySelector('.edit-btn');
    const select = document.querySelector('.select-all');
    const dlt = document.querySelector('.delete-btn');

    editMode = !editMode;

    select.classList.toggle('show1', editMode);
    dlt.classList.toggle('show2', editMode);

    updateCheckboxVisibility();

    const container = document.querySelector('.imported-clothes-container');
    const checkboxes = container.querySelectorAll('.edit-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.classList.toggle('show-checkbox', editMode);
    });
}

function updateCheckboxVisibility() {
    const container = document.querySelector('.imported-clothes-container');
    const checkboxes = container.querySelectorAll('.edit-checkbox');

    // Show checkboxes only if edit mode is active
    checkboxes.forEach(checkbox => {
        checkbox.classList.toggle('show-checkbox', editMode);
    });
}

function selectAll() {
    const checkboxes = document.querySelectorAll('.edit-checkbox');
    const selectButton = document.querySelector('.select-all');
    let allChecked = true;

    // Check if all visible checkboxes are already checked
    checkboxes.forEach(checkbox => {
        if (checkbox.classList.contains('show-checkbox')) {
            if (!checkbox.checked) {
                allChecked = false;
            }
        }
    });

    // Set all visible checkboxes to checked or unchecked based on the current state
    checkboxes.forEach(checkbox => {
        if (checkbox.classList.contains('show-checkbox')) {
            checkbox.checked = !allChecked;
        }
    });

    // Update the button text accordingly
    if (allChecked) {
        selectButton.textContent = 'Select All';
    } else {
        selectButton.textContent = 'Deselect All';
    }
}

function deleteSelected() {
    if (!db) {
        console.error('Database is not initialized.');
        return;
    }

    const container = document.querySelector('.imported-clothes-container');
    const stocksContainer = document.querySelector('.number-clothes-stocks');
    const suppliesStocksContainer = document.querySelector('.number-supplies-stocks');

    const itemTransaction = db.transaction(['items'], 'readwrite');
    const itemStore = itemTransaction.objectStore('items');
    
    const supplyTransaction = db.transaction(['supplies'], 'readwrite');
    const supplyStore = supplyTransaction.objectStore('supplies');

    if (currentView === 'items' || currentView === 'all') {
        const itemCheckboxes = container.querySelectorAll('.imported-clothes-item .edit-checkbox');
        itemCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const item = checkbox.closest('.imported-clothes-item');
                if (item) {
                    const itemId = parseInt(item.getAttribute('data-item-id'));
                    container.removeChild(item);
                    const stockItem = stocksContainer.querySelector(`.stored-stock-item[data-item-id='${itemId}']`);
                    if (stockItem) {
                        stocksContainer.removeChild(stockItem);
                    }
                    const deleteRequest = itemStore.delete(itemId);
                    deleteRequest.onsuccess = function() {
                        console.log(`Item with ID ${itemId} deleted from the object store.`);
                    };
                    deleteRequest.onerror = function(event) {
                        console.error('Delete error:', event.target.errorCode || event.target.error.name);
                    };
                } else {
                    console.warn('No item element found for the checked checkbox.');
                }
            }
        });
    }

    if (currentView === 'supplies' || currentView === 'all') {
        const supplyCheckboxes = container.querySelectorAll('.imported-supply-supply .edit-checkbox');
        supplyCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const supply = checkbox.closest('.imported-supply-supply');
                if (supply) {
                    const supplyId = parseInt(supply.getAttribute('data-item-id'));
                    container.removeChild(supply);
                    const stockSupply = suppliesStocksContainer.querySelector(`.stored-stock-supply[data-item-id='${supplyId}']`);
                    if (stockSupply) {
                        suppliesStocksContainer.removeChild(stockSupply);
                    }
                    const deleteRequest = supplyStore.delete(supplyId);
                    deleteRequest.onsuccess = function() {
                        console.log(`Supply with ID ${supplyId} deleted from the object store.`);
                    };
                    deleteRequest.onerror = function(event) {
                        console.error('Delete error:', event.target.errorCode || event.target.error.name);
                    };
                } else {
                    console.warn('No supply element found for the checked checkbox.');
                }
            }
        });
    }
}

function importedS() {
    currentView = 'supplies'; 

    document.querySelector('.edit-btn').style.display = 'block';

    resetSelectDeleteButtons();

    const select = document.querySelector('.select-all');
    const dlt = document.querySelector('.delete-btn');
    if (select.classList.contains('show1')) {
        select.classList.remove('show1');
    }
    if (dlt.classList.contains('show2')) {
        dlt.classList.remove('show2');
    }

    const container = document.querySelector('.imported-clothes-container');
    const checkboxes = container.querySelectorAll('.edit-checkbox');
    checkboxes.forEach(checkbox => {
        if (checkbox.closest('.imported-supply-supply')) {
            checkbox.style.display = 'none';
        } else {
            checkbox.style.display = 'none';
        }
    });

    const items = container.querySelectorAll('.imported-clothes-item');
    items.forEach(item => item.style.display = 'none');

    const supplies = container.querySelectorAll('.imported-supply-supply');
    supplies.forEach(supply => supply.style.display = 'block');

    hideCheckboxes();

}


function importedI() {
    currentView = 'items'; 

    document.querySelector('.edit-btn').style.display = 'block';

    resetSelectDeleteButtons();
    
    const select = document.querySelector('.select-all');
    const dlt = document.querySelector('.delete-btn');
    if (select.classList.contains('show1')) {
        select.classList.remove('show1');
    }
    if (dlt.classList.contains('show2')) {
        dlt.classList.remove('show2');
    }

    const container = document.querySelector('.imported-clothes-container');
    const checkboxes = container.querySelectorAll('.edit-checkbox');
    checkboxes.forEach(checkbox => {
        if (checkbox.closest('.imported-clothes-item')) {
            checkbox.style.display = 'none';
        } else {
            checkbox.style.display = 'none';
        }
    });

    const items = container.querySelectorAll('.imported-clothes-item');
    items.forEach(item => item.style.display = 'block');

    const supplies = container.querySelectorAll('.imported-supply-supply');
    supplies.forEach(supply => supply.style.display = 'none');

    hideCheckboxes();
}

function showAll() {
    currentView = 'all'; 

    document.querySelector('.edit-btn').style.display = 'block';

    resetSelectDeleteButtons();

    const select = document.querySelector('.select-all');
    const dlt = document.querySelector('.delete-btn');
    if (select.classList.contains('show1')) {
        select.classList.remove('show1');
    }
    if (dlt.classList.contains('show2')) {
        dlt.classList.remove('show2');
    }

    const container = document.querySelector('.imported-clothes-container');
    const items = container.querySelectorAll('.imported-clothes-item');
    const supplies = container.querySelectorAll('.imported-supply-supply');

    items.forEach(item => item.style.display = 'block');
    supplies.forEach(supply => supply.style.display = 'block');
    
    const checkboxes = container.querySelectorAll('.edit-checkbox');
    checkboxes.forEach(checkbox => checkbox.style.display = 'none');

    hideCheckboxes();
}

function hideCheckboxes() {
    const container = document.querySelector('.imported-clothes-container');
    const checkboxes = container.querySelectorAll('.edit-checkbox');

    // Ensure checkboxes are hidden
    checkboxes.forEach(checkbox => {
        checkbox.classList.remove('show-checkbox');
        checkbox.checked = false; // Uncheck the checkbox
    });

    // Reset the edit mode state when switching views
    editMode = false;
}

function resetSelectDeleteButtons() {
    const select = document.querySelector('.select-all');
    const dlt = document.querySelector('.delete-btn');

    // Ensure select and delete buttons follow the edit mode state
    if (editMode) {
        select.classList.add('show1');
        dlt.classList.add('show2');
    } else {
        select.classList.remove('show1');
        dlt.classList.remove('show2');
    }
}

window.addEventListener('scroll', function() {
    var scrollDown = window.scrollY;
    const moveHeader = document.querySelector('.header');
    if(scrollDown > 3000 && scrollDown < 4000) {
        moveHeader.style.opacity = '1';
    } else {
        moveHeader.style.opacity = '0';
    }
});

function bckbtn() {
    const back = document.querySelector('.pay-container');
    if(back) {
        back.scrollIntoView({behavior : "smooth"});
    }
}

function searchItemsAndSupplies() {
    const searchTerm = document.querySelector('.search-item').value.toLowerCase();
    const container = document.querySelector('.imported-clothes-container');

    const clothesItems = container.querySelectorAll('.imported-clothes-item');
    const suppliesItems = container.querySelectorAll('.imported-supply-supply');

    clothesItems.forEach(item => {
        const itemName = item.querySelector('.stored-name').textContent.toLowerCase();
        if (itemName.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });

    suppliesItems.forEach(supply => {
        const supplyName = supply.querySelector('.stored-name').textContent.toLowerCase();
        if (supplyName.includes(searchTerm)) {
            supply.style.display = 'block';
        } else {
            supply.style.display = 'none';
        }
    });
}

document.querySelector('.search').addEventListener('click', searchItemsAndSupplies);

document.querySelector('.search-item').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        searchItemsAndSupplies();
    }
});