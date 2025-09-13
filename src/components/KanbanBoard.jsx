import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Search, Filter, Bell, User, Menu, Trash } from 'lucide-react';
import Column from './Column';
import initialData from '../data/initialData'; // moved initial data to separate file

const LOCAL_STORAGE_KEY = 'kanban_columns_v1';

const KanbanBoard = () => {
  // State management
  const [columns, setColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialData.columns;
    } catch {
      return initialData.columns;
    }
  });
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);
  const [draggedOverBin, setDraggedOverBin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  // filter and notifications state
  const [filterOpen, setFilterOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 'n1', text: 'Payment Integration received 2 new comments', time: '2h', read: false },
    { id: 'n2', text: 'API Rate Limiting deployed', time: '1d', read: false }
  ]);
  // responsive header/menu state
  const [isMobile, setIsMobile] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerRef = useRef(null);
     // helper to push notifications (dedup within short window)
  const recentNotifRef = useRef(new Map()); // message -> timestamp ms
  const NOTIF_DEDUPE_MS = 3000; // suppress duplicates within 3 seconds
  const pushNotification = useCallback((text) => {
    const now = Date.now();
    const last = recentNotifRef.current.get(text);
    if (last && now - last < NOTIF_DEDUPE_MS) {
      // duplicate within timeframe -> skip
      return;
    }
    recentNotifRef.current.set(text, now);
    // prune map if too large (keep it small)
    if (recentNotifRef.current.size > 200) {
      const entries = Array.from(recentNotifRef.current.entries()).slice(-100);
      recentNotifRef.current.clear();
      entries.forEach(([k, v]) => recentNotifRef.current.set(k, v));
    }
    setNotifications(prev => [{ id: `n${Date.now()}`, text, time: 'now', read: false }, ...prev].slice(0, 50));
  }, []);

  // per-day sent notifications (used for due-date checks)
  const sentNotificationsRef = useRef(new Set());

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD only

    columns.forEach(col => {
      col.tasks.forEach(task => {
        const due = new Date(task.dueDate);
        const diff = Math.ceil((due - new Date(today)) / (1000 * 60 * 60 * 24));
        const notifKey = `${task.id}-${today}`; // unique per day per task

        if (!sentNotificationsRef.current.has(notifKey)) {
          if (diff < 0) {
            pushNotification(`⚠️ Task "${task.title}" is overdue by ${Math.abs(diff)} day(s)`);
            sentNotificationsRef.current.add(notifKey);
          } else if (diff === 1) {
            pushNotification(`⏰ Task "${task.title}" is due tomorrow`);
            sentNotificationsRef.current.add(notifKey);
          }
        }
      });
    });
  }, [columns, pushNotification]);



  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // persist columns to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(columns));
    } catch {
      // ignore
    }
  }, [columns]);

  // Calculate real task counts by status (not by column)
  const getTaskCounts = useCallback(() => {
    const allTasks = columns.flatMap(col => col.tasks);
    const totalTasks = allTasks.length;
    const todoTasks = allTasks.filter(task => task.status === 'todo').length;
    const inProgressTasks = allTasks.filter(task => task.status === 'in-progress').length;
    const doneTasks = allTasks.filter(task => task.status === 'done').length;
    
    return { totalTasks, todoTasks, inProgressTasks, doneTasks };
  }, [columns]);
  
  // helper to match search
  const matchesQuery = useCallback((task, query) => {
    // search
    const q = (query || '').trim().toLowerCase();
    const matchesSearch = !q || (
      (task.title && task.title.toLowerCase().includes(q)) ||
      (task.description && task.description.toLowerCase().includes(q)) ||
      (task.tags && task.tags.join(' ').toLowerCase().includes(q)) ||
      (task.assignee && task.assignee.name.toLowerCase().includes(q))
    );

    // priority filter
    const matchesPriority = priorityFilter === 'all' || (task.priority === priorityFilter);

    // tag filter (simple substring match)
    const tagQ = (tagFilter || '').trim().toLowerCase();
    const matchesTag = !tagQ || (task.tags && task.tags.join(' ').toLowerCase().includes(tagQ));

    return matchesSearch && matchesPriority && matchesTag;
  }, [priorityFilter, tagFilter]);
  
  // close filter/notifications when clicking outside header
  useEffect(() => {
    const onDocClick = (e) => {
      if (!headerRef.current) return;
      if (!headerRef.current.contains(e.target)) {
        setFilterOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const toggleNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const clearNotifications = () => setNotifications([]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e, task, columnId) => {
    setDraggedTask({ task, sourceColumnId: columnId });
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.6';
  }, []);

  const handleDragEnd = useCallback((e) => {
    e.target.style.opacity = '1';
    setDraggedTask(null);
    setDraggedOverColumn(null);
    setDraggedOverBin(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((columnId) => {
    setDraggedOverColumn(columnId);
  }, []);


  const handleDrop = useCallback((e, targetColumnId) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.sourceColumnId === targetColumnId) return;

    // compute friendly column titles for notification
    const sourceCol = columns.find(c => c.id === draggedTask.sourceColumnId);
    const targetCol = columns.find(c => c.id === targetColumnId);
    const sourceTitle = sourceCol ? sourceCol.title : draggedTask.sourceColumnId;
    const targetTitle = targetCol ? targetCol.title : targetColumnId;
    const taskTitle = draggedTask.task.title || draggedTask.task.id;

    setColumns(prevColumns => {
      return prevColumns.map(column => {
        if (column.id === draggedTask.sourceColumnId) {
          return {
            ...column,
            tasks: column.tasks.filter(task => task.id !== draggedTask.task.id)
          };
        } else if (column.id === targetColumnId) {
          return {
            ...column,
            tasks: [...column.tasks, draggedTask.task]
          };
        }
        return column;
      });
    });

    // notify about the move
    pushNotification(`Moved: "${taskTitle}" from ${sourceTitle} → ${targetTitle}`);

  }, [draggedTask, columns, pushNotification]);
  
  // Handlers for floating trash bin
  // Delete without confirm (used by drop-to-trash)
  const deleteWithoutConfirm = useCallback((columnId, taskId) => {
    setColumns(prevColumns =>
      prevColumns.map(col =>
        col.id === columnId
          ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
          : col
      )
    );
    setEditingTask(prev => (prev && prev.columnId === columnId && prev.taskId === taskId ? null : prev));
  }, []);

   const onBinDragOver = useCallback((e) => {
     e.preventDefault();
     setDraggedOverBin(true);
   }, []);
   const onBinDragLeave = useCallback(() => setDraggedOverBin(false), []);
   const onBinDrop = useCallback((e) => {
     e.preventDefault();
     if (!draggedTask) return;
     // delete without confirmation for faster UX
     deleteWithoutConfirm(draggedTask.sourceColumnId, draggedTask.task.id);
     setDraggedTask(null);
     setDraggedOverBin(false);
   }, [draggedTask, deleteWithoutConfirm]);

  // Add new task
  const addTask = useCallback((columnId) => {
    const newTask = {
      id: Date.now().toString(),
      title: 'New Task',
      description: 'Click to edit this task description and add details',
      priority: 'medium',
      status: 'todo',
      assignee: { name: 'Unassigned', initials: 'UN', color: 'from-gray-400 to-gray-500' },
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tags: ['New'],
      subtasks: { items: [], completed: 0, total: 0 },
      comments: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setColumns(prevColumns =>
      prevColumns.map(column =>
        column.id === columnId
          ? { ...column, tasks: [...column.tasks, newTask] }
          : column
      )
    );
    pushNotification(`🆕 New task "${newTask.title}" created in ${columnId}`);


    // open edit for newly created task
    setEditingTask({ columnId, taskId: newTask.id });
  }, [pushNotification]);


  // Update task with provided fields (partial or full)
const updateTask = useCallback((columnId, taskId, updatedTask) => {
  setColumns(prevColumns =>
    prevColumns.map(col => {
      if (col.id !== columnId) return col;
      return {
        ...col,
        tasks: col.tasks.map(t => {
          if (t.id !== taskId) return t;

          const updated = { ...t, ...updatedTask };
          let notification = null; // only one message per update

          // ✅ Auto-complete when all subtasks done
          if (
            updated.subtasks &&
            updated.subtasks.total > 0 &&
            updated.subtasks.completed === updated.subtasks.total &&
            updated.status !== 'done'
          ) {
            updated.status = 'done';
            notification = `✅ Task "${updated.title}" automatically completed (100% subtasks done)`;
          }

          // ✅ If no auto-complete, check status change
          else if (t.status !== updated.status) {
            if (updated.status === 'done') {
              notification = `✅ Task "${updated.title}" marked as done`;
            } else {
              notification = `🔄 Task "${updated.title}" moved from ${t.status} → ${updated.status}`;
            }
          }

          // ✅ Priority change (only if no status change notif triggered)
          else if (t.priority !== updated.priority) {
            notification = `⚡ Priority changed for "${updated.title}": ${t.priority} → ${updated.priority}`;
          }

          // ✅ Generic edit (title/description)
          else if (
            t.title !== updated.title ||
            t.description !== updated.description
          ) {
            notification = `✏️ Task "${updated.title}" updated`;
          }

          // push only one notification
          if (notification) {
            setTimeout(() => pushNotification(notification), 0);
          }

          return updated;
        }),
      };
    })
  );
}, [pushNotification]);



  

  // Delete task
  const deleteTask = useCallback((columnId, taskId) => {
    if (!window.confirm('Delete this task? This action cannot be undone.')) return;
    setColumns(prevColumns =>
      prevColumns.map(col =>
        col.id === columnId
          ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
          : col
      )
    );
    setEditingTask(prev => (prev && prev.columnId === columnId && prev.taskId === taskId ? null : prev));
  }, []);

  // Update column (title, limit)
  const updateColumn = useCallback((columnId, updates) => {
    setColumns(prev => prev.map(c => c.id === columnId ? { ...c, ...updates } : c));
  }, []);

  const deleteColumn = useCallback((columnId) => {
    setColumns(prev => prev.filter(c => c.id !== columnId));
  }, []);

  // Utility functions
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800';
      case 'low': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getColumnIndicatorColor = (color) => {
    const colors = {
      slate: 'bg-slate-500',
      blue: 'bg-blue-500',
      amber: 'bg-amber-500',
      purple: 'bg-purple-500',
      green: 'bg-green-500'
    };
    return colors[color] || 'bg-gray-500';
  };

 

  // Add a new column (quick prompt)
  const addColumn = useCallback(() => {
    const title = window.prompt('New column title');
    if (!title || !title.trim()) return;
    const id = `${title.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const newCol = { id, title: title.trim(), color: 'slate', limit: null, tasks: [] };
    setColumns(prev => [...prev, newCol]);
    pushNotification(`Column "${newCol.title}" created`);
  }, [pushNotification]);
  
  // Get current task counts
  const { totalTasks, todoTasks, inProgressTasks, doneTasks } = getTaskCounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Professional Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
  <div className="flex items-center space-x-4">
    <div>
      <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
        Project Dashboard
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Sprint 2025.3 • {totalTasks} active tasks
      </p>
    </div>
  </div>

  {/* Centered Search Bar */}
  <div className="w-1/3 hidden sm:flex items-center space-x-2 bg-muted/50 rounded-lg px-3 py-2 border absolute left-1/2 transform -translate-x-1/2">
    <Search size={16} className="text-muted-foreground" />
    <input 
      placeholder="Search tasks..." 
      className="bg-transparent text-sm outline-none w-80 text-foreground placeholder:text-muted-foreground"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  </div>
  
  <button onClick={() => setHeaderMenuOpen(prev => !prev)} className="sm:hidden p-2 rounded-md border">
    <Menu size={16} />
  </button>
  <div className="hidden sm:flex items-center space-x-3" ref={headerRef}>
              
              {/* Filter */}
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setFilterOpen(prev => !prev); setNotificationsOpen(false); }} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-3 py-2">
                  <Filter size={16} className="mr-2" />
                  Filter
                </button>
                {filterOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-background border shadow z-30 p-3 rounded">
                    <div className="text-xs text-muted-foreground mb-2">Priority</div>
                    <div className="flex gap-2 mb-3">
                      <button onClick={() => setPriorityFilter('all')} className={`px-2 py-1 rounded ${priorityFilter==='all' ? 'bg-primary text-primary-foreground' : 'border'}`}>All</button>
                      <button onClick={() => setPriorityFilter('high')} className={`px-2 py-1 rounded ${priorityFilter==='high' ? 'bg-red-500 text-white' : 'border'}`}>High</button>
                      <button onClick={() => setPriorityFilter('medium')} className={`px-2 py-1 rounded ${priorityFilter==='medium' ? 'bg-amber-500 text-white' : 'border'}`}>Medium</button>
                      <button onClick={() => setPriorityFilter('low')} className={`px-2 py-1 rounded ${priorityFilter==='low' ? 'bg-green-500 text-white' : 'border'}`}>Low</button>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">Tag</div>
                    <input value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} placeholder="filter by tag" className="w-full mb-3 bg-transparent outline-none border px-2 py-1 rounded text-sm" />
                    <div className="flex justify-between">
                      <button onClick={() => { setPriorityFilter('all'); setTagFilter(''); setFilterOpen(false); }} className="text-sm text-muted-foreground px-3 py-1">Clear</button>
                      <button onClick={() => setFilterOpen(false)} className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded">Done</button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterOpen(false);
                    setNotificationsOpen(prev => {
                      const opening = !prev;
                      if (opening) setNotifications(n => n.map(x => ({ ...x, read: true })));
                      return opening;
                    });
                  }}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground p-2 relative"
                >
                  <Bell size={16} />
                  {notifications.some(n => !n.read) && <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-pulse"></span>}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-background border shadow z-30 p-2 rounded">
                    <div className="flex items-center justify-between px-2 py-1 border-b mb-2">
                      <div className="text-sm font-medium">Notifications</div>
                      <button onClick={clearNotifications} className="text-xs text-muted-foreground">Clear</button>
                    </div>
                    <div className="max-h-48 overflow-auto">
                      {notifications.length === 0 ? <div className="text-sm text-muted-foreground p-2">No notifications</div> : notifications.map(n => (
                        <div key={n.id} className="p-2 border-b last:border-b-0 flex items-start justify-between">
                          <div>
                            <div className={`text-sm ${n.read ? 'text-muted-foreground' : ''}`}>{n.text}</div>
                            <div className="text-xs text-muted-foreground">{n.time}</div>
                          </div>
                          {!n.read && <button onClick={() => toggleNotificationRead(n.id)} className="text-xs text-primary ml-2">Mark</button>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* New Column */}
              <button onClick={addColumn} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent px-3 py-2">
                <span className="mr-2">＋</span>Column
              </button>
              
               {/* Add Task */}
               <button onClick={() => addTask(columns.find(c => c.id === 'todo') ? 'todo' : columns[0].id)} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 shadow-sm">
                 <Plus size={16} className="mr-2" />
                 New Task
               </button>
             </div>
           </div>
         </div>
       </header>

    {/* Kanban Columns */}
<main className="container mx-auto p-6">
  {/* Non-mobile: preserve spacing and allow horizontal scrolling to add columns on the right.
      Mobile: stack vertically to avoid overlapping cards. */}
  {isMobile ? (
    <div className="flex flex-col gap-6 pb-6">
      {columns.map(column => {
        const visibleTasks = column.tasks.filter(task => matchesQuery(task, searchQuery));
        return (
          <div key={column.id} className={`w-full transition-all duration-200 ${draggedOverColumn === column.id ? 'scale-105 ring-2 ring-primary/30 shadow-lg' : ''}`} onDragOver={handleDragOver} onDragEnter={() => handleDragEnter(column.id)} onDragLeave={() => setDraggedOverColumn(null)} onDrop={(e) => handleDrop(e, column.id)}>
            <Column
              column={column}
              visibleTasks={visibleTasks}
              addTask={addTask}
              updateTask={updateTask}
              deleteTask={deleteTask}
              editingTask={editingTask}
              setEditingTask={setEditingTask}
              handleDragStart={handleDragStart}
              handleDragEnd={handleDragEnd}
              getPriorityColor={getPriorityColor}
              getColumnIndicatorColor={getColumnIndicatorColor}
              updateColumn={updateColumn}
              deleteColumn={deleteColumn}
            />
          </div>
        );
      })}
    </div>
  ) : (
    <div className="flex gap-6 pb-6 overflow-x-auto min-h-[calc(100vh-200px)]">
      {columns.map(column => {
        const visibleTasks = column.tasks.filter(task => matchesQuery(task, searchQuery));
        return (
          <div key={column.id} className={`min-w-80 transition-all duration-200 ${draggedOverColumn === column.id ? 'scale-105 ring-2 ring-primary/30 shadow-lg' : ''}`} onDragOver={handleDragOver} onDragEnter={() => handleDragEnter(column.id)} onDragLeave={() => setDraggedOverColumn(null)} onDrop={(e) => handleDrop(e, column.id)}>
            <Column
              column={column}
              visibleTasks={visibleTasks}
              addTask={addTask}
              updateTask={updateTask}
              deleteTask={deleteTask}
              editingTask={editingTask}
              setEditingTask={setEditingTask}
              handleDragStart={handleDragStart}
              handleDragEnd={handleDragEnd}
              getPriorityColor={getPriorityColor}
              getColumnIndicatorColor={getColumnIndicatorColor}
              updateColumn={updateColumn}
              deleteColumn={deleteColumn}
            />
          </div>
        );
      })}
    </div>
  )}
</main>
 
      {/* Floating Trash Bin - appears when dragging a task */}
      {draggedTask && (
        <div
          onDragOver={onBinDragOver}
          onDragEnter={onBinDragOver}
          onDragLeave={onBinDragLeave}
          onDrop={onBinDrop}
          className={`fixed left-1/2 -translate-x-1/2 bottom-6 z-50 transition-all duration-200 ${draggedOverBin ? 'scale-110' : 'scale-100'}`}
        >
          <div className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg ${draggedOverBin ? 'bg-destructive text-white' : 'bg-muted text-foreground'}`}>
            <Trash size={22} />
          </div>
          <div className="text-xs text-muted-foreground text-center mt-1">Drop to delete</div>
        </div>
      )}

      {/* Stats Footer */}
      <footer className="border-t bg-background/80 backdrop-blur-sm mt-8">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6 text-muted-foreground">
              <span>Total: <strong className="text-foreground">{totalTasks} tasks</strong></span>
              <span>To Do: <strong className="text-blue-600">{todoTasks}</strong></span>
              <span>In Progress: <strong className="text-amber-600">{inProgressTasks}</strong></span>
              <span>Completed: <strong className="text-green-600">{doneTasks}</strong></span>
            </div>
            
            <div className="flex items-center space-x-4 text-muted-foreground">
              <span>Last updated: just now</span>
              <button className="flex items-center space-x-1 hover:text-foreground transition-colors">
                <User size={14} />
                <span>Team</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile FAB */}
      <button onClick={() => addTask(columns.find(c => c.id === 'todo') ? 'todo' : columns[0].id)} className="fixed bottom-6 right-6 inline-flex items-center justify-center rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-14 w-14 shadow-lg hover:shadow-xl lg:hidden transition-all duration-200 group">
        <Plus size={24} className="group-hover:scale-110 transition-transform" />
      </button>

      {/* Mobile header menu overlay */}
      {headerMenuOpen && isMobile && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center" onClick={() => setHeaderMenuOpen(false)}>
          <div className="mt-20 w-full max-w-md bg-background border p-4 rounded shadow" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center mb-3">
              <Search size={16} className="text-muted-foreground mr-2" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tasks..." className="w-full bg-transparent outline-none" />
            </div>
            <div className="flex space-x-2 mb-3">
              <button onClick={() => { setFilterOpen(prev => !prev); setNotificationsOpen(false); }} className="flex-1 px-3 py-2 border rounded">Filter</button>
              <button onClick={() => { setNotificationsOpen(prev => !prev); setFilterOpen(false); }} className="flex-1 px-3 py-2 border rounded">Notifications</button>
            </div>
            {filterOpen && (
              <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-2">Priority</div>
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setPriorityFilter('all')} className={`px-2 py-1 rounded ${priorityFilter==='all' ? 'bg-primary text-primary-foreground' : 'border'}`}>All</button>
                  <button onClick={() => setPriorityFilter('high')} className={`px-2 py-1 rounded ${priorityFilter==='high' ? 'bg-red-500 text-white' : 'border'}`}>High</button>
                  <button onClick={() => setPriorityFilter('medium')} className={`px-2 py-1 rounded ${priorityFilter==='medium' ? 'bg-amber-500 text-white' : 'border'}`}>Medium</button>
                  <button onClick={() => setPriorityFilter('low')} className={`px-2 py-1 rounded ${priorityFilter==='low' ? 'bg-green-500 text-white' : 'border'}`}>Low</button>
                </div>
                <div className="text-xs text-muted-foreground mb-2">Tag</div>
                <input value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} placeholder="filter by tag" className="w-full mb-3 bg-transparent outline-none border px-2 py-1 rounded text-sm" />
                <div className="flex justify-between">
                  <button onClick={() => { setPriorityFilter('all'); setTagFilter(''); setFilterOpen(false); }} className="text-sm text-muted-foreground px-3 py-1">Clear</button>
                  <button onClick={() => setFilterOpen(false)} className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded">Done</button>
                </div>
              </div>
            )}
            {notificationsOpen && (
              <div className="mb-3">
                <div className="flex items-center justify-between px-2 py-1 border-b mb-2">
                  <div className="text-sm font-medium">Notifications</div>
                  <button onClick={() => setNotifications([])} className="text-xs text-muted-foreground">Clear</button>
                </div>
                <div className="max-h-48 overflow-auto">
                  {notifications.length === 0 ? <div className="text-sm text-muted-foreground p-2">No notifications</div> : notifications.map(n => (
                    <div key={n.id} className="p-2 border-b last:border-b-0 flex items-start justify-between">
                      <div>
                        <div className={`text-sm ${n.read ? 'text-muted-foreground' : ''}`}>{n.text}</div>
                        <div className="text-xs text-muted-foreground">{n.time}</div>
                      </div>
                      {!n.read && <button onClick={() => toggleNotificationRead(n.id)} className="text-xs text-primary ml-2">Mark</button>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <button onClick={() => { addTask(columns.find(c => c.id === 'todo') ? 'todo' : columns[0].id); setHeaderMenuOpen(false); }} className="w-full bg-primary text-primary-foreground px-3 py-2 rounded">New Task</button>
            </div>
          </div>
        </div>
      )}

      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 dark:bg-indigo-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-10 animate-pulse"></div>
      </div>
    </div>
  );
};

export default KanbanBoard;
    