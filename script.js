
const firebaseConfig = {
    apiKey: "AIzaSyCnW0JTFtOd_9FKwh1_Dxv0SNDSVTYZBpU",
    authDomain: "clubhub-management.firebaseapp.com",
    projectId: "clubhub-management",
    storageBucket: "clubhub-management.appspot.com",
    messagingSenderId: "753620100397",
    appId: "1:753620100397:web:8ee4b70d926a0a5a099fa4"
};

const statusMessages = [
    "Initializing platform...",
    "Loading club data...",
    "Connecting to database...",
    "Preparing your dashboard...",
    "Almost ready..."
];

let currentMessageIndex = 0;
let statusInterval;

function updateStatusText() {
    const statusText = document.getElementById('statusText');
    statusText.textContent = statusMessages[currentMessageIndex];
    currentMessageIndex = (currentMessageIndex + 1) % statusMessages.length;
}

function showLoader() {
    const loader = document.getElementById('loader');
    loader.classList.remove('hidden');
    statusInterval = setInterval(updateStatusText, 1000);
    updateStatusText();
}

function hideLoader() {
    const loader = document.getElementById('loader');
    loader.classList.add('hidden');
    if (statusInterval) {
        clearInterval(statusInterval);
    }
}

window.addEventListener('load', () => {
    showLoader();
    setTimeout(hideLoader, 5000);
});

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let clubs = [];
let members = [];
let events = [];

const membersPerPage = 10;
let currentPage = 1;
let filteredMembers = [];

function loadAllData() {
    db.collection('clubs').orderBy('name').onSnapshot(snapshot => {
        clubs = [];
        snapshot.forEach(doc => {
            clubs.push({ id: doc.id, ...doc.data() });
        });
        updateStats();
        renderClubs();
        populateClubDropdown();
    });

    db.collection('members').orderBy('name').onSnapshot(snapshot => {
        members = [];
        snapshot.forEach(doc => {
            const memberData = doc.data();
            // Ensure clubId exists in member data
            if (!memberData.clubId) {
                console.warn(`Member ${doc.id} is missing clubId`);
            }
            members.push({ id: doc.id, ...memberData });
        });
        filteredMembers = [...members];
        updateStats();
        renderMembers();
        renderLeaders();
        renderClubs();
    });

    db.collection('events').orderBy('date').onSnapshot(snapshot => {
        events = [];
        snapshot.forEach(doc => {
            events.push({ id: doc.id, ...doc.data() });
        });
        updateStats();
        renderEvents();
    });
}

function populateClubDropdown() {
    const dropdown = document.getElementById('clubInterest');
    dropdown.innerHTML = '<option value="">Select a club</option>';

    clubs.forEach(club => {
        const option = document.createElement('option');
        option.value = club.id;
        option.textContent = club.name;
        dropdown.appendChild(option);
    });
}

function updateStats() {
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

    const categories = [...new Set(clubs.map(club => club.category))];
    document.getElementById('clubCategories').textContent = categories.length;
}

function renderClubs() {
    const clubsList = document.getElementById('clubsList');
    clubsList.innerHTML = '';

    clubs.forEach(club => {
        console.log(`Club: ${club.id} - ${club.name}`);
        const clubMembers = members.filter(m => {
            console.log(`Member ${m.name} has clubId: ${m.clubId}`);
            return m.clubId === club.id;
        });

        const memberCount = clubMembers.length;
        console.log(`Member count: ${memberCount}`);

        const clubCard = document.createElement('div');
        clubCard.className = 'club-card';
        clubCard.innerHTML = `
            <h3>${club.name}</h3>
            <p>${club.description || 'No description available'}</p>
            <div class="club-meta">
                <span class="club-category">${club.category || 'General'}</span>
                <span class="member-count">${memberCount} ${memberCount === 1 ? 'member' : 'members'}</span>
            </div>
            ${club.imageUrl ? `<img src="${club.imageUrl}" alt="${club.name}" style="width:100%; border-radius:8px; margin-bottom:15px;">` : ''}
        `;
        clubsList.appendChild(clubCard);
    });
}

