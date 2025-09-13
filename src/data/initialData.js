// src/data/initialData.js
const initialData = {
  columns: [
    {
      id: 'backlog',
      title: 'Backlog',
      color: 'slate',
      limit: null,
      tasks: [
        {
          id: '1',
          title: 'User Authentication System',
          description: 'Implement JWT-based authentication with role management and password reset functionality',
          priority: 'high',
          status: 'todo',
          assignee: { name: 'Sarah Chen', initials: 'SC', color: 'from-pink-500 to-purple-600' },
          dueDate: '2025-09-05',
          tags: ['Backend', 'Security', 'API'],
          subtasks: { items: [
            { id: 's1', title: 'Setup JWT library', done: true },
            { id: 's2', title: 'Create auth middleware', done: true },
            { id: 's3', title: 'Build login endpoint', done: false },
            { id: 's4', title: 'Add password reset', done: false },
            { id: 's5', title: 'Role management', done: false }
          ], completed: 2, total: 5 },
          comments: 3,
          createdAt: '2025-08-20'
        },
        {
          id: '2', 
          title: 'Mobile App Redesign',
          description: 'Complete UI/UX overhaul for mobile experience with new design system',
          priority: 'medium',
          status: 'todo',
          assignee: { name: 'Alex Kim', initials: 'AK', color: 'from-blue-500 to-cyan-600' },
          dueDate: '2025-09-12',
          tags: ['Design', 'Mobile', 'UX'],
          subtasks: { items: [
            { id: 's6', title: 'User research', done: true },
            { id: 's7', title: 'Wireframes', done: false },
            { id: 's8', title: 'Visual design', done: false },
            { id: 's9', title: 'Prototyping', done: false },
            { id: 's10', title: 'User testing', done: false }
          ], completed: 1, total: 5 },
          comments: 7,
          createdAt: '2025-08-22'
        }
      ]
    },
    {
      id: 'todo',
      title: 'To Do',
      color: 'blue',
      limit: 5,
      tasks: [
        {
          id: '3',
          title: 'API Rate Limiting',
          description: 'Implement Redis-based rate limiting for all API endpoints',
          priority: 'high',
          status: 'todo',
          assignee: { name: 'Mike Johnson', initials: 'MJ', color: 'from-green-500 to-emerald-600' },
          dueDate: '2025-09-01',
          tags: ['Backend', 'Performance'],
          subtasks: { items: [
            { id: 's11', title: 'Setup Redis', done: false },
            { id: 's12', title: 'Rate limit middleware', done: false },
            { id: 's13', title: 'Testing', done: false }
          ], completed: 0, total: 3 },
          comments: 2,
          createdAt: '2025-08-28'
        }
      ]
    },
    {
      id: 'progress',
      title: 'In Progress',
      color: 'amber',
      limit: 3,
      tasks: [
        {
          id: '4',
          title: 'Payment Integration',
          description: 'Integrate Stripe payment processing with webhook handling',
          priority: 'high',
          status: 'in-progress',
          assignee: { name: 'Emma Davis', initials: 'ED', color: 'from-orange-500 to-red-600' },
          dueDate: '2025-09-02',
          tags: ['Backend', 'Payments'],
          subtasks: { items: [
            { id: 's14', title: 'Stripe setup', done: true },
            { id: 's15', title: 'Payment endpoints', done: true },
            { id: 's16', title: 'Webhook handling', done: true },
            { id: 's17', title: 'Error handling', done: true },
            { id: 's18', title: 'Testing', done: false },
            { id: 's19', title: 'Documentation', done: false },
            { id: 's20', title: 'Security review', done: false }
          ], completed: 4, total: 7 },
          comments: 12,
          createdAt: '2025-08-18'
        }
      ]
    },
    {
      id: 'review',
      title: 'Code Review',
      color: 'purple',
      limit: 2,
      tasks: [
        {
          id: '5',
          title: 'Security Audit',
          description: 'Complete security review for authentication module',
          priority: 'high',
          status: 'in-progress',
          assignee: { name: 'David Wilson', initials: 'DW', color: 'from-purple-500 to-indigo-600' },
          dueDate: '2025-08-31',
          tags: ['Security', 'Review'],
          subtasks: { items: [
            { id: 's21', title: 'Code analysis', done: true },
            { id: 's22', title: 'Vulnerability scan', done: true },
            { id: 's23', title: 'Report writing', done: false }
          ], completed: 2, total: 3 },
          comments: 5,
          createdAt: '2025-08-26'
        }
      ]
    },
    {
      id: 'done',
      title: 'Done',
      color: 'green',
      limit: null,
      tasks: [
        {
          id: '6',
          title: 'Database Schema Design',
          description: 'Finalized PostgreSQL schema with proper indexing and relationships',
          priority: 'high',
          status: 'done',
          assignee: { name: 'Lisa Park', initials: 'LP', color: 'from-teal-500 to-blue-600' },
          dueDate: '2025-08-25',
          tags: ['Database', 'Architecture'],
          subtasks: { items: [
            { id: 's24', title: 'Schema design', done: true },
            { id: 's25', title: 'Index optimization', done: true },
            { id: 's26', title: 'Relationships mapping', done: true },
            { id: 's27', title: 'Performance testing', done: true }
          ], completed: 4, total: 4 },
          comments: 8,
          createdAt: '2025-08-15'
        }
      ]
    }
  ]
};

export default initialData;