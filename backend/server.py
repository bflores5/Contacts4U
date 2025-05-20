from flask import Flask, request, jsonify
from flask_cors import CORS
#db
import sqlite3
from datetime import datetime
#password hashing
import bcrypt 

app = Flask(__name__)
CORS(app)

DATABASE = 'contacts4U.db'
#conntect to db
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def close_db(conn):
    if conn:
        conn.close()

#route routing to gather all info about the contacts
@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    user_id = request.args.get('userId')
    favorite = request.args.get('favorite')
    sort_by = request.args.get('sort')
    order = request.args.get('order', 'asc')
    search_term = request.args.get('search')

    if not user_id:
        return jsonify({'error': 'Missing userId'}), 400

#query the db to display its contents in the contacts table
    conn = get_db()
    cursor = conn.cursor()
    query = "SELECT contact_id, name, nickname, phone_number, email, favorite, created_at, updated_at FROM contacts WHERE user_id = ?"
    params = [user_id]

#toggling favorites to display
    if favorite == 'true':
        query += " AND favorite = 1"

#query the database when using the searchbar
    if search_term:
        search_term = f"%{search_term.lower()}%"
        query += " AND (lower(name) LIKE ? OR lower(nickname) LIKE ? OR lower(email) LIKE ? OR phone_number LIKE ?)"
        params.extend([search_term] * 4)

#changing the order of the table UI display by using the sort drop downs
    if sort_by:
        if sort_by in ['name', 'nickname', 'phone_number', 'email', 'created_at', 'updated_at', 'favorite']:
            query += f" ORDER BY {sort_by}"
            if order.lower() == 'desc':
                query += " DESC"
            else:
                query += " ASC"
        else:
            close_db(conn)
            return jsonify({'error': 'Invalid sort parameter'}), 400

#fetches all quries it had requested and returns the contents then closes the db after its done
    cursor.execute(query, params)
    contacts = [dict(row) for row in cursor.fetchall()]
    close_db(conn)
    return jsonify(contacts)

#a route that will help create a new contact and add it to the json based on the user id that is making the contact and will
#gather all the data from the inputs in the sub form fields.
@app.route('/api/contacts', methods=['POST'])
def add_contact():
    data = request.get_json()
    user_id = data.get('userId')
    name = data.get('name')
    nickname = data.get('nickname')
    phone_number = data.get('phoneNumber')
    email = data.get('email')
    favorite = data.get('favorite', 0)
    if not all([user_id, name]):
        return jsonify({'error': 'Required fields are missing (userId, name)'}), 400

    conn = get_db()
    cursor = conn.cursor()

