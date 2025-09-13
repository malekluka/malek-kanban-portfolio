import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Zap, Tag, Plus } from 'lucide-react';
import TaskCard from './TaskCard';

export default function Column({
  column,
  visibleTasks,
  addTask,
  updateTask,
  deleteTask,
  editingTask,
  setEditingTask,
  handleDragStart,
  handleDragEnd,
  getPriorityColor,
  getColumnIndicatorColor,
  updateColumn,
  deleteColumn
 }) {
   const [openMenu, setOpenMenu] = useState(false);
   const [editingTitle, setEditingTitle] = useState(column.title);
   const [editingLimit, setEditingLimit] = useState(column.limit ?? '');
   const [isMobileMenu, setIsMobileMenu] = useState(false);

   useEffect(() => {
     setIsMobileMenu(window.innerWidth < 640);
     const onResize = () => setIsMobileMenu(window.innerWidth < 640);
     window.addEventListener('resize', onResize);
     return () => window.removeEventListener('resize', onResize);
   }, []);

   const handleSaveColumn = () => {
     const parsedLimit = editingLimit === '' ? null : Number(editingLimit);
     updateColumn(column.id, { title: editingTitle, limit: parsedLimit });
     setOpenMenu(false);
   };

   return (
    <div className="min-w-80 transition-all duration-200 touch-none" onDragOver={(event) => event.preventDefault()} onDrop={() => { /* handled by parent via onDrop on wrapper */ }}>
      <div className="rounded-lg border bg-card/60 backdrop-blur-sm text-card-foreground shadow-sm h-fit relative">
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${getColumnIndicatorColor(column.color)} shadow-sm`} />
              <h2 className="font-semibold text-card-foreground">{column.title}</h2>
              <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                {visibleTasks.length}
                {column.limit && `/${column.limit}`}
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <button onClick={() => addTask(column.id)} className="text-muted-foreground hover:text-primary hover:bg-accent p-2 rounded-md transition-colors"><Plus size={16}/></button>
              <button onClick={() => setOpenMenu(prev => !prev)} className="text-muted-foreground hover:text-card-foreground hover:bg-accent p-2 rounded-md transition-colors"><MoreHorizontal size={16}/></button>
            </div>
          </div>

          {openMenu && (
            isMobileMenu ? (
              <div className="fixed inset-x-4 bottom-4 z-50 bg-background border p-4 rounded-lg shadow" onClick={(e) => e.stopPropagation()}>
                {/* mobile bottom sheet */}
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Column title</label>
                    <input value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} className="w-full bg-transparent outline-none text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">WIP limit</label>
                    <input value={editingLimit} onChange={(e) => setEditingLimit(e.target.value)} className="w-full bg-transparent outline-none text-sm mt-1" placeholder="leave empty for no limit" />
                  </div>
                  <div className="flex justify-between">
                    <button onClick={() => { setOpenMenu(false); setEditingTitle(column.title); setEditingLimit(column.limit ?? ''); }} className="text-sm text-muted-foreground px-3 py-1">Cancel</button>
                    <button onClick={() => { handleSaveColumn(); setOpenMenu(false); }} className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded">Save</button>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <button onClick={() => { if (window.confirm('Delete column and its tasks?')) deleteColumn(column.id); }} className="text-sm text-destructive px-3 py-1">Delete column</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-md bg-background border absolute right-4 top-16 w-60 z-20 shadow">
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Column title</label>
                    <input value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} className="w-full bg-transparent outline-none text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">WIP limit</label>
                    <input value={editingLimit} onChange={(e) => setEditingLimit(e.target.value)} className="w-full bg-transparent outline-none text-sm mt-1" placeholder="leave empty for no limit" />
                  </div>
                  <div className="flex justify-between">
                    <button onClick={() => { setOpenMenu(false); setEditingTitle(column.title); setEditingLimit(column.limit ?? ''); }} className="text-sm text-muted-foreground px-3 py-1">Cancel</button>
                    <button onClick={handleSaveColumn} className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded">Save</button>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <button onClick={() => { if (window.confirm('Delete column and its tasks?')) deleteColumn(column.id); }} className="text-sm text-destructive px-3 py-1">Delete column</button>
                  </div>
                </div>
              </div>
            )
           )}

          {column.limit && column.tasks.length >= column.limit && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <Zap size={14} className="text-amber-600" />
                <p className="text-amber-700 dark:text-amber-300 text-xs font-medium">WIP limit reached ({column.limit})</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          {/* use vertical stacked layout for cards so each card is full-width and consistent */}
          <div className="space-y-3 min-h-32">
            {visibleTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3"><Tag size={20}/></div>
                <p className="text-sm mb-2">No tasks</p>
                <button onClick={() => addTask(column.id)} className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">Add task</button>
              </div>
            ) : (
              visibleTasks.map(task => (
                <TaskCard key={task.id} task={task} columnId={column.id} editingTask={editingTask} setEditingTask={setEditingTask} updateTask={updateTask} deleteTask={deleteTask} handleDragStart={handleDragStart} handleDragEnd={handleDragEnd} getPriorityColor={getPriorityColor} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
