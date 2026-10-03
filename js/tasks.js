let tasks = [];
let currentFilter = 'All';
let currentSearch = '';
let taskToDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userNameDisplay').textContent = `Welcome, ${currentUser.name}`;

    loadTasks();
    setupEventListeners();
    renderTasks();
});

function loadTasks() {
    const allTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const currentUser = getCurrentUser();
    
    tasks = allTasks.filter(task => task.userId === currentUser.id);
}

function saveTasksToStorage() {
    const allTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const currentUser = getCurrentUser();
    
    const otherUsersTasks = allTasks.filter(task => task.userId !== currentUser.id);
    const updatedAllTasks = [...otherUsersTasks, ...tasks];
    
    localStorage.setItem('tasks', JSON.stringify(updatedAllTasks));
    
    renderTasks();
    updateStatistics();
}

function setupEventListeners() {
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    
    document.getElementById('searchInput').addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        renderTasks();
    });
    
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            currentFilter = e.target.dataset.filter;
            renderTasks();
        });
    });

    document.getElementById('confirmDeleteBtn').addEventListener('click', executeDeleteTask);
}

function handleTaskSubmit(e) {
    e.preventDefault();
    
    const idInput = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDesc').value.trim();
    const dueDate = document.getElementById('taskDueDate').value;
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;
    
    if (idInput) {
        updateTask(parseInt(idInput), title, description, dueDate, priority, status);
        showToast('Task updated successfully', 'success');
    } else {
        createTask(title, description, dueDate, priority, status);
        showToast('Task created successfully', 'success');
    }
    
    closeTaskModal();
}

function createTask(title, description, dueDate, priority, status) {
    const currentUser = getCurrentUser();
    
    const newTask = {
        id: Date.now(),
        userId: currentUser.id,
        title,
        description,
        dueDate,
        priority,
        status,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    saveTasksToStorage();
}

function updateTask(id, title, description, dueDate, priority, status) {
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
        tasks[index] = {
            ...tasks[index],
            title,
            description,
            dueDate,
            priority,
            status,
            updatedAt: new Date().toISOString()
        };
        saveTasksToStorage();
    }
}

function markTaskComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.status = 'Completed';
        saveTasksToStorage();
        showToast('Task marked as completed', 'success');
    }
}

function openTaskModal(taskId = null) {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    const title = document.getElementById('modalTitle');
    
    form.reset();
    
    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            title.textContent = 'Edit Task';
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDesc').value = task.description;
            document.getElementById('taskDueDate').value = task.dueDate;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskStatus').value = task.status;
        }
    } else {
        title.textContent = 'Add New Task';
        document.getElementById('taskId').value = '';
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('taskDueDate').value = today;
    }
    
    modal.classList.add('active');
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
}

function promptDeleteTask(id) {
    taskToDeleteId = id;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    taskToDeleteId = null;
    document.getElementById('deleteModal').classList.remove('active');
}

function executeDeleteTask() {
    if (taskToDeleteId) {
        tasks = tasks.filter(t => t.id !== taskToDeleteId);
        saveTasksToStorage();
        showToast('Task deleted successfully', 'success');
        closeDeleteModal();
    }
}

function updateStatistics() {
    const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'Pending').length,
        progress: tasks.filter(t => t.status === 'In Progress').length,
        completed: tasks.filter(t => t.status === 'Completed').length
    };
    
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-pending').textContent = stats.pending;
    document.getElementById('stat-progress').textContent = stats.progress;
    document.getElementById('stat-completed').textContent = stats.completed;
}

function formatDate(dateString) {
    if (!dateString) return 'No date';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function renderTasks() {
    const container = document.getElementById('tasksContainer');
    
    let filteredTasks = tasks;
    if (currentFilter !== 'All') {
        filteredTasks = tasks.filter(task => task.status === currentFilter);
    }
    
    if (currentSearch) {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(currentSearch) || 
            (task.description && task.description.toLowerCase().includes(currentSearch))
        );
    }
    
    filteredTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    container.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No tasks found</h3>
                <p>Try adjusting your search or filters, or create a new task.</p>
            </div>
        `;
        updateStatistics();
        return;
    }
    
    filteredTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-card priority-${task.priority}`;
        
        const statusClass = task.status.replace(/\s+/g, '');
        
        card.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${task.title}</h3>
            </div>
            <div class="task-desc">${task.description || '<em class="text-muted">No description</em>'}</div>
            <div class="task-meta">
                <span class="badge badge-status-${statusClass}">${task.status}</span>
                <span class="badge" style="background:#f3f4f6">Priority: ${task.priority}</span>
                <span class="badge" style="background:#f3f4f6">📅 ${formatDate(task.dueDate)}</span>
            </div>
            <div class="task-actions">
                ${task.status !== 'Completed' 
                    ? `<button class="btn btn-sm btn-success" onclick="markTaskComplete(${task.id})">✓ Complete</button>` 
                    : ''}
                <button class="btn btn-sm btn-outline" onclick="openTaskModal(${task.id})">✎ Edit</button>
                <button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger)" onclick="promptDeleteTask(${task.id})">🗑 Delete</button>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    updateStatistics();
}
