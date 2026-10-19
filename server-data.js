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


// More campus experiences use the same array/object concepts as the CA1 seed.
demoEvents.push(
  { id: 5, title: 'Ideas Worth Sharing', category: 'Seminars', time: '14:00', venue: 'Lecture Theatre A', seats: 90, booked: 0, price: 0, description: 'An afternoon of student talks, fresh perspectives and conversations with campus mentors.', image: '' },
  { id: 6, title: 'Open Mic Under the Stars', category: 'Cultural', time: '18:30', venue: 'Amphitheatre', seats: 100, booked: 0, price: 75, description: 'Poetry, acoustic sets and stories from your campus community. Bring your friends for an evening of live performances.', image: '' },
  { id: 7, title: 'Design Your First Product', category: 'Workshops', time: '11:00', venue: 'Innovation Centre', seats: 30, booked: 0, price: 150, description: 'Turn a simple problem into a product concept through hands-on exercises, sketching and peer feedback.', image: '' },
  { id: 8, title: 'Tech & Ideas Showcase', category: 'Technical', time: '10:30', venue: 'Exhibition Hall', seats: 120, booked: 0, price: 0, description: 'Discover student-built prototypes, meet the teams behind them and explore ideas taking shape across campus.', image: '' }
);
// Relative dates keep the classroom demo bookable whenever it is started.
demoEvents.forEach(function (event, index) {
  const date = new Date();
  date.setDate(date.getDate() + 2 + index * 3);
  event.date = date.toISOString().slice(0, 10);
  event.ownerEmail = 'faculty@campus.edu';
  event.organizer = 'Campus Activities Office';
});
module.exports = demoEvents;
