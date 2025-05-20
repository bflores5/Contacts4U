//using html elements for welcoming user
const userGreetingSpan = document.getElementById('user-greeting');
//rendering contact table list
const contactListBody = document.getElementById('contact-list');
let showingFavoritesOnly = false;

//runs code after html is parsed and loaded 
document.addEventListener('DOMContentLoaded', () => {
    //A LIST OF HTML functions that will be converted to JS
    //gets button element that opens modal form for adding contact
    const addContactBtn = document.getElementById('add-contact-btn');
    //modal element for adding and editing contacts
    const contactFormModal = document.getElementById('contact-form-modal');
    //button element trigger to close modal
    const closeModalSpan = document.querySelector('.close-button');
    //form to manage contact information
    const contactForm = document.getElementById('contact-form');
    //button to log out 
    const logoutButton = document.getElementById('logout-btn');
    //toggling favorites button
    const favoritesBtn = document.getElementById('favorites-btn');
    //drop down menu for selecting sorts
    const sortSelect = document.getElementById('sort-select');
    const searchBar = document.getElementById('search-bar'); 
    //creates an object for URL query parameters 
    const urlParams = new URLSearchParams(window.location.search);
    //getting user id from those url query params
    const userId = urlParams.get('userId');

    //fetching user details from route
    if (userId && userGreetingSpan) {
        fetch(`http://127.0.0.1:5000/api/users/${userId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                //parse json response
                return response.json();
            })
            //welcome message
            .then(data => {
                userGreetingSpan.textContent = `Welcome, ${data.firstName} ${data.lastName}!`;
            })
            //default welcome message with no user found
            .catch(error => {
                console.error('Failed to fetch user details:', error);
                userGreetingSpan.textContent = 'Welcome, User!';
            });
    
    //contact modal for click adding a contact
    } if (addContactBtn && contactFormModal) {
        //find the element for form modal
        addContactBtn.addEventListener('click', () => {
            //display modal
            contactFormModal.style.display = 'block';
            //reset input 
            contactForm.reset();
            //add contact title
            document.querySelector('#contact-form-modal h2').textContent = 'Add New Contact';
            //remove existing edit ID's
            contactForm.dataset.editId = '';
        });
    }

    //click to close the modal window then hide the modal
    if (closeModalSpan && contactFormModal) {
        closeModalSpan.addEventListener('click', () => {
            contactFormModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === contactFormModal) {
            contactFormModal.style.display = 'none';
        }
    });

    //submitting contact form handling
    if (contactForm) {
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            //checking user is logged in
            if (!userId) {
                alert('User ID not found. Please log in again.');
                return;
            }

            //making references from input by user 
            const firstNameInput = document.getElementById('firstName');
            const lastNameInput = document.getElementById('lastName');
            const nicknameInput = document.getElementById('nickname');
            const phoneNumberInput = document.getElementById('phoneNumber');
            const emailInput = document.getElementById('email');
            const favoriteInput = document.getElementById('favorite');
            const editId = contactForm.dataset.editId;

            //making an object out of input values
            const contactData = {
                userId: userId,
                name: `${firstNameInput.value} ${lastNameInput.value}`,
                nickname: nicknameInput.value,
                phoneNumber: phoneNumberInput.value,
                email: emailInput.value,
                favorite: favoriteInput.checked ? 1 : 0
            };

            //determining whether it is a put or post method and then checking url if editIt exists
            const apiMethod = editId ? 'PUT' : 'POST';
            const apiUrl = editId ? `http://127.0.0.1:5000/api/contacts/${editId}` : 'http://127.0.0.1:5000/api/contacts';

            //send request to the backend API for adding and updating contacts.
            try {
                const response = await fetch(apiUrl, {
                    method: apiMethod,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(contactData)
                });

                //parse json for the backend
                const data = await response.json();

                //if backend response is successful, then execute the requested update or add
                if (response.ok) {
                    //send messages to console to verify the request has been done before clearing the form for the next request.
                    console.log(`Contact ${editId ? 'updated' : 'added'}:`, data);
                    contactFormModal.style.display = 'none';
                    contactForm.reset();
                    document.querySelector('#contact-form-modal h2').textContent = 'Add New Contact';
                    contactForm.dataset.editId = '';
                    fetchAndDisplayContacts(userId, showingFavoritesOnly);
                    alert(`Contact ${editId ? 'updated' : 'added'} successfully!`);
                } else {
                    console.error(`Failed to ${editId ? 'update' : 'add'} contact:`, data);
                    alert(`Failed to ${editId ? 'update' : 'add'} contact: ${data.error || 'Something went wrong.'}`);
                }

            } catch (error) {
                console.error(`Network error while ${editId ? 'updating' : 'adding'} contact:`, error);
                alert(`Network error while ${editId ? 'updating' : 'adding'} contact.`);
            }
        });
    }
//actions of contact list
    if (contactListBody) {
        //click listener and handles clicks in the contact list
        contactListBody.addEventListener('click', async (event) => {
            if (event.target.classList.contains('edit-btn')) {
                //looking for edit-btn class
                const contactIdToEdit = event.target.dataset.contactId;
                //fetches backend details for editing
                if (contactIdToEdit) {
                    try {
                        const response = await fetch(`http://127.0.0.1:5000/api/contacts/${contactIdToEdit}`);
                        if (response.ok) {
                            const contactData = await response.json();
                            //ppopulating references for each value returned
                            document.getElementById('firstName').value = contactData.name.split(' ')[0] || '';
                            document.getElementById('lastName').value = contactData.name.split(' ')[1] || '';
                            document.getElementById('nickname').value = contactData.nickname || '';
                            document.getElementById('phoneNumber').value = contactData.phone_number || '';
                            document.getElementById('email').value = contactData.email || '';
                            document.getElementById('favorite').checked = contactData.favorite === 1;
                            //update modal title and set edit ID
                            document.querySelector('#contact-form-modal h2').textContent = 'Edit Contact';
                            contactFormModal.style.display = 'block';
                            contactForm.dataset.editId = contactIdToEdit;
                        } else {
                            console.error('Failed to fetch contact for editing:', response.status);
                            alert('Failed to fetch contact details for editing.');
                        }
                    } catch (error) {
                        console.error('Error fetching contact for editing:', error);
                        alert('Error fetching contact details for editing.');
                    }
                }
                //send delete request to the backend for deleting contact if delete button is pressed
            } else if (event.target.classList.contains('delete-btn')) {
                const contactIdToDelete = event.target.dataset.contactId;
                if (contactIdToDelete && confirm('Contact will be deleted, are you sure?')) {
                    
                    try {
                        const response = await fetch(`http://127.0.0.1:5000/api/contacts/${contactIdToDelete}`, {
                            method: 'DELETE'
                        });
                        //proceed to delete the contact by removing the whole row from the table
                        if (response.ok) {
                            console.log(`Contact ${contactIdToDelete} has been deleted.`);
                            const rowToRemove = event.target.closest('tr');
                            if (rowToRemove) {
                                rowToRemove.remove();
                            }
                            alert('Contact deleted successfully!');
                        } else if (response.status === 404) {
                            console.error(`Contact ${contactIdToDelete} not found on the server.`);
                            alert('Contact not found.');
                        } else {
                            const errorData = await response.json();
                            console.error(`Failed to delete contact ${contactIdToDelete}:`, errorData);
                            alert(`Failed to delete contact: ${errorData.error || 'Something went wrong.'}`);
                        }
                    } catch (error) {
                        console.error('Network error while deleting contact:', error);
                        alert('Network error while deleting contact.');
                    } finally {
                        fetchAndDisplayContacts(userId, showingFavoritesOnly);
                    }
                }
            }
        });
    }
//loading contacts
    if (userId) {
        fetchAndDisplayContacts(userId, showingFavoritesOnly);
    }
//the logout backend functionality. sends request to backend
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                if (response.ok && data.message === 'You have been logged out') {
                    window.location.href = 'login.html';
                    alert('Logged out successfully.');
                } else {
                    alert(`Logout failed: ${data.error || 'Something went wrong.'}`);
                }
            } catch (error) {
                alert('Network error during logout.');
            }
        });
    }
