// A more organized, efficient, and modern version of the application script.
const App = {
    // API base URL
    API_BASE_URL: 'http://127.0.0.1:8000',

    // Local storage for data to avoid re-fetching
    state: {
        courses: [],
        faculty: [],
        rooms: [],
        students: [],
        generatedSchedule: []
    },

    // Centralized API request functions
    api: {
        async request(endpoint, method = 'GET', body = null) {
            const options = { method, headers: { 'Content-Type': 'application/json' } };
            if (body) options.body = JSON.stringify(body);
            
            try {
                const response = await fetch(`${App.API_BASE_URL}${endpoint}`, options);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'An API error occurred');
                }
                return response.status === 204 ? null : response.json();
            } catch (error) {
                App.utils.showToast(error.message, 'error');
                console.error(`API Error: ${method} ${endpoint}`, error);
                throw error;
            }
        }
    },

    // Functions to render UI elements
    render: {
        table(collectionName, data) {
            const tableBody = document.querySelector(`#${collectionName}-page .data-table tbody`);
            if (!tableBody) return;
            
            const colspan = tableBody.closest('table').querySelector('thead tr').children.length;

            if (data.length === 0) {
                tableBody.innerHTML = `<tr class="empty-row"><td colspan="${colspan}">No records found. Add one above.</td></tr>`;
                return;
            }

            const rowsHTML = data.map(item => {
                let rowContent = '';
                switch (collectionName) {
                    // THIS IS THE CORRECTED PART FOR COURSES
                    case 'courses':
                        const theory = item.theory_credits || 0;
                        const practical = item.practical_credits || 0;
                        const total = theory + practical;
                        rowContent = `<td>${item.name}</td><td>${theory}</td><td>${practical}</td><td><b>${total}</b></td>`;
                        break;
                    case 'faculty':
                        rowContent = `<td>${item.name}</td><td>${item.expertise || 'N/A'}</td><td>${item.email || 'N/A'}</td>`;
                        break;
                    case 'rooms':
                        rowContent = `<td>${item.name}</td><td>${item.capacity}</td><td>${item.type || 'N/A'}</td>`;
                        break;
                    case 'students':
                        rowContent = `<td>${item.name}</td><td>${item.size}</td>`;
                        break;
                }
                const actions = `<td><button class="btn-delete" data-id="${item.id}"><i class="fa-solid fa-trash-can"></i></button></td>`;
                return `<tr data-id="${item.id}">${rowContent}${actions}</tr>`;
            }).join('');
            
            tableBody.innerHTML = rowsHTML;
        },
        timetable(schedule) {
            const outputContainer = document.getElementById('timetable-output');
            if (!outputContainer) return;

            if (schedule.error) {
                outputContainer.innerHTML = `<p style="color: var(--danger-color); text-align: center;"><b>Error:</b> ${schedule.error}</p>`;
                outputContainer.style.display = 'block';
                return;
            }

            const findNameById = (list, id) => list.find(d => d.id === id)?.name || `ID ${id}`;

            let tableHTML = `<h2>Generated Timetable</h2><table class="data-table"><thead><tr><th>Course</th><th>Teacher</th><th>Room</th><th>Time Slot</th></tr></thead><tbody>`;
            schedule.forEach(entry => {
                const courseName = findNameById(App.state.courses, entry.course_id);
                const teacherName = findNameById(App.state.faculty, entry.teacher_id);
                const roomName = findNameById(App.state.rooms, entry.room_id);
                tableHTML += `<tr><td>${courseName}</td><td>${teacherName}</td><td>${roomName}</td><td>${entry.time_slot_id}</td></tr>`;
            });
            tableHTML += `</tbody></table>`;
            
            outputContainer.innerHTML = tableHTML;
            outputContainer.style.display = 'block';
        }
    },

    // Functions to set up all event listeners
    listeners: {
        init() {
            App.listeners.sidebar();
            App.listeners.forms();
            App.listeners.deleteButtons();
            App.listeners.generateTimetable();
            App.listeners.csvUpload();
            App.listeners.themeToggle();
            App.listeners.mobileNav();
            App.listeners.addToggles();
            App.listeners.fileUploadVisuals();
        },
        sidebar() {
            const sidebarLinks = document.querySelectorAll('.sidebar-link');
            const pages = document.querySelectorAll('.page');
            const pageTitle = document.getElementById('page-title');

            sidebarLinks.forEach(link => {
                link.addEventListener('click', e => {
                    e.preventDefault();
                    sidebarLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    const targetPageId = link.dataset.page + '-page';
                    pages.forEach(p => p.classList.remove('active'));
                    const targetPage = document.getElementById(targetPageId);
                    if (targetPage) targetPage.classList.add('active');
                    pageTitle.textContent = link.querySelector('span').textContent;
                });
            });
        },
        forms() {
            document.querySelectorAll('.input-form').forEach(form => {
                form.addEventListener('submit', async e => {
                    e.preventDefault();
                    const collectionName = form.closest('.page').dataset.collection;
                    const endpoint = `/${collectionName}/`;
                    
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());

                    // UPDATED THIS to handle new credit fields
                    ['theory_credits', 'practical_credits', 'capacity', 'size'].forEach(key => {
                        if (data[key]) data[key] = parseInt(data[key], 10);
                    });

                    try {
                        await App.api.request(endpoint, 'POST', data);
                        App.utils.showToast(`${collectionName.charAt(0).toUpperCase() + collectionName.slice(1, -1)} added!`, 'success');
                        form.reset();
                        App.initDataFor(collectionName);
                    } catch (error) {}
                });
            });
        },
        deleteButtons() {
            document.querySelector('.main-content').addEventListener('click', async e => {
                const deleteButton = e.target.closest('.btn-delete');
                if (!deleteButton) return;
                
                e.preventDefault();
                const id = deleteButton.closest('tr').dataset.id;
                const collectionName = deleteButton.closest('.page').dataset.collection;
                const endpoint = `/${collectionName}/${id}`;

                if (confirm('Are you sure you want to delete this item?')) {
                    try {
                        await App.api.request(endpoint, 'DELETE');
                        App.utils.showToast('Item deleted.', 'success');
                        App.initDataFor(collectionName);
                    } catch (error) {}
                }
            });
        },
        generateTimetable() {
            const generateBtn = document.getElementById('generate-btn');
            if (!generateBtn) return;
            generateBtn.addEventListener('click', async () => {
                App.utils.showToast('Generating timetable...', 'success');
                generateBtn.disabled = true;
                generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
                try {
                    await App.initData();
                    const schedule = await App.api.request('/generate-timetable', 'POST');
                    App.state.generatedSchedule = schedule;
                    App.render.timetable(schedule);
                    App.utils.showToast('Timetable generated!', 'success');
                } catch (error) {
                    App.utils.showToast('Failed to generate timetable.', 'error');
                } finally {
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = '✨ Generate Master Timetable';
                }
            });
        },
        csvUpload() {
            const analyzeBtn = document.getElementById('btn-analyze');
            if (!analyzeBtn) return;
            analyzeBtn.addEventListener('click', async e => {
                e.preventDefault();
                const fileInput = document.getElementById('file-upload');
                if (fileInput.files.length === 0) {
                    App.utils.showToast('Please select a CSV file.', 'error');
                    return;
                }
                const formData = new FormData();
                formData.append('file', fileInput.files[0]);
                
                analyzeBtn.disabled = true;
                analyzeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
                
                try {
                    const response = await fetch(`${App.API_BASE_URL}/upload-data/`, { method: 'POST', body: formData });
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.detail || 'File upload failed');
                    }
                    const data = await response.json();
                    App.utils.showToast(data.message, 'success');
                    App.initData();
                } catch(error) {
                    App.utils.showToast(error.message, 'error');
                } finally {
                    analyzeBtn.disabled = false;
                    analyzeBtn.innerHTML = 'Upload & Process File';
                }
            });
        },
        addToggles() {
            document.querySelectorAll('.btn-show-form').forEach(button => {
                button.addEventListener('click', () => {
                    const formContainer = button.closest('.page-header').nextElementSibling;
                    if (formContainer?.classList.contains('add-form-container')) {
                        const isVisible = formContainer.style.display === 'block';
                        formContainer.style.display = isVisible ? 'none' : 'block';
                        button.textContent = isVisible ? `+ Add New` : '− Cancel';
                    }
                });
            });
        },
        themeToggle() {
            const themeToggle = document.getElementById('checkbox');
            if (!themeToggle) return;
            const currentTheme = localStorage.getItem('theme') || 'light';
            document.documentElement.setAttribute('data-theme', currentTheme);
            themeToggle.checked = currentTheme === 'dark';
            themeToggle.addEventListener('change', () => {
                const theme = themeToggle.checked ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', theme);
                localStorage.setItem('theme', theme);
            });
        },
        mobileNav() {
            const mobileToggle = document.querySelector('.mobile-nav-toggle');
            if (mobileToggle) {
                mobileToggle.addEventListener('click', () => {
                    document.body.classList.toggle('sidebar-open');
                });
            }
        },
        fileUploadVisuals() {
            const fileInput = document.getElementById('file-upload');
            if (!fileInput) return;
            const fileInfoDisplay = document.getElementById('file-info');
            const fileNameDisplay = document.getElementById('file-name-display');

            fileInput.addEventListener('change', () => {
                if (fileInput.files.length > 0) {
                    if (fileNameDisplay) fileNameDisplay.textContent = `Selected: ${fileInput.files[0].name}`;
                    if (fileInfoDisplay) fileInfoDisplay.style.display = 'flex';
                }
            });
        },
    },

    // Utility functions
    utils: {
        showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            if (!container) return;
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            container.appendChild(toast);
            setTimeout(() => { toast.remove(); }, 3000);
        }
    },

    // Main initialization function
    async init() {
        App.listeners.init();
        await App.initData();
    },

    // Function to fetch all initial data
    async initData() {
        await Promise.all([
            App.initDataFor('courses'),
            App.initDataFor('faculty'),
            App.initDataFor('rooms'),
            App.initDataFor('students'),
        ]);
    },
    
    // Function to fetch and render data for a single collection
    async initDataFor(collectionName) {
        try {
            const data = await App.api.request(`/${collectionName}/`);
            App.state[collectionName] = data;
            App.render.table(collectionName, data);
        } catch (error) {
            console.error(`Could not initialize data for ${collectionName}.`);
        }
    }
};

// Start the application once the DOM is loaded
document.addEventListener('DOMContentLoaded', App.init);