#the execution method to try to store the input into the database and then return the status of the execution.
    try:
        cursor.execute("""
            INSERT INTO contacts (user_id, name, nickname, phone_number, email, favorite)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, name, nickname, phone_number, email, favorite))
        conn.commit()
        contact_id = cursor.lastrowid
        close_db(conn)
        return jsonify({'message': 'Contact has been made successfully', 'contactId': contact_id}), 201
    except sqlite3.Error as e:
        close_db(conn)
        return jsonify({'error': f'Database error: {str(e)}'}), 500

#gather the contact information based on contact_id
@app.route('/api/contacts/<int:contact_id>', methods=['GET'])
def get_contact(contact_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT contact_id, name, nickname, phone_number, email, favorite FROM contacts WHERE contact_id = ?", (contact_id,))
    contact = cursor.fetchone()
    close_db(conn)
    if contact:
        return jsonify(dict(contact)), 200
    else:
        return jsonify({'error': 'Contact not found'}), 404

#rewriting a current contact babsed on that contact_id and storing new data into the json from the previous data
@app.route('/api/contacts/<int:contact_id>', methods=['PUT'])
def update_contact(contact_id):
    data = request.get_json()
    name = data.get('name')
    nickname = data.get('nickname')
    phone_number = data.get('phoneNumber')
    email = data.get('email')
    favorite = data.get('favorite')

    conn = get_db()
    cursor = conn.cursor()

#rewrite the new updates if the old data does not match the data, also if something is typed in the input field.
    updates = {}
    if name is not None:
        updates['name'] = name
    if nickname is not None:
        updates['nickname'] = nickname
    if phone_number is not None:
        updates['phone_number'] = phone_number
    if email is not None:
        updates['email'] = email
    if favorite is not None:
        updates['favorite'] = favorite

    if not updates:
        close_db(conn)
        return jsonify({'error': 'There are no fields to update'}), 400

    set_clause = ', '.join(f"{key} = ?" for key in updates)
    values = list(updates.values())
    values.append(contact_id)

#check if the contact does exist before updating
    try:
        cursor.execute(f"UPDATE contacts SET {set_clause} WHERE contact_id = ?", values)
        conn.commit()
        if cursor.rowcount > 0:
            close_db(conn)
            return jsonify({'message': f'Contact {contact_id} contact has been updated'}), 200
        else:
            close_db(conn)
            return jsonify({'error': f'Contact {contact_id} contact was not found'}), 404
    except sqlite3.Error as e:
        close_db(conn)
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    
#go to the database and remove a contact row from the table 
@app.route('/api/contacts/<int:contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    conn = get_db()
    cursor = conn.cursor()
#check if the contact exists by its id and then remove it
    try:
        cursor.execute("DELETE FROM contacts WHERE contact_id = ?", (contact_id,))
        conn.commit()
        if cursor.rowcount > 0:
            close_db(conn)
            return jsonify({'message': f'Contact {contact_id} is now deleted '}), 200
        else:
            close_db(conn)
            return jsonify({'error': f'Contact {contact_id} was not found'}), 404
    except sqlite3.Error as e:
        close_db(conn)
        return jsonify({'error': f'Database error: {str(e)}'}), 500

#gather the information of the user's name this could be for displaying the user info on the index page when logged in
@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user_details(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT first_name, last_name FROM users WHERE user_id = ?", (user_id,))
    user = cursor.fetchone()
    close_db(conn)
    if user:
        return jsonify({'firstName': user['first_name'], 'lastName': user['last_name']}), 200
    else:
        return jsonify({'error': 'User is not found'}), 404

#route to input a login credential that has been created after registration and then try to authenticate by checking the users table
@app.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 204
    elif request.method == 'POST':
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, password FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        close_db(conn)
#checks to see if the hashed password is correct before logging in
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'message': 'Login successful', 'userId': user['user_id']}), 200
        else:
            return jsonify({'error': 'Sorry, Invalid credentials. Try again'}), 401

#route to register a new user by getting input field and storing input information into json format and inserting it into the users table in the db.
@app.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 204
    elif request.method == 'POST':
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        firstName = data.get('firstName')
        lastName = data.get('lastName')

#Checks to see if all input fields were filled.
        if not all([email, password, firstName, lastName]):
            return jsonify({'error': 'Required fields are missing'}), 400

        conn = get_db()
        cursor = conn.cursor()
#checks to see if the credientials are already stored into the database/
        cursor.execute("SELECT user_id FROM users WHERE email = ?", (email,))
        existing_user = cursor.fetchone()
        if existing_user:
            close_db(conn)
            return jsonify({'error': 'Email has already been registered. Please sign in.'}), 409

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
#store the input into the database accordingly.
        try:
            cursor.execute("INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)",
                           (email, hashed_password, firstName, lastName))
            conn.commit()
            user_id = cursor.lastrowid
            close_db(conn)
            return jsonify({'message': 'User has been created! Registration Complete.', 'userId': user_id}), 201
        except sqlite3.Error as e:
            conn.rollback()
            close_db(conn)
            return jsonify({'error': f'Database error: {str(e)}'}), 500

#route for logging out, it will close a mock session if there was one implemented.
@app.route('/logout', methods=['POST', 'OPTIONS'])
def logout():
    if request.method == 'OPTIONS':
        return '', 204
    elif request.method == 'POST':
        print("Running /logout POST")
        return jsonify({'message': 'You have been logged out.'}), 200

if __name__ == '__main__':
    app.run(debug=True)