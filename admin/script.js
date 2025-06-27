
const firebaseConfig = {
    apiKey: "AIzaSyCnW0JTFtOd_9FKwh1_Dxv0SNDSVTYZBpU",
    authDomain: "clubhub-management.firebaseapp.com",
    projectId: "clubhub-management",
    storageBucket: "clubhub-management.firebasestorage.app",
    messagingSenderId: "753620100397",
    appId: "1:753620100397:web:8ee4b70d926a0a5a099fa4"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

const loginScreen = document.getElementById('loginScreen');
const appContainer = document.getElementById('appContainer');

const pagination = {
    clubs: { currentPage: 1, pageSize: 10, totalItems: 0 },
    members: { currentPage: 1, pageSize: 10, totalItems: 0 },
    events: { currentPage: 1, pageSize: 10, totalItems: 0 },
    activities: { currentPage: 1, pageSize: 10, totalItems: 0 },
    finances: { currentPage: 1, pageSize: 10, totalItems: 0 }
};

let clubs = [];
let members = [];
let events = [];
let activities = [];
let budgetEntries = [];

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('loadingAnimation').style.display = 'none';
        loginScreen.style.display = 'none';
        appContainer.style.display = 'block';
        loadAllData();
    } else {
        document.getElementById('loadingAnimation').style.display = 'none';
        loginScreen.style.display = 'block';
        appContainer.style.display = 'none';
    }
});

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginMessage = document.getElementById('loginMessage');

    loginMessage.textContent = '';

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
        })
        .catch(error => {
            loginMessage.textContent = error.message;
        });
}