function renderEvents() {
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';

    const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

    const upcomingEvents = sortedEvents.filter(e => {
        if (!e.date) return false;
        const eventDate = new Date(e.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today;
    });

    upcomingEvents.slice(0, 5).forEach(event => {
        const club = clubs.find(c => c.id === event.clubId);
        const eventDate = new Date(event.date);

        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.innerHTML = `
                    <div class="event-date">${eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ${event.time || ''}</div>
                    <h3>${event.name}</h3>
                    <p>${event.description || 'No description available'}</p>
                    <div class="event-meta">
                        <span>📍 ${event.location || 'Location TBD'}</span>
                        <span>🏛️ ${club ? club.name : 'N/A'}</span>
                    </div>
                `;
        eventsList.appendChild(eventCard);
    });

    if (upcomingEvents.length === 0) {
        eventsList.innerHTML = '<p style="text-align: center; color: #6c757d;">No upcoming events scheduled yet.</p>';
    }
}

function renderMembers() {
    const membersList = document.getElementById('membersList');

    membersList.innerHTML = '';

    const startIndex = (currentPage - 1) * membersPerPage;
    const endIndex = startIndex + membersPerPage;
    const membersToShow = filteredMembers.slice(0, endIndex);

    membersToShow.forEach(member => {
        const club = clubs.find(c => c.id === member.clubId);

        const memberCard = document.createElement('div');
        memberCard.className = 'member-card';

        const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase();

        memberCard.innerHTML = `
                    <div class="member-avatar">${initials}</div>
                    <div class="member-info">
                        <div class="member-name">${member.name}</div>
                        <div>
                            <span class="member-role">${member.role || 'Member'}</span>
                            <span style="color: #6c757d; font-size: 0.9rem;"> • ${club ? club.name : 'No Club'}</span>
                        </div>
                    </div>
                `;
        membersList.appendChild(memberCard);
    });

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (endIndex >= filteredMembers.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'inline-block';
    }
}

function renderLeaders() {
    const leadersList = document.getElementById('leadersList');
    leadersList.innerHTML = '';

    const leadershipRoles = ['President', 'Vice President', 'Secretary', 'Treasurer'];
    const leaders = members.filter(m => leadershipRoles.includes(m.role));

    if (leaders.length === 0) {
        leadersList.innerHTML = '<p style="text-align: center; color: #6c757d;">No club leaders found.</p>';
        return;
    }

    leaders.forEach(member => {
        const club = clubs.find(c => c.id === member.clubId);

        const memberCard = document.createElement('div');
        memberCard.className = 'member-card';

        const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase();

        memberCard.innerHTML = `
                    <div class="member-avatar" style="background: #3a0ca3;">${initials}</div>
                    <div class="member-info">
                        <div class="member-name">${member.name}</div>
                        <div>
                            <span class="member-role" style="background: #3a0ca3; color: white;">${member.role}</span>
                            <span style="color: #6c757d; font-size: 0.9rem;"> • ${club ? club.name : 'No Club'}</span>
                        </div>
                    </div>
                `;
        leadersList.appendChild(memberCard);
    });
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');

    if (tabId === 'allMembers') {
        currentPage = 1;
        renderMembers();
    }
}

document.getElementById('clubSearch').addEventListener('input', function (e) {
    const query = e.target.value.toLowerCase();
    const clubCards = document.querySelectorAll('.club-card');

    clubCards.forEach(card => {
        const name = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        const category = card.querySelector('.club-category').textContent.toLowerCase();

        if (name.includes(query) || description.includes(query) || category.includes(query)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
});

document.getElementById('memberSearch').addEventListener('input', function (e) {
    const query = e.target.value.toLowerCase();
    filteredMembers = members.filter(member => {
        const name = member.name.toLowerCase();
        const role = (member.role || '').toLowerCase();
        const club = clubs.find(c => c.id === member.clubId);
        const clubName = club ? club.name.toLowerCase() : '';

        return name.includes(query) || role.includes(query) || clubName.includes(query);
    });

    currentPage = 1;
    renderMembers();
});

document.getElementById('loadMoreBtn').addEventListener('click', function () {
    currentPage++;
    renderMembers();

    const membersList = document.getElementById('membersList');
    membersList.lastElementChild.scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('joinForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const form = e.target;
    const formData = {
        name: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        grade: document.getElementById('grade').value,
        clubId: document.getElementById('clubInterest').value,
        message: document.getElementById('message').value,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const club = clubs.find(c => c.id === formData.clubId);
    formData.clubName = club ? club.name : 'Unknown Club';

    db.collection('membershipRequests').add(formData)
        .then(() => {
            form.reset();
            document.getElementById('formSuccess').style.display = 'block';

            form.style.display = 'none';

            setTimeout(() => {
                document.getElementById('formSuccess').style.display = 'none';
                form.style.display = 'block';
            }, 5000);
        })
        .catch(error => {
            console.error('Error submitting form:', error);
            alert('There was an error submitting your application. Please try again.');
        });
});

window.addEventListener('DOMContentLoaded', () => {
    loadAllData();
});

