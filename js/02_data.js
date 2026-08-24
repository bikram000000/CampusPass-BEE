// 2. DEMO DATA - arrays + objects
// ------------------------------------------------------------
function createDemoEvents() {
  const events = getEvents();
  if (events.length > 0) return;

  const demoEvents = [
    {
      id: 1,
      title: 'Web Development Workshop',
      category: 'Workshops',
      date: '2026-09-10',
      time: '10:00',
      venue: 'Computer Lab 2',
      seats: 40,
      booked: 0,
      price: 0,
      description: 'Learn the basics of HTML, CSS and JavaScript by creating a simple web page.',
      organizer: 'Dr. Aditi Sharma',
      ownerEmail: 'faculty@campus.edu',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80',
    },
    {
      id: 2,
      title: 'Annual Cultural Fest',
      category: 'Cultural',
      date: '2026-09-18',
      time: '17:00',
      venue: 'Main Auditorium',
      seats: 150,
      booked: 0,
      price: 100,
      description: 'Enjoy music, dance, art and student performances at the annual cultural festival.',
      organizer: 'Prof. Nisha Mehta',
      ownerEmail: 'faculty2@campus.edu',
      image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=80',
    },
    {
      id: 3,
      title: 'Campus Hackathon',
      category: 'Hackathons',
      date: '2026-09-25',
      time: '09:00',
      venue: 'Innovation Centre',
      seats: 80,
      booked: 0,
      price: 0,
      description: 'Create a useful prototype with your team in one exciting day.',
      organizer: 'Innovation Club',
      ownerEmail: 'faculty3@campus.edu',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=80',
    },
    {
      id: 4,
      title: 'Inter-College Basketball',
      category: 'Sports',
      date: '2026-10-03',
      time: '08:30',
      venue: 'University Sports Arena',
      seats: 120,
      booked: 0,
      price: 30,
      description: 'Cheer for campus teams as colleges compete for the championship trophy.',
      organizer: 'Sports Committee',
      ownerEmail: 'faculty4@campus.edu',
      image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1000&q=80',
    }
  ];

  saveEvents(demoEvents);
}

function createDemoFacultyAccounts() {
  const accounts = getAccounts();
  if (accounts.length > 0) return;

  const facultyAccounts = [
    {
      name: 'Demo Faculty',
      email: 'faculty@campus.edu',
      department: 'Computer Science',
      role: 'faculty',
      password: '123456'
    },
    {
      name: 'Demo Professor',
      email: 'faculty2@campus.edu',
      department: 'Management',
      role: 'faculty',
      password: '123456'
    }
  ];

  saveAccounts(facultyAccounts);
}

// ------------------------------------------------------------
