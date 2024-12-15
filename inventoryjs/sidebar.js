function btn1() {
    const pay = document.querySelector('.pay-container');
    if(btn1) {
        pay.scrollIntoView({behavior: "smooth"})
    }
}
function btn2() {
    const imported = document.querySelector('.import-container');
    if(btn1) {
        imported.scrollIntoView({behavior: "smooth"})
    }
}
function btn3() {
    document.querySelector('.clothes-container').scrollIntoView({ behavior: 'smooth' });
    document.querySelector('.clothes-container').style.opacity = '1';
    document.querySelector('.header').style.opacity = '1';
    document.querySelector('.side-bar').style.marginLeft = '-300px';
    document.querySelector('.side-bar').style.opacity = '0.5'; 
    document.querySelector('.side-bar').style.visibility = 'hidden';
    document.body.style.overflow = 'hidden';
    disableScrolling();
}

function backBtn() {
    document.querySelector('.pay-container').scrollIntoView({ behavior: 'smooth' });
    document.querySelector('.side-bar').style.marginLeft = '0';
    document.querySelector('.side-bar').style.opacity = '1'; 
    document.querySelector('.side-bar').style.visibility = 'visible'; 
    document.querySelector('.clothes-container').style.opacity = '0';
    document.body.style.overflow = 'auto';
    enableScrolling();
}

function disableScrolling() {
    document.body.style.overflow = 'hidden';
}

function enableScrolling() {
    document.body.style.overflow = '';
}

function btn5() {
    const stocks = document.querySelector('.stocks-container');
    const show = document.querySelector('.header');
    if(btn1) {
        stocks.scrollIntoView({behavior: "smooth"});
        show.style.opacity = '1';
    } else {
        show.style.opacity = '0';
    }
}
function btn6() {
    const newp = document.querySelector('.newproducts-container');
    if(btn1) {
        newp.scrollIntoView({behavior: "smooth"})
    }
}
function btn7() {
    const bought = document.querySelector('.purchased-container');
    if(btn1) {
        bought.scrollIntoView({behavior: "smooth"})
    }
}