//filtering favorites tab by only fetching those with the favorites boolean set to true
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', () => {
            showingFavoritesOnly = !showingFavoritesOnly;
            fetchAndDisplayContacts(userId, showingFavoritesOnly);
            favoritesBtn.textContent = showingFavoritesOnly ? 'Show All' : 'Favorites';
        });
    }

    //reorganizing the order of contacts based on sort filter
    if (sortSelect) {
        sortSelect.addEventListener('change', (event) => {
            const sortValue = event.target.value;
            let sortBy = '';
            let order = 'asc';

            if (sortValue) {
                const [field, direction] = sortValue.split('_');
                sortBy = field;
                order = direction;
            }

            //retrieve search terms
            const searchTerm = searchBar ? searchBar.value.trim() : '';
            //return the new contact order
            fetchAndDisplayContacts(userId, showingFavoritesOnly, sortBy, order, searchTerm);
        });
    }

    //defining the search bar to trim the contacts based on value
    if (searchBar) {
        searchBar.addEventListener('input', (event) => {
            const searchTerm = event.target.value.trim();
            const sortSelect = document.getElementById('sort-select');
            const sortValue = sortSelect ? sortSelect.value : '';
            let sortBy = '';
            let order = 'asc';

            if (sortValue) {
                const [field, direction] = sortValue.split('_');
                sortBy = field;
                order = direction;
            }
            //refresh the new list of contacts for search bar
            fetchAndDisplayContacts(userId, showingFavoritesOnly, sortBy, order, searchTerm);
        });
    }
});

