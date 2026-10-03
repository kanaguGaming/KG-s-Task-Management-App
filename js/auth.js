if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([]));
}

function showToast(message, type = 'default') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

function registerUser(name, email, password) {
    const users = JSON.parse(localStorage.getItem('users'));

    const emailExists = users.some(user => user.email === email);
    if (emailExists) {
        showToast('Email already registered. Please login.', 'error');
        return false;
    }

    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    return true;
}

function loginUser(email, password) {
    const users = JSON.parse(localStorage.getItem('users'));
    
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        const sessionData = {
            id: user.id,
            name: user.name,
            email: user.email
        };
        localStorage.setItem('currentUser', JSON.stringify(sessionData));
        return true;
    } else {
        showToast('Invalid email or password', 'error');
        return false;
    }
}

function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}