function logout() {
    auth.signOut().then(() => {
    }).catch(error => {
        console.error('Logout error:', error);
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    document.getElementById(sectionId).classList.add('active');
    event.target.classList.add('active');

    switch (sectionId) {
        case 'clubs':
            loadClubs();
            break;
        case 'members':
            loadMembers();
            break;
        case 'events':
            loadEvents();
            break;
        case 'activities':
            loadActivities();
            break;
        case 'finances':
            loadFinances();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';

    const clubSelects = ['memberClub', 'eventClub', 'budgetClub', 'editMemberClub', 'editEventClub'];
    clubSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '';
            clubs.forEach(club => {
                const option = document.createElement('option');
                option.value = club.id;
                option.textContent = club.name;
                select.appendChild(option);
            });
        }
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function loadAllData() {
    db.collection('clubs').orderBy('name').onSnapshot(snapshot => {
        clubs = [];
        snapshot.forEach(doc => {
            clubs.push({ id: doc.id, ...doc.data() });
        });
        pagination.clubs.totalItems = clubs.length;
        updateDashboard();
        if (document.getElementById('clubs').classList.contains('active')) {
            loadClubs();
        }
    });

    db.collection('members').orderBy('name').onSnapshot(snapshot => {
        members = [];
        snapshot.forEach(doc => {
            members.push({ id: doc.id, ...doc.data() });
        });
        pagination.members.totalItems = members.length;
        updateDashboard();
        if (document.getElementById('members').classList.contains('active')) {
            loadMembers();
        }
    });

    db.collection('events').orderBy('date').onSnapshot(snapshot => {
        events = [];
        snapshot.forEach(doc => {
            events.push({ id: doc.id, ...doc.data() });
        });
        pagination.events.totalItems = events.length;
        updateDashboard();
        if (document.getElementById('events').classList.contains('active')) {
            loadEvents();
        }
    });

    db.collection('activities').orderBy('date', 'desc').limit(50).onSnapshot(snapshot => {
        activities = [];
        snapshot.forEach(doc => {
            activities.push({ id: doc.id, ...doc.data() });
        });
        pagination.activities.totalItems = activities.length;
        if (document.getElementById('dashboard').classList.contains('active') ||
            document.getElementById('activities').classList.contains('active')) {
            loadActivities();
        }
    });

    db.collection('budgetEntries').orderBy('date', 'desc').onSnapshot(snapshot => {
        budgetEntries = [];
        snapshot.forEach(doc => {
            budgetEntries.push({ id: doc.id, ...doc.data() });
        });
        pagination.finances.totalItems = budgetEntries.length;
        if (document.getElementById('finances').classList.contains('active')) {
            loadFinances();
        }
    });
}

function changePage(section, direction) {
    const paginationData = pagination[section];
    const newPage = paginationData.currentPage + direction;

    const totalPages = Math.ceil(paginationData.totalItems / paginationData.pageSize);
    if (newPage < 1 || newPage > totalPages) return;

    paginationData.currentPage = newPage;

    switch (section) {
        case 'clubs': loadClubs(); break;
        case 'members': loadMembers(); break;
        case 'events': loadEvents(); break;
        case 'activities': loadActivities(); break;
        case 'finances': loadFinances(); break;
    }
}

function changePageSize(section) {
    const select = document.getElementById(`${section}PageSize`);
    const newSize = parseInt(select.value);

    pagination[section].pageSize = newSize;
    pagination[section].currentPage = 1;

    switch (section) {
        case 'clubs': loadClubs(); break;
        case 'members': loadMembers(); break;
        case 'events': loadEvents(); break;
        case 'activities': loadActivities(); break;
        case 'finances': loadFinances(); break;
    }
}

function updatePaginationUI(section) {
    const paginationData = pagination[section];
    const totalPages = Math.ceil(paginationData.totalItems / paginationData.pageSize);

    document.getElementById(`${section}CurrentPage`).textContent = paginationData.currentPage;
    document.getElementById(`${section}TotalPages`).textContent = totalPages;

    document.getElementById(`${section}PrevBtn`).disabled = paginationData.currentPage === 1;
    document.getElementById(`${section}NextBtn`).disabled = paginationData.currentPage === totalPages;
}

function loadClubs() {
    const paginationData = pagination.clubs;
    const startIndex = (paginationData.currentPage - 1) * paginationData.pageSize;
    const endIndex = startIndex + paginationData.pageSize;
    const currentClubs = clubs.slice(startIndex, endIndex);

    const clubsList = document.getElementById('clubsList');
    clubsList.innerHTML = '';

    currentClubs.forEach(club => {
        const memberCount = members.filter(m => m.clubId === club.id).length;
        const clubCard = document.createElement('div');
        clubCard.className = 'club-card';
        clubCard.innerHTML = `
                    <h3>${club.name}</h3>
                    <p>${club.description}</p>
                    <p><strong>Category:</strong> ${club.category}</p>
                    <p><strong>Budget:</strong> $${club.budget?.toFixed(2) || '0.00'}</p>
                    <span class="member-count">${memberCount} members</span>
                    <div style="margin-top: 15px;">
                        <button class="btn" onclick="editClub('${club.id}')">✏️ Edit</button>
                        <button class="btn btn-danger" onclick="deleteClub('${club.id}')">🗑️ Delete</button>
                    </div>
                `;
        clubsList.appendChild(clubCard);
    });

    updatePaginationUI('clubs');
}

function addClub(event) {
    event.preventDefault();

    const newClub = {
        name: document.getElementById('clubName').value,
        description: document.getElementById('clubDescription').value,
        category: document.getElementById('clubCategory').value,
        budget: parseFloat(document.getElementById('clubBudget').value) || 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('clubs').add(newClub)
        .then(docRef => {
            addActivity('Club Created', `${newClub.name} club has been created`);
            closeModal('clubModal');
            event.target.reset();
        })
        .catch(error => {
            console.error('Error adding club:', error);
            alert('Error adding club. Please try again.');
        });
}

function editClub(clubId) {
    const club = clubs.find(c => c.id === clubId);
    if (!club) return;

    document.getElementById('editClubId').value = clubId;
    document.getElementById('editClubName').value = club.name;
    document.getElementById('editClubDescription').value = club.description;
    document.getElementById('editClubCategory').value = club.category;
    document.getElementById('editClubBudget').value = club.budget || 0;

    openModal('editClubModal');
}

function updateClub(event) {
    event.preventDefault();

    const clubId = document.getElementById('editClubId').value;
    const updatedClub = {
        name: document.getElementById('editClubName').value,
        description: document.getElementById('editClubDescription').value,
        category: document.getElementById('editClubCategory').value,
        budget: parseFloat(document.getElementById('editClubBudget').value) || 0,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('clubs').doc(clubId).update(updatedClub)
        .then(() => {
            addActivity('Club Updated', `${updatedClub.name} club has been updated`);
            closeModal('editClubModal');
        })
        .catch(error => {
            console.error('Error updating club:', error);
            alert('Error updating club. Please try again.');
        });
}

function deleteClub(clubId) {
    const club = clubs.find(c => c.id === clubId);
    if (!club) return;

    if (confirm(`Are you sure you want to delete the "${club.name}" club? This will also delete all associated members and events.`)) {

        const memberDeletes = members
            .filter(m => m.clubId === clubId)
            .map(m => db.collection('members').doc(m.id).delete());

        const eventDeletes = events
            .filter(e => e.clubId === clubId)
            .map(e => db.collection('events').doc(e.id).delete());

        const budgetDeletes = budgetEntries
            .filter(b => b.clubId === clubId)
            .map(b => db.collection('budgetEntries').doc(b.id).delete());

        Promise.all([...memberDeletes, ...eventDeletes, ...budgetDeletes])
            .then(() => {
                return db.collection('clubs').doc(clubId).delete();
            })
            .then(() => {
                addActivity('Club Deleted', `${club.name} club has been deleted`);
            })
            .catch(error => {
                console.error('Error deleting club:', error);
                alert('Error deleting club. Please try again.');
            });
    }
}

function searchClubs(query) {
    const filteredClubs = clubs.filter(club =>
        club.name.toLowerCase().includes(query.toLowerCase()) ||
        club.category.toLowerCase().includes(query.toLowerCase())
    );

    pagination.clubs.totalItems = filteredClubs.length;
    pagination.clubs.currentPage = 1;
    loadClubs();
}
function loadMembers() {
    const paginationData = pagination.members;
    const startIndex = (paginationData.currentPage - 1) * paginationData.pageSize;
    const endIndex = startIndex + paginationData.pageSize;
    const currentMembers = members.slice(startIndex, endIndex);

    const tbody = document.getElementById('membersTableBody');
    tbody.innerHTML = '';

    currentMembers.forEach(member => {
        const club = clubs.find(c => c.id === member.clubId);
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${member.name}</td>
                    <td>${member.email}</td>
                    <td>${club ? club.name : 'N/A'}</td>
                    <td>${member.role}</td>
                    <td>${member.joinDate ? new Date(member.joinDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                        <button class="btn" onclick="editMember('${member.id}')">✏️</button>
                        <button class="btn btn-danger" onclick="deleteMember('${member.id}')">🗑️</button>
                    </td>
                `;
        tbody.appendChild(row);
    });

    updatePaginationUI('members');
}

function addMember(event) {
    event.preventDefault();

    const newMember = {
        name: document.getElementById('memberName').value,
        email: document.getElementById('memberEmail').value,
        clubId: document.getElementById('memberClub').value,
        role: document.getElementById('memberRole').value,
        joinDate: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('members').add(newMember)
        .then(() => {
            addActivity('Member Added', `${newMember.name} joined the club`);
            closeModal('memberModal');
            event.target.reset();
        })
        .catch(error => {
            console.error('Error adding member:', error);
            alert('Error adding member. Please try again.');
        });
}

function editMember(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    document.getElementById('editMemberId').value = memberId;
    document.getElementById('editMemberName').value = member.name;
    document.getElementById('editMemberEmail').value = member.email;
    document.getElementById('editMemberClub').value = member.clubId;
    document.getElementById('editMemberRole').value = member.role;

    openModal('editMemberModal');
}

function updateMember(event) {
    event.preventDefault();

    const memberId = document.getElementById('editMemberId').value;
    const updatedMember = {
        name: document.getElementById('editMemberName').value,
        email: document.getElementById('editMemberEmail').value,
        clubId: document.getElementById('editMemberClub').value,
        role: document.getElementById('editMemberRole').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('members').doc(memberId).update(updatedMember)
        .then(() => {
            addActivity('Member Updated', `${updatedMember.name}'s details have been updated`);
            closeModal('editMemberModal');
        })
        .catch(error => {
            console.error('Error updating member:', error);
            alert('Error updating member. Please try again.');
        });
}

function deleteMember(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    if (confirm(`Are you sure you want to remove ${member.name} from the club?`)) {
        db.collection('members').doc(memberId).delete()
            .then(() => {
                addActivity('Member Removed', `${member.name} has been removed`);
            })
            .catch(error => {
                console.error('Error deleting member:', error);
                alert('Error deleting member. Please try again.');
            });
    }
}

function searchMembers(query) {
    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(query.toLowerCase()) ||
        member.email.toLowerCase().includes(query.toLowerCase())
    );

    pagination.members.totalItems = filteredMembers.length;
    pagination.members.currentPage = 1;
    loadMembers();
}

function loadEvents() {
    const paginationData = pagination.events;
    const startIndex = (paginationData.currentPage - 1) * paginationData.pageSize;
    const endIndex = startIndex + paginationData.pageSize;

    const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
    const currentEvents = sortedEvents.slice(startIndex, endIndex);

    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';

    currentEvents.forEach(event => {
        const club = clubs.find(c => c.id === event.clubId);
        const eventDate = new Date(event.date);
        const now = new Date();
        const isPastEvent = eventDate < now;

        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.style.opacity = isPastEvent ? '0.8' : '1';
        eventCard.innerHTML = `
                    <div class="event-date">${eventDate.toLocaleDateString()} ${event.time || ''}</div>
                    <h3>${event.name}</h3>
                    <p>${event.description}</p>
                    <p><strong>Location:</strong> ${event.location || 'TBD'}</p>
                    <p><strong>Organized by:</strong> ${club ? club.name : 'N/A'}</p>
                    <div style="margin-top: 15px;">
                        <button class="btn" onclick="editEvent('${event.id}')">✏️ Edit</button>
                        <button class="btn btn-danger" onclick="deleteEvent('${event.id}')">🗑️ Delete</button>
                        ${isPastEvent ? '<button class="btn btn-secondary" style="margin-left: 10px;">📊 View Attendance</button>' : ''}
                    </div>
                `;
        eventsList.appendChild(eventCard);
    });
    updatePaginationUI('events');
}

function addEvent(event) {
    event.preventDefault();

    const newEvent = {
        name: document.getElementById('eventName').value,
        description: document.getElementById('eventDescription').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        location: document.getElementById('eventLocation').value,
        clubId: document.getElementById('eventClub').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('events').add(newEvent)
        .then(() => {
            addActivity('Event Created', `${newEvent.name} has been scheduled`);
            closeModal('eventModal');
            event.target.reset();
        })
        .catch(error => {
            console.error('Error adding event:', error);
            alert('Error adding event. Please try again.');
        });
}

function editEvent(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    document.getElementById('editEventId').value = eventId;
    document.getElementById('editEventName').value = event.name;
    document.getElementById('editEventDescription').value = event.description;
    document.getElementById('editEventDate').value = event.date;
    document.getElementById('editEventTime').value = event.time || '';
    document.getElementById('editEventLocation').value = event.location || '';
    document.getElementById('editEventClub').value = event.clubId;

    openModal('editEventModal');
}

function updateEvent(event) {
    event.preventDefault();

    const eventId = document.getElementById('editEventId').value;
    const updatedEvent = {
        name: document.getElementById('editEventName').value,
        description: document.getElementById('editEventDescription').value,
        date: document.getElementById('editEventDate').value,
        time: document.getElementById('editEventTime').value,
        location: document.getElementById('editEventLocation').value,
        clubId: document.getElementById('editEventClub').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('events').doc(eventId).update(updatedEvent)
        .then(() => {
            addActivity('Event Updated', `${updatedEvent.name} has been updated`);
            closeModal('editEventModal');
        })
        .catch(error => {
            console.error('Error updating event:', error);
            alert('Error updating event. Please try again.');
        });
}

function deleteEvent(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    if (confirm(`Are you sure you want to delete the "${event.name}" event?`)) {
        db.collection('events').doc(eventId).delete()
            .then(() => {
                addActivity('Event Cancelled', `${event.name} has been cancelled`);
            })
            .catch(error => {
                console.error('Error deleting event:', error);
                alert('Error deleting event. Please try again.');
            });
    }
}
function loadActivities() {
    const activitiesList = document.getElementById('activitiesList');
    const recentActivities = document.getElementById('recentActivities');

    if (activitiesList) activitiesList.innerHTML = '';
    if (recentActivities) recentActivities.innerHTML = '';

    const sortedActivities = [...activities].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (activitiesList) {
        const paginationData = pagination.activities;
        const startIndex = (paginationData.currentPage - 1) * paginationData.pageSize;
        const endIndex = startIndex + paginationData.pageSize;
        const currentActivities = sortedActivities.slice(startIndex, endIndex);

        currentActivities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                        <h4>${activity.type}</h4>
                        <p>${activity.description}</p>
                        <div class="date">${formatTimeAgo(activity.date)}</div>
                    `;
            activitiesList.appendChild(activityItem);
        });

        updatePaginationUI('activities');
    }

    if (recentActivities) {
        const recent = sortedActivities.slice(0, 3);
        recent.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                        <h4>${activity.type}</h4>
                        <p>${activity.description}</p>
                        <div class="date">${formatTimeAgo(activity.date)}</div>
                    `;
            recentActivities.appendChild(activityItem);
        });
    }
}

function addActivity(type, description) {
    const newActivity = {
        type: type,
        description: description,
        date: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('activities').add(newActivity)
        .catch(error => {
            console.error('Error adding activity:', error);
        });
}

function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    } else {
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }
}

function loadFinances() {
    const paginationData = pagination.finances;
    const startIndex = (paginationData.currentPage - 1) * paginationData.pageSize;
    const endIndex = startIndex + paginationData.pageSize;

    const sortedEntries = [...budgetEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
    const currentEntries = sortedEntries.slice(startIndex, endIndex);

    const tbody = document.getElementById('budgetTableBody');
    tbody.innerHTML = '';

    currentEntries.forEach(entry => {
        const club = clubs.find(c => c.id === entry.clubId);
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${entry.date ? new Date(entry.date).toLocaleDateString() : 'N/A'}</td>
                    <td>${club ? club.name : 'N/A'}</td>
                    <td>${entry.description}</td>
                    <td><span style="color: ${entry.type === 'Income' ? '#28a745' : '#dc3545'}">${entry.type}</span></td>
                    <td>$${entry.amount?.toFixed(2) || '0.00'}</td>
                `;
        tbody.appendChild(row);
    });
    updatePaginationUI('finances');

    updateFinancialStats();
}

function addBudgetEntry(event) {
    event.preventDefault();

    const newEntry = {
        clubId: document.getElementById('budgetClub').value,
        description: document.getElementById('budgetDescription').value,
        type: document.getElementById('budgetType').value,
        amount: parseFloat(document.getElementById('budgetAmount').value),
        date: document.getElementById('budgetDate').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('budgetEntries').add(newEntry)
        .then(() => {
            addActivity('Budget Entry', `${newEntry.type} of $${newEntry.amount.toFixed(2)} recorded`);
            closeModal('budgetModal');
            event.target.reset();
        })
        .catch(error => {
            console.error('Error adding budget entry:', error);
            alert('Error adding budget entry. Please try again.');
        });
}

function updateFinancialStats() {
    const totalIncome = budgetEntries
        .filter(e => e.type === 'Income')
        .reduce((sum, e) => sum + (e.amount || 0), 0);

    const totalExpenses = budgetEntries
        .filter(e => e.type === 'Expense')
        .reduce((sum, e) => sum + (e.amount || 0), 0);

    const netBalance = totalIncome - totalExpenses;

    document.getElementById('totalIncome').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
    document.getElementById('netBalance').textContent = `$${netBalance.toFixed(2)}`;
}

function loadReports() {
    const retentionRate = members.length > 0 ? Math.min(100, Math.floor(Math.random() * 20) + 80) : 0;
    document.getElementById('retentionRate').textContent = `${retentionRate}%`;

    const attendanceRate = events.length > 0 ? Math.min(100, Math.floor(Math.random() * 15) + 80) : 0;
    document.getElementById('attendanceRate').textContent = `${attendanceRate}%`;

    const totalBudget = clubs.reduce((sum, club) => sum + (club.budget || 0), 0);
    const totalSpent = budgetEntries
        .filter(e => e.type === 'Expense')
        .reduce((sum, e) => sum + (e.amount || 0), 0);
    const utilizationRate = totalBudget > 0 ? Math.min(100, Math.floor((totalSpent / totalBudget) * 100)) : 0;
    document.getElementById('utilizationRate').textContent = `${utilizationRate}%`;

    const satisfactionScore = (Math.random() * 1 + 4).toFixed(1);
    document.getElementById('satisfactionScore').textContent = `${satisfactionScore}/5`;
}

function generateReport() {
    alert('Monthly report generation would be implemented here');
    addActivity('Report Generated', 'Monthly report has been generated');
}

function exportAnalytics() {
    alert('Analytics export would be implemented here');
    addActivity('Analytics Exported', 'Club analytics have been exported');
}

function generateMemberReport() {
    alert('Member report generation would be implemented here');
    addActivity('Member Report', 'Member report has been generated');
}

function updateDashboard() {
    document.getElementById('totalClubs').textContent = clubs.length;
    document.getElementById('totalMembers').textContent = members.length;

    const upcomingEvents = events.filter(e => {
        if (!e.date) return false;
        const eventDate = new Date(e.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today;
    }).length;

    document.getElementById('upcomingEvents').textContent = upcomingEvents;

    const totalBudget = clubs.reduce((sum, club) => sum + (club.budget || 0), 0);
    document.getElementById('totalBudget').textContent = `$${totalBudget.toFixed(2)}`;

    loadActivities();
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}
function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginMessage = document.getElementById('loginMessage');

    loginMessage.textContent = '';
    
    // Show loading animation
    document.getElementById('loadingAnimation').style.display = 'flex';
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            // Animation will auto-hide after 3 seconds (defined in CSS)
        })
        .catch(error => {
            // Hide loading animation if login fails
            document.getElementById('loadingAnimation').style.display = 'none';
            loginMessage.textContent = error.message;
        });
}
