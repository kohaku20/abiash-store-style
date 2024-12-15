document.addEventListener('DOMContentLoaded', () => {
    const lgnBTN = document.querySelector('.loggin');

    function lgnBtn() {
        const container = document.querySelector('.log-container');
        const main = document.querySelector('.main-login-container');
        const userfn = document.querySelector('.input-fn').value;
        const userln = document.querySelector('.input-ln').value;
        const abiashuser = document.querySelector('.input-email').value;
        const abiashpass = document.querySelector('.input-password').value;

        // Ensure all required fields are filled
        if (!userfn || !userln || !abiashuser || !abiashpass) {
            alert('Please fill out all fields.');
            return;
        }

        // Login validation
        if (abiashuser === 'abiash' && abiashpass === 'abiash12345') {
            main.classList.add('remove');
            container.classList.add('movelog');
        } else {
            alert('Inputted username or password is incorrect');
            return; // Stop the function if the login fails
        }

        // Submit the form data via fetch
        fetch('/submitdata-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userfirstname: userfn,    // This should match the 'userfirstname' column
                userlastname: userln,     // This should match the 'userlastname' column
                abiashusername: abiashuser,  // Match this with 'abiashusername' column
                abiashpasword: abiashpass   // Match this with 'abiashpasword' column
            }),
        })
        .then(response => response.text())
        .then(data => {
            alert(data);
            // Clear all input fields after submission
            document.querySelectorAll('input').forEach(input => input.value = '');
        })
        .catch(error => console.error('Error:', error));
    }

    // Attach event listener to the button
    lgnBTN.addEventListener('click', lgnBtn);
    document.querySelectorAll('input').forEach(input => input.value = '');
});

function logout() {
    // Ask for confirmation before logging out
    const confirmLogout = confirm("Are you sure you want to log out?");
    const main2 = document.querySelector('.main-login-container');
    const bck = document.querySelector('.log-container');
    
    if (confirmLogout) {
        
        bck.classList.remove('movelog');
        main2.classList.remove('remove');
        document.querySelectorAll('input').forEach(input => input.value = '');
        
    }
}