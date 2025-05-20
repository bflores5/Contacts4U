//run after html loaded parsed
document.addEventListener('DOMContentLoaded', () => {
    //create register form
    const registerForm = document.getElementById('register-form');

    //add submit listener
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            //for causing page reloads
            event.preventDefault();

            //input element references
            const firstNameInput = document.getElementById('firstName');
            const lastNameInput = document.getElementById('lastName');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            //creating object from user credentials and information
            const userData = {
                firstName: firstNameInput.value,
                lastName: lastNameInput.value,
                email: emailInput.value,
                password: passwordInput.value
            };

            //sending json post requests to the register backend route
            try {
                const response = await fetch('http://127.0.0.1:5000/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                
                //parsing json response
                const data = await response.json();

                //checking to see if the backend was responsive to successfully store those credentials to the backend.
                if (response.ok) {
                    console.log('Registration successful:', data);
                    //take them back to the login.html page
                    window.location.href = 'login.html';
                    alert('Registration successful! Please log in.');
                } else {
                    console.error('Registration failed:', data);
                    alert(`Registration failed: ${data.error || 'Something went wrong.'}`);
                }

            } catch (error) {
                console.error('There was an error during registration:', error);
                alert('There was a network error during registration.');
            }
        });
    }
//create login form 
    const loginForm = document.getElementById('login-form');

    //if login form in the DOM then use submit listener
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            //gather input from login form for references.
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            //create object from the input
            const credentials = {
                email: emailInput.value,
                password: passwordInput.value
            };

            //send post request to the backend route and convert to json string
            try {
                const response = await fetch('http://127.0.0.1:5000/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(credentials)
                });

                //parse json response
                const data = await response.json();

                //checks with backend to see if login was able to be done
                if (response.ok) {
                    console.log('Login successful:', data);
                    const userId = data.userId;
                    //redirect to index page
                    if (userId) {
                        window.location.href = `index.html?userId=${userId}`;
                    } else {
                        console.error('Login successful but userId not received.');
                        alert('Login successful but could not identify user.');
                    }
                } else {
                    console.error('Login failed:', data);
                    alert(`Login failed: ${data.error || 'Invalid credentials.'}`);
                }

            } catch (error) {
                console.error('There was an error during login:', error);
                alert('There was a network error during login.');
            }
        });
    }

    //create situation handling for logging out 
    const logoutButton = document.getElementById('logout-btn');

    //if a logout element exists add click even listener
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            //send a logout request to the backend
            try {
                const response = await fetch('http://127.0.0.1:5000/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                //parse json response to backend
                const data = await response.json();

                //verifying that the log out event has been successfully made
                if (response.ok && data.message === 'You have been logged out.') {
                    console.log('Logout successful:', data);
                    window.location.href = 'login.html';
                    alert('Logged out successfully.');
                } else {
                    console.error('Logout failed:', data);
                    alert(`Logout failed: ${data.error || 'Something went wrong.'}`);
                }

            //making sure internet connection and logic implementation is correct
            } catch (error) {
                console.error('There was a network error during logout:', error);
                alert('There was a network error during logout.');
            }
        });
    }
});