//construct the api url with query parameters to filter, sort and search contacts
function fetchAndDisplayContacts(userId, favoriteOnly = false, sortBy = '', order = 'asc', searchTerm = '') {
    let url = `http://127.0.0.1:5000/api/contacts?userId=${userId}`;
    if (favoriteOnly) {
        url += '&favorite=true';
    }
    if (sortBy) {
        url += `&sort=${sortBy}&order=${order}`;
    }
    if (searchTerm) {
        url += `&search=${searchTerm}`;
    }

    //contacts functionality
    if (userId && contactListBody) {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(contacts => {
                contactListBody.innerHTML = ''; //clear existing contact list
                //insert the contact information from the backend into the table by row and cell
                if (contacts.length > 0) {
                    contacts.forEach(contact => {
                        const row = contactListBody.insertRow();
                        const nameCell = row.insertCell();
                        nameCell.textContent = contact.name;
                        //add favorite if applied
                        if (contact.favorite === 1) {
                            nameCell.textContent += ' ⭐';
                        }
                        //add the following information to the table
                        row.insertCell().textContent = contact.nickname || '';
                        row.insertCell().textContent = contact.phone_number || '';
                        row.insertCell().textContent = contact.email || '';
                        //add the action  buttons to the table as well
                        const actionsCell = row.insertCell();
                        const editButton = document.createElement('button');
                        editButton.textContent = 'Edit';
                        editButton.classList.add('edit-btn', 'action-item');
                        editButton.dataset.contactId = contact.contact_id;

                        const deleteButton = document.createElement('button');
                        deleteButton.textContent = 'Delete';
                        deleteButton.classList.add('delete-btn', 'action-item');
                        deleteButton.dataset.contactId = contact.contact_id;

                        actionsCell.appendChild(editButton);
                        actionsCell.appendChild(deleteButton);
                    });
                    //function for empty contacts
                } else {
                    const row = contactListBody.insertRow();
                    const cell = row.insertCell();
                    cell.colSpan = 5;
                    cell.textContent = favoriteOnly ? 'No favorite contacts.' : 'No contacts yet.';
                }
            })
            .catch(error => {
                console.error('Failed to fetch contacts:', error);
                contactListBody.innerHTML = '<tr><td colspan="5">Failed to load contacts.</td></tr>';
            });
    }
}