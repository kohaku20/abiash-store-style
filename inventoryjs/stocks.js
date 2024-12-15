const style = document.createElement('style');
    style.textContent = `
        .highlight-high {
            background-color: lightgreen;
        }
        .highlight-low {
            background-color: lightblue;
        }
`;
document.head.append(style);

function filterStocks(option) {
    const stocks = document.querySelectorAll('.stored-stock-item');
    const supplies = document.querySelectorAll('.stored-stock-supply');

    const applyFilter = (elements, quantityClass) => {
    elements.forEach(element => {
    element.classList.remove('highlight-high', 'highlight-low');

    const quantityElement = element.querySelector(`.${quantityClass}`);
    if (quantityElement) {
            const quantity = parseInt(quantityElement.textContent, 10);
                if (option === 'highQuantity' && quantity >= 30) {
                    element.classList.add('highlight-high');
                } else if (option === 'lowQuantity' && quantity <= 29) {
                    element.classList.add('highlight-low');
                } else if (option === 'none') {
                    element.classList.remove('highlight-high');
                    element.classList.remove('highlight-low');
                }
            }
        });
    };

    applyFilter(stocks, 'stored-quantities');

    applyFilter(supplies, 'stored-s-quantities');
}

document.getElementById('removed').addEventListener('click', function() {
    var sidebar = document.querySelector('.side-bar');
    const pay = document.querySelector('.payment-repository');
    const shirt = document.querySelector('.tshirt-container');
    const supply = document.querySelector('.supply-container');
    const item = document.querySelector('.clothes-stocks-container');
    const sup = document.querySelector('.supplies-stocks-container');
    const newp = document.querySelector('.newp-container');
    const new2 = document.querySelector('.newp-data');
    const data1 = document.querySelector('.date1');
    const data11= document.querySelector('.cost-cons');
    const data12 = document.querySelector('.markup');
    const data2 = document.querySelector('.quantity1');
    const data3 = document.querySelector('.date2');
    const data4 = document.querySelector('.inv');
    const data5 = document.querySelector('.address');
    const data6 = document.querySelector('.quantity2');
    const data7 = document.querySelector('.price2');
    const datanme = document.querySelector('.receive2');
    const data8 = document.querySelector('.hold');
    const output = document.querySelector('.newp-output');
    const history = document.querySelector('.history-header');
    const qwe = document.querySelector('.purchased-items');
    var button = this;

    var used = '&#8646;';

    console.log('Button innerHTML before:', button.innerHTML);

    if(button.innerHTML === used) {
        sidebar.classList.toggle('leftside');
        pay.classList.toggle('paymove');
        shirt.classList.toggle('shirtmove');
        supply.classList.toggle('supplymove');
        item.classList.toggle('itemmove');
        sup.classList.toggle('supmove');
        newp.classList.toggle('newpmove');
        new2.classList.toggle('new2');
        data1.classList.toggle('datemove');
        data11.classList.toggle('costmove');
        data12.classList.toggle('markmove');
        data2.classList.toggle('quantitymove');
        data3.classList.toggle('date2move');
        data4.classList.toggle('invmove');
        data5.classList.toggle('addressmove');
        data6.classList.toggle('quantity2move');
        data7.classList.toggle('price2move');
        datanme.classList.toggle('small');
        data8.classList.toggle('handmove');
        output.classList.toggle('outputmove');
        history.classList.toggle('historymove');
        qwe.classList.toggle('wide');

    } else {
        sidebar.classList.toggle('leftside');
        pay.classList.toggle('paymove');
        shirt.classList.toggle('shirtmove');
        supply.classList.toggle('supplymove');
        item.classList.toggle('itemmove');
        sup.classList.toggle('supmove');
        newp.classList.toggle('newpmove');
        new2.classList.toggle('new2');
        data1.classList.toggle('datemove');
        data11.classList.toggle('costmove');
        data12.classList.toggle('markmove');
        data2.classList.toggle('quantitymove');
        data3.classList.toggle('date2move');
        data4.classList.toggle('invmove');
        data5.classList.toggle('addressmove');
        data6.classList.toggle('quantity2move');
        data7.classList.toggle('price2move');
        datanme.classList.toggle('small');
        data8.classList.toggle('handmove');
        output.classList.toggle('outputmove');
        history.classList.toggle('historymove');
        qwe.classList.toggle('wide');
    }
});